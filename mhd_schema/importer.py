from mdh.utils import with_simulate_arg

from mhd_schema.models import Collection, Property
from mdh_data.models import CodecManager


class SchemaImporter(object):
    """ Represents the process of an import """

    def __init__(self, data=None, logger=None):
        self.data = data
        self.logger = logger
        self._validate_data(self.data)

    def _log(self, message):
        if self.logger is None:
            return
        return self.logger(message)

    def _validate_data(self, data):
        if not isinstance(data, dict):
            raise SchemaValidationError('Expected schema to be a dict. ')

        for k in ['slug', 'properties', 'displayName', 'description']:
            if k not in data:
                raise SchemaValidationError(
                    'Required key {0!r} is missing from schema. '.format(k))

        for k in ['slug', 'displayName', 'description', 'url']:
            if k in data and not isinstance(data[k], str):
                raise SchemaValidationError('Key {0!r} is not a string. '.format(k))

        if not isinstance(data['properties'], list):
            raise SchemaValidationError(
                'Key \'properties\' is not a list of properties. ')
        if 'metadata' in data and not isinstance(data['metadata'], dict):
            raise SchemaValidationError('Key \'metadata\' is not a dict. ')

        for p in data['properties']:
            self._validate_property(p)

    def _validate_property(self, data):
        if not isinstance(data, dict):
            raise SchemaValidationError('Found property that is not a dict. ')

        if 'slug' not in data:
            raise SchemaValidationError('Found property without a slug. ')

        slug = data['slug']
        if not isinstance(slug, str):
            raise SchemaValidationError(
                'Found property where slug is not a string. ')

        for k in ['displayName', 'codec']:
            if k not in data:
                raise SchemaValidationError(
                    'Property {0!r} missing key {}. '.format(slug, k))
            if not isinstance(data[k], str):
                raise SchemaValidationError(
                    'Property {0!r}, Key {} is not a string. '.format(slug, k))

        if 'metadata' in data and not isinstance(data['metadata'], dict):
            raise SchemaValidationError(
                'Property {0!r}, Key \'metadata\' is not a dict. '.format(slug))

        if CodecManager.find_codec(data['codec']) is None:
            raise SchemaValidationError(
                'Property {0!r} has unknown codec {1!r}'.format(slug, data['codec']))

    @with_simulate_arg
    def __call__(self, update=False, simulate=False):
        """
            Creates or updates a new collection based on the appropriate
            serialization in value. The value is serialized as:

            {
                'displayName': string,
                'slug': string,
                'description': string,
                'url': string,
                'metadata': {}, # any JSON, optional
                'properties': property[] # property serialization, see the Property model
            }

            First, a new Collection() object is created and stored in the
            database with appropriate 'slug', 'displayName' and
            'metadata' values. If a collection with the same slug already
            exists, and update is set to False, an Exception is raised. If
            update is set to True, instead of creating a new collection,
            the old one is reused.

            Next, for each property
                Property.objects.create_or_update_property_from_serializer(property, skip_existing=update, logger=logger)
            is called. Furthermore, if any other properties are still associated with the collection, their association is removed.

            Takes an optional logger argument which, if set, is called with informational messages.

            If any substep fails, rolls back all operations and then raises an appropriate Exception.

            Returns a pair (collection, created). Collection is the new or update collection.
            When created is true, the collection was newly created. When false, it was updated.
        """

        # Return values
        collection = None
        created = False

        # read all the data from the existing data
        slug = self.data['slug']
        displayName = self.data['displayName']
        description = self.data.get('description', None)
        url = self.data.get('url', None)
        metadata = self.data.get('metadata', None)
        properties = self.data['properties']

        # if we do not want to update
        # check if the collection already exists and raise an error
        if not update and Collection.objects.filter(slug=slug).exists():
            raise SchemaImportError(
                'Collection {0!r} already exists'.format(slug))

        # create or update the collection
        collection, created = Collection.objects.update_or_create(slug=slug, defaults={
            'displayName': displayName,
            'description': description,
            'url': url,
            'metadata': metadata,
        })
        self._log('[{0!s}] {1!s} collection'.format(
            slug, 'Created' if created else 'Updated'))

        # Create all the properties (TODO)
        props = [
            self.__call__property(collection, p, update=update)[0]
            for p in properties
        ]

        # fetch the extra properties and remove them
        extra = collection.property_set.exclude(pk__in=[p.pk for p in props])
        collection.property_set.remove(*extra)
        self._log('[{}] Disassociated {} properties'.format(slug, len(extra)))

        # and return
        return collection, created

    def __call__property(self, collection, prop, update=False):
        """
            Creates a (collection-associated) property based on the appropriate
            serialization in value. The value is serialized as:

            {
                'displayName': string,
                'slug': string,
                'metadata': {} # any JSON, optional
                'codec': string
            }


            First, a new Property() object is created and stored in the database
            with appropriate 'slug', 'displayName' and 'metadata' and 'codec'
            values. If a Property() with the given 'slug' in the provided
            collection already exists, raises unless update is set.

            If any substep fails, rolls back all operations and then raises
            an appropriate Exception.

            Returns a pair (property, created). Property is the affected
            property. When created is true, the property was newly created. When
            false, it was skipped.
        """

        # read all the values
        slug = prop['slug']
        displayName = prop['displayName']
        metadata = prop.get('metadata', None)
        codec = prop['codec']

        # Check if the property already exists
        prop = collection.property_set.filter(slug=slug)
        if prop:
            if not update:
                raise SchemaImportError(
                    'Property {0:s} already exists'.format(slug))

            self._log(
                'Did not create property {0:s}, already exists. '.format(slug))
            return prop.first(), False

        # Create the property unless it already exists
        prop = Property.objects.create(
            slug=slug, displayName=displayName, codec=codec, metadata=metadata)
        prop.collections.add(collection)
        prop.save()

        self._log("[{0!s}] Created property {1:s}".format(
            collection.slug, slug))
        return prop, True


class SchemaImportError(Exception):
    def __init__(self, message):
        super().__init__('Unable to create collection: {}'.format(message))


class SchemaValidationError(SchemaImportError):
    def __init__(self, message):
        super().__init__('Error in Schema: {}'.format(message))
