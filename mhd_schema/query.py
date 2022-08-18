from __future__ import annotations

""" This file contains the main query and filter builder """
from PreJsPy import PreJsPy

from mhd_data.models import CodecManager, Codec, Item
from .models import Property, Collection

from typing import TYPE_CHECKING, TypeAlias, Type, Any, Optional, Iterable

if TYPE_CHECKING:

    SQL: TypeAlias = str
    # an sql query with parameters
    SQLWithParams: TypeAlias = tuple[SQL, list[int | str]]

    # the type used by filter annotations, for now just 'FilterAST'
    FilterAST: TypeAlias = Any


class QueryBuilder(object):
    """ The QueryBuilder class represents the class to build queries from """

    collection: Collection
    filter_builder: FilterBuilder

    def __init__(self, collection: Collection) -> None:
        self.collection = collection  # type: Collection

        # and create a filter builder
        self.filter_builder = FilterBuilder(
            self.collection)  # type: FilterBuilder

    @staticmethod
    def _prop_table(prop: Property) -> str:
        return '"T_{}"'.format(prop.slug)

    @staticmethod
    def _prop_value(prop: Property, index: int, sql: bool = True) -> str:
        if sql:
            return '"property_value_{}_{}"'.format(prop.slug, index)
        else:
            return 'property_value_{}_{}'.format(prop.slug, index)

    @staticmethod
    def _prop_cid(prop: Property) -> str:
        return '"property_cid_{}"'.format(prop.slug)

    def __call__(self, properties: Optional[Iterable[Property]], where: Optional[str], order: Optional[str], offset: Optional[int], limit: Optional[int], count_query: bool, use_view: Optional[str]) -> SQLWithParams:
        """ Builds an SQL query on this collection. See inline documentation for details of the query.

        :param properties: An iterable of properties to return. When omitted, all properties are returned.
        :param where: A WHERE string. When omitted, no WHERE clause in the query is generated. See FilterBuilder for details.
        :param order: Order of properties to return. When omitted, the default order of properties is used.
        :param offset: Offset to start return of elements at. If omitted no OFFSET is generated.
        :param limit: Maximal number of element to return. If omitted, no LIMIT clause is used.
        :param count_query: If True, return a query that SELECTs Count(*).
        :param use_view: An optional string containing the name of a view to use for generating this query. When omitted, a full join() clause is used.
        """

        SQL = ""
        SQL_ARGS = []

        # This command will build a query of the form:

        # SELECT
        #     id,
        #     prop1_value,prop1_cid,
        #     prop2_value,prop2_cid
        # FROM (
        #     SELECT I.id as id,

        #     T_prop1.value_0 as prop1_value_0, T_prop1.value_1 as prop1_value_1, T_prop1.id as prop1_cid,
        #     T_prop2.value_0 as prop2_value_0,  T_prop2.value_1 as prop2_value_1, T_prop2.id as prop2_cid

        #     FROM mhd_data_item as I

        #     JOIN mhd_data_item_collection as CI
        #     ON I.id = CI.item_id AND CI.collection_id = ${collection_id}

        #     LEFT OUTER JOIN Codec1 as T_prop1
        #     ON I.id = T_prop1.item_id AND T_prop1.active AND T_prop1.prop_id = ${id_of_prop1}

        #     LEFT OUTER JOIN Codec2 as T_prop2
        #     ON I.id = T_prop2.item_id AND T_prop2.active AND T_prop2.prop_id = ${id_of_prop2}
        # ) AS collection
        # WHERE
        #     {filter}
        # ORDER BY
        #     {order}
        # OFFSET {offset}
        # LIMIT {limit}

        # - When a (materialized) view is available, the JOIN() might be replaced by the (materialized) view.
        # - When count_mode is true, the SELECT clause will be replaced by COUNT(*) instead.
        # - All constants are returned as parameters to prevent SQL injection

        # if no properties were given, use all the properties
        if properties is None:
            properties = self.collection.properties()

        # build the outer SELECT()
        if not count_query:
            SQL += 'SELECT id'
            for prop in properties:

                SQL += ', '
                for i in range(len(prop.codec_model.get_value_fields())):
                    SQL += '{}, '.format(self._prop_value(prop, i))

                cid_field = self._prop_cid(prop)
                SQL += '{}'.format(cid_field)
        else:
            SQL += 'SELECT COUNT(*)'

        # build the FROM
        if use_view is None:
            # if we don't have a view, use the join()
            join_sql, join_sqlargs = self.join_builder()
            SQL += ' FROM ({}) AS collection'.format(
                join_sql
            )
            SQL_ARGS += join_sqlargs

        # if we have the view, use the view
        else:
            SQL += ' FROM {}'.format(
                use_view
            )

        # if we have a filter, use it
        if where is not None:
            filter_sql, filter_sqlargs = self.filter_builder(where)
            SQL += ' WHERE {}'.format(
                filter_sql
            )
            SQL_ARGS += filter_sqlargs

        # ORDER BY
        if order is not None:
            order_sql = self.order_builder(order, properties)
            SQL += ' ORDER BY {}'.format(
                order_sql
            )

        # LIMIT ... OFFSET ...
        if limit is not None:
            SQL += ' LIMIT %s'
            SQL_ARGS.append(limit)

            if offset is not None:
                SQL += ' OFFSET %s'
                SQL_ARGS.append(offset)

        # and finally return the sql and the arguments
        return SQL, SQL_ARGS

    def join_builder(self) -> SQLWithParams:
        """ Builds the JOIN() part of the query """

        # select all the properties
        SQL = 'SELECT I.id as id'
        SQL_ARGS: list[str | int] = []

        for prop in self.collection.properties():
            virtual_table = self._prop_table(prop)
            cid_field = self._prop_cid(prop)

            value_names = prop.codec_model.value_fields

            for (i, value_name) in enumerate(value_names):
                SQL += ', {}.{} as {}'.format(virtual_table,
                                              value_name, self._prop_value(prop, i))
            SQL += ', {}.id as {}'.format(virtual_table, cid_field)

        # from the item table
        SQL += ' FROM {} as I'.format(
            Item._meta.db_table
        )

        # (for items in the given collection)
        SQL += ' JOIN {} as CI ON I.id = CI.item_id AND CI.collection_id = %s'.format(
            Item.collections.through._meta.db_table,
        )
        SQL_ARGS.append(str(self.collection.pk))

        # return the properties
        for prop in self.collection.properties():
            # the physical table to look up the values in
            physical_table = prop.codec_model._meta.db_table
            virtual_table = self._prop_table(prop)

            # the join
            SQL += ' LEFT OUTER JOIN {} AS {}'.format(
                physical_table,
                virtual_table
            )

            SQL += ' ON I.id = {0:s}.item_id AND {0:s}.active AND {0:s}.prop_id = %s'.format(
                virtual_table
            )
            SQL_ARGS.append(str(prop.pk))

        # and return the sql and the arguments for the join()
        return SQL, SQL_ARGS

    def order_builder(self, order: str, properties: Iterable[Property]) -> SQL:
        """ Builds the order part of the query """
        property_dict: dict[str, Property] = {
            p.slug: p for p in properties}
        return ', '.join([self._parser_order(o, property_dict) for o in order.split(',')])

    def _parser_order(self, oslug: str, property_dict: dict[str, Property]) -> str:
        order = oslug.strip()
        if len(order) == 0:
            raise QueryBuilderError('Order string received empty property')

        mode = ''
        if oslug[0] == '+':
            mode = '+'
            oslug = oslug[1:]
        elif oslug[0] == '-':
            mode = '-'
            oslug = oslug[1:]

        oslug = oslug.strip()
        if len(oslug) == 0:
            raise QueryBuilderError('Order string received empty property')

        # if we don't know the property => raise
        if not oslug in property_dict:
            raise QueryBuilderError('Unknown property {}'.format(oslug))

        # build the order clause from the prop
        prop = property_dict[oslug]
        return prop.codec_model.order_clause(prop, mode)


