# Generated by Django 2.2.4 on 2019-08-20 09:20

from django.db import migrations, models
import django.db.models.deletion
import mhd.utils.uuid
import mhd_data.fields.json
import mhd_data.fields.ndarray


class Migration(migrations.Migration):

    dependencies = [
        ('mhd_provenance', '0002_auto_20190819_0754'),
        ('mhd_schema', '0002_auto_20190819_0754'),
        ('mhd_data', '0006_matrixaslist_standardint_3_3'),
    ]

    operations = [
        migrations.CreateModel(
            name='ListAsArray_StandardJSON',
            fields=[
                ('id', models.UUIDField(default=mhd.utils.uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('active', models.BooleanField(default=True, help_text='Is this item active')),
                ('value', mhd_data.fields.ndarray.SmartNDArrayField(dim=1, typ=mhd_data.fields.json.SmartJSONField())),
                ('item', models.ForeignKey(help_text='Item this this cell represents', on_delete=django.db.models.deletion.CASCADE, to='mhd_data.Item')),
                ('prop', models.ForeignKey(help_text='Property this cell represents', on_delete=django.db.models.deletion.CASCADE, to='mhd_schema.Property')),
                ('provenance', models.ForeignKey(help_text='Provenance of this cell', on_delete=django.db.models.deletion.CASCADE, to='mhd_provenance.Provenance')),
                ('superseeded_by', models.ForeignKey(blank=True, help_text='Cell this value is superseeded by', null=True, on_delete=django.db.models.deletion.SET_NULL, to='mhd_data.ListAsArray_StandardJSON')),
            ],
            options={
                'abstract': False,
                'unique_together': {('item', 'prop', 'superseeded_by')},
            },
        ),
    ]