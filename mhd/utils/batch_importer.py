from __future__ import annotations
import os
from io import StringIO
from tqdm import tqdm
import logging

from .pgsql_serializer import make_pgsql_serializer, CSV_NULL, CSV_NULL_ESCAPED

from django.db import connection
from django.db.models import JSONField

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Optional, Iterator, Any, Type, IO, Callable
    from django.db.models import Model


class BatchImporter(object):
    """A BatchImporter can import multiple values into the database at once"""

    logger: logging.Logger
    batch_size: Optional[int]

    def __init__(self, quiet: bool = False, batch_size: Optional[int] = None) -> None:
        self.logger = logging.getLogger("mhd.batchimporter")
        self.logger.setLevel(logging.WARN if quiet else logging.DEBUG)
        self.batch_size = batch_size

    def __call__(
        self,
        model: Type[Model],
        fields: list[str],
        values: Iterator[Any],
        count_values: Optional[int] = None,
    ) -> None:
        """Imports multiple values at once
        :param model: Model instance to import values from
        :param fields: List of fields to import values for
        :param values: Iterator over values
        :param count_values: When values is an iterator that
        does not expose it's length, it can be given explicitly.
        """

        raise NotImplementedError

    @staticmethod
    def get_default_importer(path: Optional[str], **kwargs: Any) -> BatchImporter:
        """Gets the default BatchImporter instance"""

        # if we have a path given, copy output files to that path
        if path is not None:
            return CopyFromFile(path, **kwargs)

        # else, have a postgresl importer
        if connection.vendor == "postgresql":
            return CopyFromImporter(**kwargs)

        return BulkCreateImporter(**kwargs)


class BulkCreateImporter(BatchImporter):
    """Bulk imports values using the bulk_create function"""

    def __call__(
        self,
        model: Type[Model],
        fields: list[str],
        values: Iterator[Any],
        count_values: Optional[int] = None,
    ) -> None:
        """Imports multiple values at once
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
        self.logger.info(
            "Created {} instance(s), sending to database ...".format(
                count_values or len(values)
            )
        )

        # and run bulk_create
        model.objects.bulk_create(instances, batch_size=self.batch_size)


class SerializingImporter(BatchImporter):
    PREPPER_OVERRIDES: dict[Type[Model], Callable] = {
        JSONField: lambda x: x,
    }

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

        if connection.vendor != "postgresql":
            raise ValueError(
                "SerializingImporter requires 'postgresql' database")

    def _get_prepper(self, model: Type[Model], field_name: str) -> Callable:
        field = model._meta.get_field(field_name)
        for clz, o in self.PREPPER_OVERRIDES.items():
            if isinstance(field, clz):
                return o
        return field.get_prep_value

    def _get_serializer(self, model: Type[Model], field_name: str) -> Callable:
        return make_pgsql_serializer(
            model._meta.get_field(field_name).db_type(connection=connection)
        )

    def _serialize(
        self,
        stream: IO[str],
        model: Type[Model],
        fields: list[str],
        values: Iterator[Any],
        count_values: Optional[int] = None,
    ):
        """Serialializes values into stream as csv and returns the size of stream in bytes"""

        # find serializers and prep values for the database
        preppers = [self._get_prepper(model, f) for f in fields]
        serializers = [self._get_serializer(model, f) for f in fields]

        # prepare values for the database
        for value in tqdm(values, leave=False, total=count_values):
            stream.write(
                "\t".join(s(p(v))
                          for (s, p, v) in zip(serializers, preppers, value)) + "\n"
            )

        return stream.tell()


class CopyFromImporter(SerializingImporter):
    def __call__(
        self,
        model: Type[Model],
        fields: list[str],
        values: Iterator[Any],
        count_values: Optional[int] = None,
    ) -> None:
        """Imports multiple values at once
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
            "Data serialized, sending {} Byte(s) to postgres ...".format(size)
        )

        # and import into the database
        with connection.cursor() as cursor:
            cursor.copy_from(
                file=stream,
                table=model._meta.db_table,
                sep="\t",
                null=CSV_NULL,
                columns=fields,
            )

        # close the stream just to be sure it's no longer used
        stream.close()


class CopyFromFile(SerializingImporter):
    path: str
    counter: int
    _sql_path: str

    def __init__(self, path, **kwargs):
        super().__init__(**kwargs)

        # setup basic state (path, counter)
        self.path = path
        self.counter = 0

        # path to the sql file
        self._sql_path = os.path.join(path, "data.sql")

        # write a new line into the sql file
        with open(self._sql_path, "w") as f:
            f.write("-- MHD Data Import\n")

    def _append_sql(self, s: str) -> None:
        """Appends a string to the given file"""

        with open(self._sql_path, "a") as f:
            f.write(s + "\n")

    def __call__(
        self,
        model: Type[Model],
        fields: list[str],
        values: Iterator[Any],
        count_values: Optional[int] = None,
    ):
        """Imports multiple values at once
        :param model: Model instance to import values from
        :param fields: List of fields to import values for
        :param values: Iterator over values
        :param count_values: When values is an iterator that
        does not expose it's length, it can be given explicitly.
        """

        # find the next path to write csv into
        name = "data_{}.csv".format(self.counter)
        self.counter += 1
        path = os.path.join(self.path, name)

        # Write csv file
        with open(path, "w+") as stream:
            size = self._serialize(
                stream, model, fields, values, count_values=count_values
            )

        # tell the user
        self.logger.info(
            "Serialized {} Byte(s) of data into {}".format(size, path))

        # build a 'COPY FROM' command
        code = "\\copy {}({}) FROM {} WITH DELIMITER AS {} NULL AS {};".format(
            CopyFromFile.quote_double(model._meta.db_table),
            ",".join(map(CopyFromFile.quote_double, fields)),
            CopyFromFile.quote_single("./" + name),
            "E'\\t'",
            CSV_NULL_ESCAPED,
        )
        self._append_sql(code)

    @staticmethod
    def quote_double(s: str) -> str:
        return (
            '"' + s.translate(
                str.maketrans(
                    {
                        '"': '\\"',
                    }
                )
            ) + '"'
        )

    @staticmethod
    def quote_single(s: str) -> str:
        return "'{}'".format(s)
