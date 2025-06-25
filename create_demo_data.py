#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script for å generere realistisk demo-data for HeisAdmin
Kjør dette scriptet etter at du har kjørt migrate og opprettet en superbruker
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta, date
from decimal import Decimal

# Sett opp Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'heis_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from heis_api.models import (
    Customer, Elevator, ElevatorType, Assignment, 
    SalesOpportunity, Quote, QuoteLineItem, 
    Order, OrderLineItem, Report, Service, Absence
)

User = get_user_model()

# Demo-data lister
NORWEGIAN_FIRST_NAMES = [
    'Lars', 'Kari', 'Ole', 'Anne', 'Per', 'Ingrid', 'Hans', 'Berit',
    'Thomas', 'Lise', 'Anders', 'Marit', 'Kristian', 'Hanne', 'Erik',
    'Mette', 'Jan', 'Tone', 'Bjørn', 'Grete', 'Magnus', 'Silje',
    'Jonas', 'Line', 'Marius', 'Hilde', 'Fredrik', 'Nina'
]

NORWEGIAN_LAST_NAMES = [
    'Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen',
    'Nilsen', 'Kristiansen', 'Jensen', 'Karlsen', 'Johnsen', 'Pettersen',
    'Eriksen', 'Berg', 'Haugen', 'Hagen', 'Dahl', 'Lie', 'Moen', 'Ruud'
]

COMPANY_NAMES = [
    'Borettslaget Solsiden', 'Sameiet Fjelltoppen', 'AS Handelshuset',
    'Borettslaget Grønnlia', 'Sameiet Parkveien', 'Hotell Norge AS',
    'Sykehuset i Byen', 'Kjøpesenter Storgata AS', 'Kontorbygg Sentrum AS',
    'Borettslaget Utsikten', 'Eldrehjemmet Solheim', 'Skolebygg Kommune',
    'Idrettshallen AS', 'Kulturhuset', 'Borettslaget Elvekanten',
    'Sameiet Havnegata', 'Industribygg Nord AS', 'Lagerbygg Øst AS'
]

CITIES = [
    'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Fredrikstad',
    'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg', 'Skien', 'Bodø',
    'Ålesund', 'Tønsberg', 'Moss', 'Haugesund', 'Sandefjord', 'Arendal'
]

STREET_NAMES = [
    'Storgata', 'Kirkegata', 'Skolegata', 'Industrigata', 'Parkveien',
    'Solgata', 'Havnegata', 'Torggata', 'Jernbanegata', 'Hospitalgata',
    'Elvegata', 'Fjellveien', 'Ringveien', 'Sentrumsveien', 'Nygata'
]

ELEVATOR_MANUFACTURERS = ['KONE', 'Otis', 'Schindler', 'ThyssenKrupp', 'Orona']

ABSENCE_REASONS = [
    'Ferie', 'Sykdom', 'Kurs', 'Permisjon', 'Avspasering', 
    'Foreldrepermisjon', 'Velferdspermisjon'
]

def create_users():
    """Opprett demo-brukere"""
    print("Oppretter brukere...")
    
    users = []
    
    # Opprett teknikere
    for i in range(5):
        first_name = random.choice(NORWEGIAN_FIRST_NAMES)
        last_name = random.choice(NORWEGIAN_LAST_NAMES)
        username = f"tekniker{i+1}"
        email = f"{first_name.lower()}.{last_name.lower()}@heisfirma.no"
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password='demo123',
            first_name=first_name,
            last_name=last_name,
            role='tekniker',
            phone=f"9{random.randint(1000000, 9999999)}",
            date_of_birth=date(random.randint(1970, 2000), random.randint(1, 12), random.randint(1, 28))
        )
        users.append(user)
        print(f"  - Tekniker: {username} ({first_name} {last_name})")
    
    # Opprett selgere
    for i in range(3):
        first_name = random.choice(NORWEGIAN_FIRST_NAMES)
        last_name = random.choice(NORWEGIAN_LAST_NAMES)
        username = f"selger{i+1}"
        email = f"{first_name.lower()}.{last_name.lower()}@heisfirma.no"
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password='demo123',
            first_name=first_name,
            last_name=last_name,
            role='selger',
            phone=f"9{random.randint(1000000, 9999999)}",
            date_of_birth=date(random.randint(1975, 1995), random.randint(1, 12), random.randint(1, 28))
        )
        users.append(user)
        print(f"  - Selger: {username} ({first_name} {last_name})")
    
    return users

