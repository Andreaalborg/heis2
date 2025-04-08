from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

def elevator_manual_upload_path(instance, filename):
    # Filen vil lastes opp til MEDIA_ROOT/elevator_manuals/elevator_id_filename
    return f'elevator_manuals/{instance.id}_{filename}'

def elevator_cert_upload_path(instance, filename):
    # Filen vil lastes opp til MEDIA_ROOT/elevator_certificates/elevator_id_filename
    return f'elevator_certificates/{instance.id}_{filename}'

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('tekniker', 'Tekniker'),
        ('selger', 'Selger'),
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='tekniker')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    driver_license = models.FileField(upload_to='driver_licenses/', null=True, blank=True)
    other_certificate = models.FileField(upload_to='certificates/', null=True, blank=True)
    
    def __str__(self):
        return self.username

class Customer(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    contact_person_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='customers'
    )
    email = models.EmailField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=200)
    zip_code = models.CharField(max_length=10)
    city = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

    @property
    def contact_person_name(self):
        if self.contact_person_user:
            user = self.contact_person_user
            return f"{user.first_name} {user.last_name}" if user.first_name else user.username
        return self.contact_person or ""

class ElevatorType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Standard Pris")
    
    def __str__(self):
        return self.name

class Elevator(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='elevators')
    elevator_type = models.ForeignKey(ElevatorType, on_delete=models.SET_NULL, null=True, related_name='elevators')
    serial_number = models.CharField(max_length=100, unique=True)
    installation_date = models.DateField(blank=True, null=True)
    last_inspection_date = models.DateField(blank=True, null=True)
    next_inspection_date = models.DateField(blank=True, null=True)
    location_description = models.TextField(blank=True, null=True)
    
    # Nye felt for dokumentopplasting
    service_manual = models.FileField(upload_to=elevator_manual_upload_path, null=True, blank=True)
    certification = models.FileField(upload_to=elevator_cert_upload_path, null=True, blank=True)
    
    def __str__(self):
        return f"{self.serial_number} - {self.customer.name}"

class SalesOpportunity(models.Model):
    """ Representerer en salgsmulighet eller et lead."""
    STATUS_CHOICES = (
        ('new', 'Ny'),
        ('contacted', 'Kontaktet'),
        ('proposal', 'Tilbud Sendt'),
        ('negotiation', 'Forhandling'),
        ('won', 'Vunnet'),
        ('lost', 'Tapt'),
    )

    name = models.CharField(max_length=255, verbose_name="Navn/Beskrivelse")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='opportunities', verbose_name="Kunde")
    description = models.TextField(blank=True, null=True, verbose_name="Detaljert beskrivelse")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name="Status")
    estimated_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Estimert verdi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Opprettet")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Sist oppdatert")
    # Man kan legge til flere felter her, f.eks. kobling til ansvarlig selger (User)

    class Meta:
        verbose_name = "Salgsmulighet"
        verbose_name_plural = "Salgsmuligheter"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.customer.name}) - {self.get_status_display()}"

class Quote(models.Model):
    """ Representerer et tilbud sendt til en kunde. """
    STATUS_CHOICES = (
        ('draft', 'Utkast'),
        ('sent', 'Sendt'),
        ('accepted', 'Akseptert'),
        ('rejected', 'Avslått'),
    )

    opportunity = models.ForeignKey(SalesOpportunity, on_delete=models.CASCADE, related_name='quotes', verbose_name="Tilhørende Salgsmulighet")
    quote_number = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name="Tilbudsnummer")
    issue_date = models.DateField(default=timezone.localdate, verbose_name="Utstedelsesdato")
    expiry_date = models.DateField(null=True, blank=True, verbose_name="Gyldig til dato")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="Status")
    notes = models.TextField(blank=True, null=True, verbose_name="Interne notater")
    customer_notes = models.TextField(blank=True, null=True, verbose_name="Notater til kunde")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Totalsum")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # TODO: Implement logic for generating quote_number (e.g., in save method)
    # TODO: Implement logic to auto-update total_amount based on line items

    class Meta:
        verbose_name = "Tilbud"
        verbose_name_plural = "Tilbud"
        ordering = ['-issue_date']

    def __str__(self):
        return f"Tilbud {self.quote_number or self.id} til {self.opportunity.customer.name}"

    # Eksempel på save-metode for å generere nummer (må tilpasses)
    # def save(self, *args, **kwargs):
    #     if not self.quote_number:
    #         # Logikk for å finne neste nummer, f.eks. basert på år og sekvens
    #         last_quote = Quote.objects.order_by('id').last()
    #         next_id = (last_quote.id + 1) if last_quote else 1
    #         self.quote_number = f"QT-{timezone.now().year}-{next_id:04d}"
    #     super().save(*args, **kwargs)

