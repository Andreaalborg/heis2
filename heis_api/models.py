from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

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