def create_elevator_types():
    """Opprett heistyper"""
    print("\nOppretter heistyper...")
    
    types = [
        {
            'name': 'Personheis Standard',
            'manufacturer': 'KONE',
            'max_load': 630,
            'max_speed': 1.0,
            'max_persons': 8,
            'price': Decimal('450000.00')
        },
        {
            'name': 'Personheis Stor',
            'manufacturer': 'Otis',
            'max_load': 1000,
            'max_speed': 1.6,
            'max_persons': 13,
            'price': Decimal('650000.00')
        },
        {
            'name': 'Vareheis',
            'manufacturer': 'Schindler',
            'max_load': 2000,
            'max_speed': 0.5,
            'max_persons': 0,
            'price': Decimal('550000.00')
        },
        {
            'name': 'Pasientheis',
            'manufacturer': 'ThyssenKrupp',
            'max_load': 1600,
            'max_speed': 1.0,
            'max_persons': 21,
            'price': Decimal('850000.00')
        },
        {
            'name': 'Trappeheis',
            'manufacturer': 'Orona',
            'max_load': 300,
            'max_speed': 0.15,
            'max_persons': 1,
            'price': Decimal('120000.00')
        }
    ]
    
    elevator_types = []
    for type_data in types:
        et = ElevatorType.objects.create(**type_data)
        elevator_types.append(et)
        print(f"  - {et.name} ({et.manufacturer})")
    
    return elevator_types

def create_services():
    """Opprett standard tjenester"""
    print("\nOppretter tjenester...")
    
    services_data = [
        {'name': 'Årlig inspeksjon', 'description': 'Obligatorisk årlig sikkerhetsinspeksjon', 'price': Decimal('5000.00')},
        {'name': 'Service Standard', 'description': 'Standard service og vedlikehold', 'price': Decimal('8500.00')},
        {'name': 'Service Premium', 'description': 'Utvidet service med 24/7 support', 'price': Decimal('15000.00')},
        {'name': 'Nødreparasjon', 'description': 'Akutt reparasjon', 'price': Decimal('12000.00')},
        {'name': 'Modernisering', 'description': 'Oppgradering av eksisterende heis', 'price': Decimal('250000.00')},
    ]
    
    services = []
    for service_data in services_data:
        service = Service.objects.create(**service_data)
        services.append(service)
        print(f"  - {service.name}")
    
    return services

def create_customers():
    """Opprett demo-kunder"""
    print("\nOppretter kunder...")
    
    customers = []
    for i in range(20):
        company = random.choice(COMPANY_NAMES) + f" {i+1}"
        city = random.choice(CITIES)
        street = random.choice(STREET_NAMES)
        street_number = random.randint(1, 150)
        postal_code = f"{random.randint(1000, 9999)}"
        
        customer = Customer.objects.create(
            name=company,
            address=f"{street} {street_number}",
            city=city,
            postal_code=postal_code,
            email=f"post@{company.lower().replace(' ', '').replace('/', '')}.no",
            phone=f"{random.randint(20000000, 99999999)}",
            org_number=f"{random.randint(900000000, 999999999)}",
            contact_person=f"{random.choice(NORWEGIAN_FIRST_NAMES)} {random.choice(NORWEGIAN_LAST_NAMES)}"
        )
        customers.append(customer)
        print(f"  - {customer.name} ({customer.city})")
    
    return customers

