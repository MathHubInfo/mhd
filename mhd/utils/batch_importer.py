import json
import csv
import os
from io import StringIO
from tqdm import tqdm
import logging

from .pgsql_serializer import make_pgsql_serializer

from django.db import connection


class BatchImporter(object):
    """ A BatchImporter can import multiple values into the database at once """

    def __init__(self, quiet=False, batch_size=None):
        self.logger = logging.getLogger('mhd.batchimporter')
        self.logger.setLevel(logging.WARN if quiet else logging.DEBUG)
        self.batch_size = batch_size

    def __call__(self, model, fields, values, count_values=None):
        """ Imports multiple values at once
            :param model: Model instance to import values from
            :param fields: List of fields to import values for
            :param values: Iterator over values
            :param count_values: When values is an iterator that
            does not expose it's length, it can be given explicitly.
        """

        raise NotImplementedError

    @staticmethod
    def get_default_importer(path, **kwargs):
        """ Gets the default BatchImporter instance """

        # if we have a path given, copy output files to that path
        if path is not None:
            return CopyFromFile(path, **kwargs)

        # else, have a postgresl importer
        if connection.vendor == 'postgresql':
            return CopyFromImporter(**kwargs)

        return BulkCreateImporter(**kwargs)


class BulkCreateImporter(BatchImporter):
    """ Bulk imports values using the bulk_create function """

    def __call__(self, model, fields, values, count_values=None):
        """ Imports multiple values at once
            :param model: Model instance to import values from
            :param fields: List of fields to import values for
            :param values: Iterator over values
            :param count_values: When values is an iterator that
            does not expose it's length, it can be given explicitly.
        """

        # create the instance from the field names and values
        instances = [
            model(**{name: value[i] for (i, name) in enumerate(fields)})
            for value in tqdm(values, leave=False, total=count_values)
        ]

        # send some logger into
        self.logger.info('Created {} instance(s), sending to database ...'.format(
            count_values or len(values)))

        # and run bulk_create
        return model.objects.bulk_create(instances, batch_size=self.batch_size)


class SerializingImporter(BatchImporter):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        if connection.vendor != 'postgresql':
            raise ValueError(
                "SerializingImporter requires 'postgresql' database")

    def _serialize(self, stream, model, fields, values, count_values=None):
        """ Serialializes values into stream as csv and returns the size of stream in bytes """

        writer = csv.writer(stream, delimiter='\t', quoting=csv.QUOTE_NONE, quotechar='')

        # find serializers and prep values for the database
        preppers = [model._meta.get_field(f).get_prep_value for f in fields]
        serializers = [make_pgsql_serializer(model._meta.get_field(
            f).db_type(connection=connection)) for f in fields]

        # prepare values for the database
        for value in tqdm(values, leave=False, total=count_values):
            writer.writerow([
                s(p(v)) for (s, p, v) in zip(serializers, preppers, value)
            ])

        return stream.tell()


class CopyFromImporter(SerializingImporter):
    def __call__(self, model, fields, values, count_values=None):
        """ Imports multiple values at once
            :param model: Model instance to import values from
            :param fields: List of fields to import values for
            :param values: Iterator over values
            :param count_values: When values is an iterator that
            does not expose it's length, it can be given explicitly.
        """

        stream = StringIO()
        size = self._serialize(stream, model, fields,
                               values, count_values=count_values)
        stream.seek(0)

        self.logger.info(
            'Data serialized, sending {} Byte(s) to postgres ...'.format(size))

        # and import into the database
        with connection.cursor() as cursor:
            cursor.copy_from(
                file=stream,
                table=model._meta.db_table,
                sep='\t',
                null='None',
                columns=fields,
            )

        # close the stream just to be sure it's no longer used
        stream.close()


class CopyFromFile(SerializingImporter):
    def __init__(self, path, **kwargs):
        super().__init__(**kwargs)

        # setup basic state (path, counter)
        self.path = path
        self.counter = 0

        # path to the sql file
        self._sql_path = os.path.join(path, 'data.sql')

        # write a new line into the sql file
        with open(self._sql_path, 'w') as f:
            f.write("-- MHD Data Import\n")

    def _append_sql(self, s):
        """ Appends a string to the given file """

        with open(self._sql_path, 'a') as f:
            f.write(s + '\n')

    def __call__(self, model, fields, values, count_values=None):
        """ Imports multiple values at once
            :param model: Model instance to import values from
            :param fields: List of fields to import values for
            :param values: Iterator over values
            :param count_values: When values is an iterator that
            does not expose it's length, it can be given explicitly.
        """

        # find the next path to write csv into
        name = 'data_{}.csv'.format(self.counter)
        self.counter += 1
        path = os.path.join(self.path, name)

        # Write csv file
        with open(path, 'w+') as stream:
            size = self._serialize(stream, model, fields, values, count_values=count_values)

        # tell the user
        self.logger.info(
            'Serialized {} Byte(s) of data into {}'.format(size, path))

        # build a 'COPY FROM' command
        code = '\\copy {}({}) FROM {} WITH DELIMITER AS {} NULL AS {};'.format(
            CopyFromFile.quote_double(model._meta.db_table),
            ",".join(map(CopyFromFile.quote_double, fields)),
            CopyFromFile.quote_single("./" + name),
            "E'\\t'",
            "'None'"
        )
        self._append_sql(code)

    @staticmethod
    def quote_double(s):
        return '"' + s.translate(str.maketrans({
            '"': '\\"',
        })) + '"'
    @staticmethod
    def quote_single(s):
        return "'{}'".format(s)
