import os
import django
import sys
from datetime import date, timedelta

# Sett opp Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'heis_backend.settings')
django.setup()

# Nå kan vi importere modeller
from heis_api.models import Assignment

# Fiks spesifikke oppdrag
for assignment_id in [4, 5]:
    try:
        assignment = Assignment.objects.get(id=assignment_id)
        if assignment.scheduled_date:
            # Sett fristen til 14 dager etter planlagt dato
            assignment.deadline_date = assignment.scheduled_date.date() + timedelta(days=14)
        else:
            # Hvis ingen planlagt dato, sett frist til 14 dager fra i dag
            assignment.deadline_date = date.today() + timedelta(days=14)
        assignment.save()
        print(f"Oppdatert {assignment.title} med frist: {assignment.deadline_date}")
    except Assignment.DoesNotExist:
        print(f"Oppdrag med ID {assignment_id} finnes ikke")
    except Exception as e:
        print(f"Feil ved oppdatering av oppdrag {assignment_id}: {e}")

# Bekreft at alle oppdrag nå har frister
print("\nStatus på alle oppdrag:")
for a in Assignment.objects.all():
    print(f"ID: {a.id}, Tittel: {a.title}, Frist: {a.deadline_date}, Status: {a.status}") 