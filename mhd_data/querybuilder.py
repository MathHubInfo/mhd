from PreJsPy import PreJsPy

from .models import CodecManager


class QueryBuilder(object):
    def __call__(self, query, properties):
        """ Parses a query for a given collection """

        parser = self._setup_parser(properties)
        try:
            result = parser.parse(query)
        except Exception as e:
            raise QueryBuilderError('Error while parsing query: {}'.format(e))

        return self._process_logical(result, properties)

    def _setup_parser(self, properties):
        # create a new parser
        parser = PreJsPy()

        # built-ins
        bin_ops = {
            '||': 1, '&&': 1,
        }

        # collect the custom operators with a higher precendence (binding power)
        for op in CodecManager.collect_operators(map(lambda p: p.codec_model, properties)):
            bin_ops[op] = 2

        parser.setBinaryOperators(bin_ops)

        # constants: true, false, null
        parser.setConstants({'true': True, 'false': False, 'null': None})

        # unary operators
        parser.setUnaryOperators(['!'])

        # no teriary operator
        parser.setTertiaryOperatorEnabled(False)

        return parser

    def _process_logical(self, tree, properties):
        """ Processes a logical sql expression and returns a pair (SQL, params) """

        tp = tree['type']
        if tp == 'BinaryExpression':
            return self._process_logical_or_operator(tree, properties)
        elif tp == 'UnaryExpression':
            return self._process_unary(tree, properties)

        self._raise_error_for_type(tp)

    def _process_logical_or_operator(self, tree, properties):
        left = self._get_lli_type(tree['left'])
        right = self._get_lli_type(tree['right'])

        if left == 'literal' and right == 'identifier':
            return self._process_left(tree, properties)
        elif left == 'identifier' and right == 'literal':
            return self._process_right(tree, properties)
        elif left == 'identifier' and right == 'identifier':
            return self._process_both(tree, properties)
        elif left == 'literal' and right == 'literal':
            raise QueryBuilderError(
                'Binary operations with only literals is not supported. ')
        elif left == 'logical' and right == 'logical':
            return self._process_operator(tree, properties)
        else:
            raise QueryBuilderError(
                'Comparing logical expressions with a literal is not supported. ')

    def _get_lli_type(self, tree):
        """ Checks if an expression is potentially a logical operator or a literal """

        tp = tree['type']
        if tp in ['Literal', 'ArrayExpression']:
            return 'literal'
        elif tp in ['BinaryExpression', 'UnaryExpression']:
            return 'logical'
        elif tp == 'Identifier':
            return 'identifier'

        self._raise_error_for_type(tp)

    def _process_left(self, tree, properties):
        op = tree['operator']

        prop, codec, column = self._resolve_codec(tree['right']['name'], op, properties)
        lit = codec.populate_value(self._process_literal(tree['left']))
        if not codec.is_valid_operand(lit):
            raise QueryBuilderError('{} is not a valid operand for codec {}'.format(lit, codec.get_codec_name()))
        return codec.operate_left(lit, op, column)

    def _process_right(self, tree, properties):
        op=tree['operator']
        prop, codec, column=self._resolve_codec(tree['left']['name'], op, properties)
        lit = codec.populate_value(self._process_literal(tree['right']))
        if not codec.is_valid_operand(lit):
            raise QueryBuilderError('{} is not a valid operand for codec {}'.format(lit, codec.get_codec_name()))
        return codec.operate_right(column, op, lit)

    def _process_both(self, tree, properties):
        op=tree['operator']

        lvalue=tree['left']['name']
        rvalue=tree['right']['name']

        propL, codecL, columnL=self._resolve_codec(lvalue, op, properties)
        propR, codecR, columnR=self._resolve_codec(rvalue, op, properties)

        if codecL is not codecR:
            raise QueryBuilderError(
                "Cannot compare properties {} and {}: Distinct codecs are not supported. ".format(lvalue, rvalue))

        return codecL.operate_both(columnL, op, columnR)

    def _resolve_codec(self, slug, op, properties):
        """ Returns a triple (property, codec, column) for a given identifier """

        # Find the matching property
        prop=None
        for p in properties:
            if p.slug == slug:
                prop=p
                break
        if prop == None:
            raise QueryBuilderError("Unknown property {}".format(slug))

        codec=prop.codec_model
        if not op in codec.operators:
            raise QueryBuilderError("Codec {} does not support operator {}".format(
                codec.get_codec_name(), op))


        return prop, codec, '"T_{}".value'.format(p.slug)



    def _process_literal(self, tree):
        """ Parses a literal into a python value """

        tp=tree['type']

        if tp == 'Literal':
            return tree['value']
        elif tp == 'ArrayExpression':
            return [self._process_literal(element) for element in tree['elements']]

        self._raise_error_for_type(tp)

    def _process_unary(self, tree, properties):
        """ Processes a unary logical operator """
        op=tree['operator']
        if op != '!':
            raise QueryBuilderError('Unknown unary operator {} found'.format(op))

        # prefix a not in sql syntax
        sql, params=self._process_logical(tree['argument'], properties)
        return 'NOT({})'.format(sql), params

    def _process_operator(self, tree, properties):
        """ Processes a binary logical operator """

        op=({'&&': 'AND', '||': 'OR'}).get(tree['operator'])
        if op is None:
            raise QueryBuilderError(
                'Unknown binary operator {} found'.format(tree['operator']))

        leftsql, leftparams=self._process_logical(tree['left'], properties)
        rightsql, rightparams=self._process_logical(tree['right'], properties)

        return '({}) {} ({})'.format(leftsql, op, rightsql), leftparams + rightparams

    def _raise_error_for_type(self, tp):
        """ Raises a type-specific error message for tp """
        if tp == 'Compound':
            raise QueryBuilderError(
                'Unexpected Compound: Multiple whitespace-seperated operations are not supported. ')
        elif tp == 'Identifier':
            raise QueryBuilderError(
                'Unexpected Identifier: Identifiers must be used in boolean expression. ')
        elif tp == 'MemberExpression':
            raise QueryBuilderError(
                'Unexpected MemberExpression: Property members are not supported. ')
        elif tp == 'Literal':
            raise QueryBuilderError(
                'Unexpected Literal: Property members are not supported. ')
        elif tp == 'CallExpression':
            raise QueryBuilderError(
                'Unexpected CallExpression: Function calls are not supported. ')
        elif tp == 'ConditionalExpression':
            raise QueryBuilderError(
                'Unexpected ConditionalExpression: Tertiary operator is not supported. ')
        elif tp == 'ArrayExpression':
            raise QueryBuilderError(
                'Unexpected ArrayExpression: Array is not supported. ')
        else:
            raise QueryBuilderError('Unknown Expression Type: Something went wrong. ')

class QueryBuilderError(Exception):
    pass
