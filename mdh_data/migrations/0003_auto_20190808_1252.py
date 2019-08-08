# Generated by Django 2.2.2 on 2019-08-08 12:52

from django.db import migrations, models
import mdh_django.utils.uuid


class Migration(migrations.Migration):

    dependencies = [
        ('mdh_data', '0002_auto_20190807_1314'),
    ]

    operations = [
        migrations.AlterField(
            model_name='item',
            name='id',
            field=models.UUIDField(default=mdh_django.utils.uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='standardbool',
            name='id',
            field=models.UUIDField(default=mdh_django.utils.uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='standardint',
            name='id',
            field=models.UUIDField(default=mdh_django.utils.uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]