class FilterBuilder(object):
    """ The FilterBuilder represents an object to build WHERE filters from """

    collection: Collection
    parser: PreJsPy

    def __init__(self, collection: Collection):
        self.collection = collection
        self._init_parser()

    def _init_parser(self) -> None:
        """ Setups up the parser initially """
        self.parser = PreJsPy()
        # constants: true, false, null
        self.parser.setConstants({'true': True, 'false': False, 'null': None})
        self.parser.setUnaryOperators(['!'])  # only a single unary operator
        self.parser.setTertiaryOperatorEnabled(False)  # no teriary operator

    def _update_parser(self) -> None:
        """ Updates the parser with the current configuration """

        bin_ops = {
            '||': 1, '&&': 1,
        }
        bin_ops.update(
            {op: 2 for op in CodecManager.collect_operators(self.collection.codecs)})

        self.parser.setBinaryOperators(bin_ops)

    def __call__(self, query: str) -> SQLWithParams:
        """ Parses a query for a given collection """

        # update the parser
        # because of this method we are not THREAD-SAFE
        self._update_parser()

        # parse into an AST
        try:
            result = self.parser.parse(query)  # type: FilterAST
        except Exception as e:
            raise FilterBuilderError('Error while parsing query: {}'.format(e))

        # process the AST
        return self._process_logical(result)

    def _process_logical(self, tree: FilterAST) -> SQLWithParams:
        """ Processes a logical sql expression and returns a pair (SQL, params) """

        tp = tree['type']

        if tp == 'BinaryExpression':
            return self._process_logical_or_operator(tree)
        elif tp == 'UnaryExpression':
            return self._process_unary(tree)

        self._raise_error_for_type(tp)

    def _process_logical_or_operator(self, tree: FilterAST) -> SQLWithParams:
        left = self._get_lli_type(tree['left'])
        right = self._get_lli_type(tree['right'])

        if left == 'literal' and right == 'identifier':
            return self._process_left(tree)
        elif left == 'identifier' and right == 'literal':
            return self._process_right(tree)
        elif left == 'identifier' and right == 'identifier':
            return self._process_both(tree)
        elif left == 'literal' and right == 'literal':
            raise FilterBuilderError(
                'Binary operations with only literals is not supported. ')
        elif left == 'logical' and right == 'logical':
            return self._process_operator(tree)
        else:
            raise FilterBuilderError(
                'Comparing logical expressions with a literal is not supported. ')

    def _get_lli_type(self, tree: FilterAST) -> str:
        """ Checks if an expression is potentially a logical operator or a literal """

        tp = tree['type']
        if tp in ['Literal', 'ArrayExpression']:
            return 'literal'
        elif tp in ['BinaryExpression', 'UnaryExpression']:
            return 'logical'
        elif tp == 'Identifier':
            return 'identifier'

        self._raise_error_for_type(tp)

    def _process_left(self, tree: FilterAST) -> SQLWithParams:
        op = tree['operator']

        prop, codec, columns = self._resolve_codec(
            tree['right']['name'], op)
        lit = self._process_literal(tree['left'])
        if not codec.is_valid_operand(lit):
            raise FilterBuilderError(
                '{} is not a valid operand for codec {}'.format(lit, codec.get_codec_name()))
        return codec.operate_left(lit, op, columns)

    def _process_right(self, tree: FilterAST) -> SQLWithParams:
        op = tree['operator']
        prop, codec, columns = self._resolve_codec(
            tree['left']['name'], op)
        lit = self._process_literal(tree['right'])
        if not codec.is_valid_operand(lit):
            raise FilterBuilderError(
                '{} is not a valid operand for codec {}'.format(lit, codec.get_codec_name()))
        return codec.operate_right(columns, op, lit)

    def _process_both(self, tree: FilterAST) -> SQLWithParams:
        op = tree['operator']

        lvalue = tree['left']['name']
        rvalue = tree['right']['name']

        propL, codecL, columnsL = self._resolve_codec(lvalue, op)
        propR, codecR, columnsR = self._resolve_codec(rvalue, op)

        if codecL is not codecR:
            raise FilterBuilderError(
                "Cannot compare properties {} and {}: Distinct codecs are not supported. ".format(lvalue, rvalue))

        return codecL.operate_both(columnsL, op, columnsR)

    def _resolve_codec(self, slug: str, op: str) -> tuple[Property, Type[Codec], List[str]]:
        """ Returns a triple (property, codec, column) for a given identifier """

        # Find the matching property
        prop = None
        for p in self.collection.properties():
            if p.slug == slug:
                prop = p
                break
        if prop is None:
            raise FilterBuilderError("Unknown property {}".format(slug))

        # determine the codec
        codec = prop.codec_model
        if op not in codec.operators:
            raise FilterBuilderError("Codec {} does not support operator {}".format(
                codec.get_codec_name(), op))

        # and make a columns object
        columns = [QueryBuilder._prop_value(
            p, i) for i in range(len(codec.get_value_fields()))]

        # and return!
        return prop, codec, columns

    def _process_literal(self, tree: FilterAST) -> Any:
        """ Parses a literal into a python value """

        tp = tree['type']

        if tp == 'Literal':
            return tree['value']
        elif tp == 'ArrayExpression':
            return [self._process_literal(element) for element in tree['elements']]

        self._raise_error_for_type(tp)

    def _process_unary(self, tree: FilterAST) -> SQLWithParams:
        """ Processes a unary logical operator """
        op = tree['operator']
        if op != '!':
            raise FilterBuilderError(
                'Unknown unary operator {} found'.format(op))

        # prefix a not in sql syntax
        sql, params = self._process_logical(tree['argument'])
        return 'NOT({})'.format(sql), params

    def _process_operator(self, tree: FilterAST) -> SQLWithParams:
        """ Processes a binary logical operator """

        op = ({'&&': 'AND', '||': 'OR'}).get(tree['operator'])
        if op is None:
            raise FilterBuilderError(
                'Unknown binary operator {} found'.format(tree['operator']))

        leftsql, leftparams = self._process_logical(tree['left'])
        rightsql, rightparams = self._process_logical(tree['right'])

        return '({}) {} ({})'.format(leftsql, op, rightsql), leftparams + rightparams

    def _raise_error_for_type(self, tp: str):
        """ Raises a type-specific error message for tp """

        if tp == 'Compound':
            raise FilterBuilderError(
                'Unexpected Compound: Multiple whitespace-seperated operations are not supported. ')
        elif tp == 'Identifier':
            raise FilterBuilderError(
                'Unexpected Identifier: Identifiers must be used in boolean expression. ')
        elif tp == 'MemberExpression':
            raise FilterBuilderError(
                'Unexpected MemberExpression: Property members are not supported. ')
        elif tp == 'Literal':
            raise FilterBuilderError(
                'Unexpected Literal: Property members are not supported. ')
        elif tp == 'CallExpression':
            raise FilterBuilderError(
                'Unexpected CallExpression: Function calls are not supported. ')
        elif tp == 'ConditionalExpression':
            raise FilterBuilderError(
                'Unexpected ConditionalExpression: Tertiary operator is not supported. ')
        elif tp == 'ArrayExpression':
            raise FilterBuilderError(
                'Unexpected ArrayExpression: Array is not supported. ')
        else:
            raise FilterBuilderError(
                'Unknown Expression Type: Something went wrong. ')


class QueryBuilderError(Exception):
    pass


class FilterBuilderError(QueryBuilderError):
    pass
