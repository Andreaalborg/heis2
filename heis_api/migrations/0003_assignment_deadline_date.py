# Generated by Django 5.1.7 on 2025-04-01 11:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('heis_api', '0002_customer_contact_person_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='assignment',
            name='deadline_date',
            field=models.DateField(blank=True, null=True),
        ),
    ]
