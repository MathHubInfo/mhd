from django.test import TestCase
import json

from mhd_tests.models import JSONArrayFieldModel, SmartJSONFieldModel, TextFieldModel, SmartNDArrayOneModel
from mhd_tests.utils import db

from ..utils.batch_importer import CopyFromImporter, BulkCreateImporter

TEXT_SAMPLES = [
    '',
    '\\',
    '\\t',
    '\t',
    'NULL',
    'thing',
    'Hello World',
    'Hello, world',
    'Hello \\ World',
    '"Hello world"',
    "'Hello world'"
]

INTEGER_SAMPLES = [
    0,
    1,
    -1,
    123123123,
    -757645513
]

INTEGER_ARRAY_SAMPLES = [
    [],
] + [[n] for n in INTEGER_SAMPLES] + [[n, n, n] for n in INTEGER_SAMPLES]

JSON_SAMPLES = [
    True,
    False,
    [1, 2, 3],
    [],
    {},
    {"key": "value"},
    None
] + INTEGER_SAMPLES + TEXT_SAMPLES

JSON_ARRAY_SAMPLES = [
    [j, j] for j in JSON_SAMPLES
]

def dump_csv_contents_debug(model):
    """ Function to be called during debugging only
        to dump out CSV contents """
    from django.db import connection
    from io import StringIO
    stream = StringIO()
    with connection.cursor() as c:
        c.copy_to(stream, model._meta.db_table)
    print(stream.getvalue())
    stream.close()

class InsertionTest(TestCase):
    def _insert_and_compare(self, importer, model, samples):
        """ Inserts sample data using the given importer and
            asserts that the 'data' attribute of the objects
            are equal as JSON """

        importer(model, ['data'], [[sample] for sample in samples])

        for (a, b) in zip(model.objects.all(), samples):
            self.assertJSONEqual("[{}]".format(json.dumps(a.data)), [b])

    @db.skipUnlessPostgres
    def test_copyfrom_text(self):
        importer = CopyFromImporter(quiet = False)
        self._insert_and_compare(importer, TextFieldModel, TEXT_SAMPLES)

    def test_bulkcreate_text(self):
        importer = BulkCreateImporter(quiet=False)
        self._insert_and_compare(importer, TextFieldModel, TEXT_SAMPLES)

    @db.skipUnlessPostgres
    def test_copyfrom_json(self):
        importer = CopyFromImporter(quiet = False)
        self._insert_and_compare(importer, SmartJSONFieldModel, JSON_SAMPLES)

    def test_bulkcreate_json(self):
        importer = BulkCreateImporter(quiet=False)
        self._insert_and_compare(importer, SmartJSONFieldModel, JSON_SAMPLES)

    @db.skipUnlessPostgres
    def test_copyfrom_integer_array(self):
        importer = CopyFromImporter(quiet = False)
        self._insert_and_compare(importer, SmartNDArrayOneModel, INTEGER_ARRAY_SAMPLES)

    def test_bulkcreate_integer_array(self):
        importer = BulkCreateImporter(quiet=False)
        self._insert_and_compare(importer, SmartNDArrayOneModel, INTEGER_ARRAY_SAMPLES)

    @db.skipUnlessPostgres
    def test_copyfrom_json_array(self):
        importer = CopyFromImporter(quiet = False)
        self._insert_and_compare(importer, JSONArrayFieldModel, JSON_ARRAY_SAMPLES)

    def test_bulkcreate_json_array(self):
        importer = BulkCreateImporter(quiet=False)
        self._insert_and_compare(importer, JSONArrayFieldModel, JSON_ARRAY_SAMPLES)
