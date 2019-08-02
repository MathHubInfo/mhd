# Generated by Django 2.2.2 on 2019-08-02 09:13

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Collection',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('metadatastring', models.TextField(blank=True, help_text='Metadata associated to this object', null=True)),
                ('displayName', models.TextField(help_text='Name of this collection')),
                ('slug', models.SlugField(help_text='Identifier of this collection', unique=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Property',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('metadatastring', models.TextField(blank=True, help_text='Metadata associated to this object', null=True)),
                ('displayName', models.TextField(help_text='Display Name for this property')),
                ('slug', models.SlugField(help_text='Identifier of this Collection')),
                ('codec', models.SlugField(help_text='Name of the codec table that stores this property ')),
                ('collections', models.ManyToManyField(blank=True, help_text='Collection(s) this property occurs in', to='mdh_schema.Collection')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
