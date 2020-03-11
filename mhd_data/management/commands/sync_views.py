from django.core.management.base import BaseCommand

from mhd_schema.models import Collection

class Command(BaseCommand):
    help = 'Syncronizes materialized views'

    def handle(self, *args, **kwargs):
        for collection in Collection.objects.all():
            collection.sync_materialized_view()
        
