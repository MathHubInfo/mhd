# Generated by Django 3.2.12 on 2022-04-23 15:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mhd_provenance', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='provenance',
            name='metadata',
            field=models.JSONField(blank=True, help_text='Metadata associated with this object', null=True),
        ),
    ]