class QuoteLineItem(models.Model):
    """ Representerer en linje i et tilbud. """
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='line_items', verbose_name="Tilbud")
    # Erstatter beskrivelse/pris med kobling til ElevatorType
    elevator_type = models.ForeignKey(ElevatorType, on_delete=models.SET_NULL, null=True, verbose_name="Heistype") 
    quantity = models.PositiveIntegerField(default=1, verbose_name="Antall")
    # Fjerner unit_price og description, hentes fra elevator_type
    # Fjerner line_total, beregnes dynamisk

    # Fjerner save-metoden som beregnet linjetotal basert på unit_price
    # def save(self, *args, **kwargs): ...

    def __str__(self):
        type_name = self.elevator_type.name if self.elevator_type else "Ukjent Type"
        return f"{self.quantity} x {type_name} for Quote {self.quote.id}"

    class Meta:
        verbose_name = "Tilbudslinje"
        verbose_name_plural = "Tilbudslinjer"

class Order(models.Model):
    """ Representerer en bekreftet ordre, ofte basert på et akseptert tilbud. """
    STATUS_CHOICES = (
        ('pending', 'Avventer Behandling'), 
        ('processing', 'Under Behandling'), 
        ('shipped', 'Sendt/Levert'), 
        ('invoiced', 'Fakturert'),
        ('completed', 'Fullført'),
        ('cancelled', 'Kansellert'),
    )

    quote = models.OneToOneField(Quote, on_delete=models.SET_NULL, null=True, blank=True, related_name='order', verbose_name="Basert på Tilbud")
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders', verbose_name="Kunde") # Hentes fra quote/opportunity
    order_date = models.DateField(default=timezone.localdate, verbose_name="Ordredato")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Ordrestatus")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Totalsum") # Kopieres fra quote
    notes = models.TextField(blank=True, null=True, verbose_name="Interne Ordrenotater")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ordre"
        verbose_name_plural = "Ordrer"
        ordering = ['-order_date']

    def __str__(self):
        return f"Ordre {self.id} for {self.customer.name}"

class OrderLineItem(models.Model):
    """ Representerer en linje i en ordre, kopiert fra tilbudslinje. """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='line_items', verbose_name="Ordre")
    elevator_type = models.ForeignKey(ElevatorType, on_delete=models.SET_NULL, null=True, verbose_name="Heistype") 
    quantity = models.PositiveIntegerField(default=1, verbose_name="Antall")
    unit_price_at_order = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Enhetspris ved bestilling")
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Linjesum")

    def save(self, *args, **kwargs):
        self.line_total = self.quantity * self.unit_price_at_order
        super().save(*args, **kwargs)
        # TODO: Oppdatere Order.total_amount etter lagring/sletting

    def __str__(self):
        type_name = self.elevator_type.name if self.elevator_type else "Ukjent Type"
        return f"{self.quantity} x {type_name} for Order {self.order.id}"

    class Meta:
        verbose_name = "Ordrelinje"
        verbose_name_plural = "Ordrelinjer"

class Assignment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Venter'),
        ('in_progress', 'Pågår'),
        ('completed', 'Fullført'),
        ('cancelled', 'Kansellert'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Lav'),
        ('medium', 'Medium'),
        ('high', 'Høy'),
        ('urgent', 'Kritisk'),
    )
    
    ASSIGNMENT_TYPE_CHOICES = (
        ('installation', 'Installasjon'),
        ('service', 'Service'),
        ('repair', 'Reparasjon'),
        ('inspection', 'Inspeksjon'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='assignments', verbose_name="Tilhørende Ordre")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='assignments')
    elevator = models.ForeignKey(Elevator, on_delete=models.SET_NULL, null=True, blank=True, related_name='assignments')
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assignments')
    assignment_type = models.CharField(max_length=50, choices=ASSIGNMENT_TYPE_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    scheduled_date = models.DateTimeField(null=True, blank=True)
    deadline_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # --- NYE FELT FOR PROSEDYRE/SJEKKLISTE ---
    procedure_step = models.IntegerField(default=0, null=True, blank=True, help_text="Nåværende steg i heisprosedyren (0=ikke startet)")
    checklist_status = models.JSONField(default=dict, null=True, blank=True, help_text="Status for sjekklistepunkter (JSON)")
    procedure_notes = models.TextField(blank=True, null=True, help_text="Notater fra tekniker under prosedyren")
    # -----------------------------------------

    def __str__(self):
        return self.title

# Legg til de manglende modellene for AssignmentNote og AssignmentPart
class AssignmentNote(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.assignment.title} by {self.user.username}"

class Part(models.Model):
    name = models.CharField(max_length=100)
    part_number = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    stock_quantity = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.part_number} - {self.name}"