def create_elevators(customers, elevator_types):
    """Opprett heiser for kundene"""
    print("\nOppretter heiser...")
    
    elevators = []
    for customer in customers:
        # Hver kunde får 1-3 heiser
        num_elevators = random.randint(1, 3)
        for i in range(num_elevators):
            elevator = Elevator.objects.create(
                customer=customer,
                elevator_type=random.choice(elevator_types),
                serial_number=f"NO-{random.randint(1000, 9999)}-{random.randint(100, 999)}",
                manufacturer=random.choice(ELEVATOR_MANUFACTURERS),
                installation_date=date.today() - timedelta(days=random.randint(365, 7300)),
                location_description=f"Bygning {chr(65 + i)}, {random.choice(['Hovedinngang', 'Bakinngang', 'Vareinngang', 'Personalinngang'])}",
                qr_code=f"QR-{customer.id}-{i+1}-{random.randint(1000, 9999)}"
            )
            elevators.append(elevator)
    
    print(f"  - Opprettet {len(elevators)} heiser")
    return elevators

def create_sales_opportunities(customers, users):
    """Opprett salgsmuligheter"""
    print("\nOppretter salgsmuligheter...")
    
    selgere = [u for u in users if u.role == 'selger']
    statuses = ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost']
    
    opportunities = []
    for i in range(30):
        customer = random.choice(customers)
        created_date = datetime.now() - timedelta(days=random.randint(0, 90))
        
        opportunity = SalesOpportunity.objects.create(
            name=f"{customer.name} - {random.choice(['Ny heis', 'Modernisering', 'Service avtale', 'Utvidelse'])}",
            customer=customer,
            description=f"Interessert i {random.choice(['ny installasjon', 'oppgradering', 'serviceavtale', 'modernisering'])}",
            status=random.choice(statuses),
            estimated_value=Decimal(random.randint(100000, 2000000)),
            created_by=random.choice(selgere),
            created_at=created_date
        )
        opportunities.append(opportunity)
    
    print(f"  - Opprettet {len(opportunities)} salgsmuligheter")
    return opportunities

def create_quotes_and_orders(opportunities, elevator_types, services):
    """Opprett tilbud og ordrer basert på salgsmuligheter"""
    print("\nOppretter tilbud og ordrer...")
    
    quotes = []
    orders = []
    
    # Opprett tilbud for proposal og senere stadier
    relevant_opportunities = [o for o in opportunities if o.status in ['proposal', 'negotiation', 'won']]
    
    for opp in relevant_opportunities:
        # Opprett tilbud
        quote = Quote.objects.create(
            opportunity=opp,
            customer=opp.customer,
            status='sent' if opp.status != 'won' else 'accepted',
            notes=f"Tilbud for {opp.name}",
            customer_notes="Vi tilbyr konkurransedyktige priser og god service.",
            total_amount=opp.estimated_value,
            created_by=opp.created_by
        )
        quotes.append(quote)
        
        # Legg til linjer i tilbudet
        if 'heis' in opp.name.lower() or 'installasjon' in opp.name.lower():
            QuoteLineItem.objects.create(
                quote=quote,
                elevator_type=random.choice(elevator_types),
                quantity=random.randint(1, 3)
            )
        else:
            QuoteLineItem.objects.create(
                quote=quote,
                service=random.choice(services),
                quantity=1
            )
        
        # Opprett ordre for vunnede muligheter
        if opp.status == 'won' and random.random() > 0.3:
            order = Order.objects.create(
                quote=quote,
                customer=opp.customer,
                status='active',
                notes=f"Ordre basert på tilbud {quote.quote_number}",
                created_by=opp.created_by
            )
            orders.append(order)
            
            # Kopier linjer fra tilbud til ordre
            for quote_line in quote.quotelineitem_set.all():
                OrderLineItem.objects.create(
                    order=order,
                    elevator_type=quote_line.elevator_type,
                    service=quote_line.service,
                    quantity=quote_line.quantity,
                    unit_price=quote_line.unit_price
                )
    
    print(f"  - Opprettet {len(quotes)} tilbud og {len(orders)} ordrer")
    return quotes, orders

