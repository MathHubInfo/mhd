""" This file contains the main query and filter builder
"""
from PreJsPy import PreJsPy

from mhd_data.models import CodecManager
from mhd_data.models import Codec
from .models import Property


from typing import List, Type, Any
QueryWithParams = (str, List[int])  # an sql query with parameters


FilterAST = Any  # the type used by filter annotations, for now just 'FilterAST'


class FilterBuilder(object):
    def __init__(self, properties: List[Property]):
        self.properties = properties  # type: List[Property]
        self.parser = self._setup_parser(properties)  # type: PreJsPy

    def __call__(self, query: str) -> QueryWithParams:
        """ Parses a query for a given collection """

        # parse into an AST
        try:
            result = self.parser.parse(query)  # type: FilterAST
        except Exception as e:
            raise FilterBuilderError('Error while parsing query: {}'.format(e))

        # process the AST
        return self._process_logical(result)

    def _setup_parser(self, properties: List[Property]) -> PreJsPy:
        # create a new parser
        parser = PreJsPy()

        # built-ins
        bin_ops = {
            '||': 1, '&&': 1,
        }

        # collect the custom operators with a higher precendence (binding power)
        for op in CodecManager.collect_operators(map(lambda p: p.codec_model, self.properties)):
            bin_ops[op] = 2

        parser.setBinaryOperators(bin_ops)

        # constants: true, false, null
        parser.setConstants({'true': True, 'false': False, 'null': None})

        # unary operators
        parser.setUnaryOperators(['!'])

        # no teriary operator
        parser.setTertiaryOperatorEnabled(False)

        return parser

    def _process_logical(self, tree: FilterAST) -> QueryWithParams:
        """ Processes a logical sql expression and returns a pair (SQL, params) """

        tp = tree['type']

        if tp == 'BinaryExpression':
            return self._process_logical_or_operator(tree)
        elif tp == 'UnaryExpression':
            return self._process_unary(tree)

        self._raise_error_for_type(tp)

    def _process_logical_or_operator(self, tree: FilterAST) -> QueryWithParams:
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

    def _process_left(self, tree: FilterAST) -> QueryWithParams:
        op = tree['operator']

        prop, codec, column = self._resolve_codec(
            tree['right']['name'], op)
        lit = codec.populate_value(self._process_literal(tree['left']))
        if not codec.is_valid_operand(lit):
            raise FilterBuilderError(
                '{} is not a valid operand for codec {}'.format(lit, codec.get_codec_name()))
        return codec.operate_left(lit, op, column)

    def _process_right(self, tree: FilterAST) -> QueryWithParams:
        op = tree['operator']
        prop, codec, column = self._resolve_codec(
            tree['left']['name'], op)
        lit = codec.populate_value(self._process_literal(tree['right']))
        if not codec.is_valid_operand(lit):
            raise FilterBuilderError(
                '{} is not a valid operand for codec {}'.format(lit, codec.get_codec_name()))
        return codec.operate_right(column, op, lit)

    def _process_both(self, tree: FilterAST) -> QueryWithParams:
        op = tree['operator']

        lvalue = tree['left']['name']
        rvalue = tree['right']['name']

        propL, codecL, columnL = self._resolve_codec(lvalue, op)
        propR, codecR, columnR = self._resolve_codec(rvalue, op)

        if codecL is not codecR:
            raise FilterBuilderError(
                "Cannot compare properties {} and {}: Distinct codecs are not supported. ".format(lvalue, rvalue))

        return codecL.operate_both(columnL, op, columnR)

    def _resolve_codec(self, slug: str, op: str) -> (Property, Type[Codec], str):
        """ Returns a triple (property, codec, column) for a given identifier """

        # Find the matching property
        prop = None
        for p in self.properties:
            if p.slug == slug:
                prop = p
                break
        if prop == None:
            raise FilterBuilderError("Unknown property {}".format(slug))

        codec = prop.codec_model
        if not op in codec.operators:
            raise FilterBuilderError("Codec {} does not support operator {}".format(
                codec.get_codec_name(), op))

        return prop, codec, '"T_{}".value'.format(p.slug)

    def _process_literal(self, tree: FilterAST) -> Any:
        """ Parses a literal into a python value """

        tp = tree['type']

        if tp == 'Literal':
            return tree['value']
        elif tp == 'ArrayExpression':
            return [self._process_literal(element) for element in tree['elements']]

        self._raise_error_for_type(tp)

    def _process_unary(self, tree: FilterAST) -> QueryWithParams:
        """ Processes a unary logical operator """
        op = tree['operator']
        if op != '!':
            raise FilterBuilderError(
                'Unknown unary operator {} found'.format(op))

        # prefix a not in sql syntax
        sql, params = self._process_logical(tree['argument'])
        return 'NOT({})'.format(sql), params

    def _process_operator(self, tree: FilterAST) -> QueryWithParams:
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


class FilterBuilderError(Exception):
    pass
