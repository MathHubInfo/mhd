# Generated by Django 2.2.4 on 2019-10-18 14:50

from django.db import migrations, models
import mhd_data.fields.json
import mhd_data.fields.ndarray


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='DumbJSONFieldModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', mhd_data.fields.json.DumbJSONField(null=True)),
            ],
        ),
        migrations.CreateModel(
            name='DumbNDArrayOneModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', mhd_data.fields.ndarray.DumbNDArrayField(dim=1, size=None, typ=models.IntegerField())),
            ],
        ),
        migrations.CreateModel(
            name='DumbNDArrayTwoModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', mhd_data.fields.ndarray.DumbNDArrayField(dim=2, size=None, typ=models.IntegerField())),
            ],
        ),
        migrations.CreateModel(
            name='SmartJSONFieldModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', mhd_data.fields.json.SmartJSONField(null=True)),
            ],
        ),
        migrations.CreateModel(
            name='SmartNDArrayOneModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', mhd_data.fields.ndarray.SmartNDArrayField(dim=1, size=None, typ=models.IntegerField())),
            ],
        ),
        migrations.CreateModel(
            name='SmartNDArrayTwoModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', mhd_data.fields.ndarray.SmartNDArrayField(dim=2, size=None, typ=models.IntegerField())),
            ],
        ),
    ]
