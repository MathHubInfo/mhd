from django.db import models, transaction

from .collection import Collection


class ItemManager(models.Manager):
    @transaction.atomic
    def insert_into_collection(self, collection, provenance, header, rows, items = None, logger = None):
        """
            Inserts a list of items into a collection with the specified provenance.
            The header is a list of property names which describe the 2-dimensional list "rows". 
            The length of header must correspond to the length of each element in rows. 
            If "items" is not None, it must be a list of items to associate each row to. 
        """

        # Setup a logger if none provided
        if logger is None:
            logger = lambda x:None

        # Make sure all the properties exist
        properties = [collection.get_property(h) for h in header]
        for (p, h) in zip(properties, header):
            if p is None:
                raise ValueError('Property {0:s} does not exist on {1:s}'.format(h, collection))
        
        if items is None:
            # create new items for each property
            items = [Item() for _ in rows]
            Item.objects.bulk_create(items)

            # add all the items to the given collection
            for item in items:
                item.collections.add(collection)
            
            logger("Created {0:d} new item(s)", len(items))
        elif len(items) != len(rows):
            raise ValueError('Cannot insert: len(items) != len(rows)')
        else:
            logger("Did not create any new item(s)", len(items))


        # iterate over each column
        # and bulk_insert the values
        for i, prop in enumerate(properties):
            column = [r[i] for r in rows]

            # Make sure that we do not yet have any values
            if not prop.get_column(prop).filter(item__in=items).empty():
                raise ValueError('Cannot insert property {0:s}: Already exists'.format(prop.slug))
            
            # create objects for all the values
            values = [prop.codec_model(value=value, item=item, prop=prop, provenance=provenance, active=True)
                for (item, value) in zip(items, column)]
            
            # and create them in bulk
            prop.codec_model.objects.bulk_create(values)

            # and log
            logger("Inserted {0:d} value(s) into cells for property {1:s}".format(len(values), prop.slug))


class Item(models.Model):
    """ Any Item in Any Collection """

    objects = ItemManager()

    collections = models.ManyToManyField(Collection, help_text="Collection(s) each item occurs in", blank=True)

__all__ = ["Item"]