class AssignmentPart(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='parts_used')
    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    
    def __str__(self):
        return f"{self.quantity}x {self.part.name} for {self.assignment.title}"

# Ny modell for sjekkliste per oppdrag
class AssignmentChecklist(models.Model):
    assignment = models.OneToOneField(
        Assignment, 
        on_delete=models.CASCADE, 
        related_name='checklist',
        primary_key=True, # Bruker assignment ID som PK
    )
    # JSONField for fleksibel lagring av sjekklistesteg og status
    # Eksempel: {"step1_status": "completed", "step2_notes": "...", "step3_photo": "url..."}
    checklist_data = models.JSONField(default=dict, blank=True)
    # Lagrer beregnet fullføringsprosent
    completion_percentage = models.IntegerField(default=0, validators=[
        MinValueValidator(0), 
        MaxValueValidator(100)
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Checklist for Assignment {self.assignment.id}: {self.assignment.title}"

    # Valgfritt: Metode for å oppdatere prosent (kan også gjøres i view/serializer)
    # def update_completion_percentage(self):
    #     # Logikk for å beregne prosent basert på checklist_data
    #     # ... f.eks. telle antall "completed" steg ...
    #     total_steps = 5 # Eksempel, dette må defineres/hentes et sted
    #     completed_steps = 0
    #     for key, value in self.checklist_data.items():
    #         if isinstance(value, dict) and value.get('status') == 'completed':
    #             completed_steps += 1
    #         elif isinstance(value, str) and value == 'completed': # Enklere format
    #             completed_steps += 1
        
    #     if total_steps > 0:
    #         self.completion_percentage = int((completed_steps / total_steps) * 100)
    #     else:
    #         self.completion_percentage = 0
    #     self.save()

class Report(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='reports')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Report for {self.assignment.title} by {self.created_by.username}"

class Service(models.Model):
    elevator = models.ForeignKey(Elevator, on_delete=models.CASCADE, related_name='services')
    service_date = models.DateField()
    description = models.TextField()
    completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Service på {self.elevator} - {self.service_date}"

# Ny modell for fravær
class Absence(models.Model):
    """ Representerer en periode med fravær for en ansatt. """
    ABSENCE_TYPE_CHOICES = (
        ('sick_leave', 'Sykemelding'),
        ('vacation', 'Ferie'),
        ('leave_of_absence', 'Permisjon'),
        ('public_holiday', 'Helligdag'), # Kan evt. legges inn sentralt
        ('other', 'Annet'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='absences', verbose_name="Ansatt")
    start_date = models.DateField(verbose_name="Startdato")
    end_date = models.DateField(verbose_name="Sluttdato (inkl.)") # Inkluderer denne dagen
    absence_type = models.CharField(max_length=20, choices=ABSENCE_TYPE_CHOICES, verbose_name="Type fravær")
    description = models.TextField(blank=True, null=True, verbose_name="Beskrivelse/Kommentar")
    created_at = models.DateTimeField(auto_now_add=True)
    # Kan legge til felt for hvem som registrerte fraværet
    # registered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='registered_absences')

    class Meta:
        verbose_name = "Fravær"
        verbose_name_plural = "Fravær"
        ordering = ['-start_date']
        # Sikrer at en bruker ikke har overlappende fravær (kan justeres/fjernes)
        # constraints = [
        #     models.CheckConstraint(
        #         check=models.Q(end_date__gte=models.F('start_date')),
        #         name='end_date_gte_start_date'
        #     ),
        #     # Mer kompleks sjekk for overlapp trengs hvis det er kritisk
        # ]

    def __str__(self):
        return f"{self.user.username} - {self.get_absence_type_display()} ({self.start_date} - {self.end_date})"

# Register your models here.