def create_assignments(customers, elevators, users, orders):
    """Opprett oppdrag"""
    print("\nOppretter oppdrag...")
    
    teknikere = [u for u in users if u.role == 'tekniker']
    statuses = ['ny', 'tildelt', 'påbegynt', 'ferdig', 'fakturert']
    
    assignments = []
    
    # Historiske oppdrag (siste 3 måneder)
    for i in range(60):
        elevator = random.choice(elevators)
        scheduled_date = datetime.now() - timedelta(days=random.randint(0, 90))
        status = random.choice(statuses)
        
        assignment = Assignment.objects.create(
            title=f"{random.choice(['Årlig inspeksjon', 'Service', 'Reparasjon', 'Nødstopp feil', 'Dør problem'])}: {elevator.serial_number}",
            customer=elevator.customer,
            elevator=elevator,
            scheduled_date=scheduled_date,
            deadline_date=scheduled_date + timedelta(days=random.randint(1, 7)),
            status=status,
            assigned_to=random.choice(teknikere) if status != 'ny' else None,
            description=f"Utføre {random.choice(['inspeksjon', 'service', 'reparasjon'])} på heis {elevator.serial_number}",
            priority=random.choice(['lav', 'medium', 'høy'])
        )
        assignments.append(assignment)
    
    # Fremtidige oppdrag (neste måned)
    for i in range(30):
        elevator = random.choice(elevators)
        scheduled_date = datetime.now() + timedelta(days=random.randint(1, 30))
        
        assignment = Assignment.objects.create(
            title=f"{random.choice(['Planlagt service', 'Årlig inspeksjon', 'Forebyggende vedlikehold'])}: {elevator.serial_number}",
            customer=elevator.customer,
            elevator=elevator,
            scheduled_date=scheduled_date,
            deadline_date=scheduled_date + timedelta(days=random.randint(1, 3)),
            status=random.choice(['ny', 'tildelt']),
            assigned_to=random.choice(teknikere) if random.random() > 0.3 else None,
            description=f"Planlagt {random.choice(['service', 'inspeksjon', 'vedlikehold'])} på heis {elevator.serial_number}",
            priority=random.choice(['lav', 'medium'])
        )
        assignments.append(assignment)
    
    # Koble noen oppdrag til ordrer
    for order in orders[:10]:
        if assignments:
            assignment = random.choice(assignments)
            assignment.order = order
            assignment.save()
    
    print(f"  - Opprettet {len(assignments)} oppdrag")
    return assignments

def create_reports(assignments, users):
    """Opprett rapporter for ferdige oppdrag"""
    print("\nOppretter rapporter...")
    
    teknikere = [u for u in users if u.role == 'tekniker']
    completed_assignments = [a for a in assignments if a.status in ['ferdig', 'fakturert']]
    
    reports = []
    for assignment in completed_assignments[:30]:
        report = Report.objects.create(
            assignment=assignment,
            created_by=assignment.assigned_to or random.choice(teknikere),
            work_description=f"Utført {assignment.title.split(':')[0].lower()}. Alt fungerer som det skal.",
            findings=random.choice([
                "Ingen feil funnet.",
                "Mindre slitasje på dørgummi, bør skiftes ved neste service.",
                "Bremsesystem justert.",
                "Oljenivå påfylt.",
                "Sikkerhetssystemer testet og godkjent."
            ]),
            recommendations=random.choice([
                "Fortsett med standard vedlikeholdsplan.",
                "Anbefaler hyppigere service.",
                "Vurder modernisering innen 2 år.",
                "Ingen spesielle anbefalinger.",
                "Bytt ut slitte deler ved neste service."
            ]),
            work_hours=random.uniform(1.5, 4.0),
            travel_hours=random.uniform(0.5, 2.0)
        )
        reports.append(report)
    
    print(f"  - Opprettet {len(reports)} rapporter")
    return reports

