import json
import sys

from django.core.management.base import BaseCommand

from ...models import Collection, Item, Provenance


class Command(BaseCommand):
    help = 'Inserts data into an existing collection'

    def add_arguments(self, parser):
        parser.add_argument('data', help=".json file containing 2-dimensional value array")
        parser.add_argument('--collection', '-c', help="Slug of collection to insert data into", required=True)
        parser.add_argument('--fields', '-f', help="Comma-seperated list of property names", required=True)
        parser.add_argument('--provenance', '-p', help=".json file containing provenance to insert", required=True)
        

    def handle(self, *args, **kwargs):
        # find collection
        collection = Collection.objects.filter(slug=kwargs['collection']).first()
        if collection is None:
            raise ValueError('Collection {0:s} does not exist'.format(kwargs['collection']))
        
        # split the fields
        fields = kwargs['fields'].strip().split(",")

        # open data file
        data = None
        with open(kwargs['data']) as f:
            data = json.load(f)
        
        # open provenance file
        prov = None
        with open(kwargs['provenance']) as f:
            prov = json.load(f)
        
        # Create a provenance with the given object
        provenance = Provenance(metadatastring=json.dumps(prov))
        provenance.save()

        # And create the items
        Item.objects.insert_into_collection(collection, provenance, fields, data, logger=lambda m:sys.stdout.write(m + "\n"))
