# Generated by Django 3.2.14 on 2022-07-08 10:04

from django.db import migrations, models
import django.db.models.deletion
import mhd.utils.uuid


class Migration(migrations.Migration):

    dependencies = [
        ('mhd_schema', '0012_auto_20220423_1542'),
        ('mhd_provenance', '0002_alter_provenance_metadata'),
        ('mhd_data', '0004_auto_20220423_1524'),
    ]

    operations = [
        migrations.CreateModel(
            name='GraphLabel',
            fields=[
                ('id', models.UUIDField(default=mhd.utils.uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('active', models.BooleanField(default=True, help_text='Is this item active')),
                ('label', models.TextField()),
                ('number', models.IntegerField()),
                ('item', models.ForeignKey(help_text='Item this this cell represents', on_delete=django.db.models.deletion.CASCADE, to='mhd_data.item')),
                ('prop', models.ForeignKey(help_text='Property this cell represents', on_delete=django.db.models.deletion.CASCADE, to='mhd_schema.property')),
                ('provenance', models.ForeignKey(help_text='Provenance of this cell', on_delete=django.db.models.deletion.CASCADE, to='mhd_provenance.provenance')),
                ('superseeded_by', models.ForeignKey(blank=True, help_text='Cell this value is superseeded by', null=True, on_delete=django.db.models.deletion.SET_NULL, to='mhd_data.graphlabel')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddIndex(
            model_name='graphlabel',
            index=models.Index(fields=['item'], name='mhd_data_gr_item_id_adae71_idx'),
        ),
        migrations.AddIndex(
            model_name='graphlabel',
            index=models.Index(fields=['prop'], name='mhd_data_gr_prop_id_e97758_idx'),
        ),
        migrations.AddIndex(
            model_name='graphlabel',
            index=models.Index(fields=['active'], name='mhd_data_gr_active_4799ca_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='graphlabel',
            unique_together={('item', 'prop', 'superseeded_by')},
        ),
    ]