def create_absences(users):
    """Opprett fravær for ansatte"""
    print("\nOppretter fravær...")
    
    absences = []
    
    # Historisk fravær
    for user in users:
        # Hver bruker har 0-3 fraværsperioder
        for _ in range(random.randint(0, 3)):
            start_date = date.today() - timedelta(days=random.randint(1, 180))
            end_date = start_date + timedelta(days=random.randint(1, 14))
            
            absence = Absence.objects.create(
                user=user,
                start_date=start_date,
                end_date=end_date,
                reason=random.choice(ABSENCE_REASONS),
                description=f"{random.choice(ABSENCE_REASONS)} periode"
            )
            absences.append(absence)
    
    # Fremtidig fravær
    for user in random.sample(users, min(5, len(users))):
        start_date = date.today() + timedelta(days=random.randint(1, 60))
        end_date = start_date + timedelta(days=random.randint(1, 7))
        
        absence = Absence.objects.create(
            user=user,
            start_date=start_date,
            end_date=end_date,
            reason='Ferie',
            description='Planlagt ferie'
        )
        absences.append(absence)
    
    print(f"  - Opprettet {len(absences)} fraværsperioder")
    return absences

def main():
    """Hovedfunksjon som kjører alle opprettelsene"""
    print("=== Starter generering av demo-data for HeisAdmin ===\n")
    
    try:
        # Sjekk om det allerede finnes data
        if Customer.objects.exists():
            response = input("Det finnes allerede data i databasen. Vil du slette alt og starte på nytt? (ja/nei): ")
            if response.lower() != 'ja':
                print("Avbryter...")
                return
            
            # Slett eksisterende data
            print("\nSletter eksisterende data...")
            Report.objects.all().delete()
            Assignment.objects.all().delete()
            OrderLineItem.objects.all().delete()
            Order.objects.all().delete()
            QuoteLineItem.objects.all().delete()
            Quote.objects.all().delete()
            SalesOpportunity.objects.all().delete()
            Elevator.objects.all().delete()
            Customer.objects.all().delete()
            Service.objects.all().delete()
            ElevatorType.objects.all().delete()
            Absence.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
        
        # Opprett data i riktig rekkefølge
        users = create_users()
        elevator_types = create_elevator_types()
        services = create_services()
        customers = create_customers()
        elevators = create_elevators(customers, elevator_types)
        opportunities = create_sales_opportunities(customers, users)
        quotes, orders = create_quotes_and_orders(opportunities, elevator_types, services)
        assignments = create_assignments(customers, elevators, users, orders)
        reports = create_reports(assignments, users)
        absences = create_absences(users)
        
        print("\n=== Demo-data generert! ===")
        print(f"\nOpprettet totalt:")
        print(f"  - {len(users)} brukere")
        print(f"  - {len(customers)} kunder")
        print(f"  - {len(elevators)} heiser")
        print(f"  - {len(opportunities)} salgsmuligheter")
        print(f"  - {len(quotes)} tilbud")
        print(f"  - {len(orders)} ordrer")
        print(f"  - {len(assignments)} oppdrag")
        print(f"  - {len(reports)} rapporter")
        print(f"  - {len(absences)} fraværsperioder")
        
        print("\n=== Innloggingsinformasjon ===")
        print("Alle demo-brukere har passord: demo123")
        print("\nTeknikere: tekniker1, tekniker2, tekniker3, tekniker4, tekniker5")
        print("Selgere: selger1, selger2, selger3")
        
    except Exception as e:
        print(f"\nFeil oppstod: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()