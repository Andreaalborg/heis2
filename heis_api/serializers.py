from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User, Customer, ElevatorType, Elevator, Assignment, AssignmentNote, Part, AssignmentPart, AssignmentChecklist, Report, Service, SalesOpportunity

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'phone_number', 'date_of_birth', 'is_active',
            'profile_picture', 'driver_license', 'other_certificate',
            'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'role': {'required': True},
            # FJERNER read_only for fil-felter for å teste PATCH/PUT
            # 'profile_picture': {'read_only': True},
            # 'driver_license': {'read_only': True},
            # 'other_certificate': {'read_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        instance = self.Meta.model(**validated_data)
        instance.set_password(password)
        instance.is_active = True  # Sikrer at brukeren er aktiv ved opprettelse
        instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class ElevatorTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElevatorType
        fields = '__all__'

class ElevatorSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    elevator_type_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Elevator
        fields = [
            'id', 'customer', 'customer_name', 'elevator_type', 'elevator_type_name', 
            'serial_number', 'installation_date', 'last_inspection_date', 
            'next_inspection_date', 'location_description',
            'service_manual', 'certification'  # Legger til de nye felten
        ]
    
    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else None
    
    def get_elevator_type_name(self, obj):
        return obj.elevator_type.name if obj.elevator_type else None

class ElevatorDetailSerializer(serializers.ModelSerializer):
    elevator_type = ElevatorTypeSerializer(read_only=True)
    
    class Meta:
        model = Elevator
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    contact_person_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ['id', 'name', 'contact_person', 'contact_person_user', 'contact_person_name', 'email', 'phone', 'address', 'zip_code', 'city', 'created_at', 'updated_at']
    
    def get_contact_person_name(self, obj):
        if obj.contact_person_user:
            return f"{obj.contact_person_user.first_name} {obj.contact_person_user.last_name}" if obj.contact_person_user.first_name else obj.contact_person_user.username
        return obj.contact_person or ""

class CustomerDetailSerializer(serializers.ModelSerializer):
    elevators = ElevatorSerializer(many=True, read_only=True)
    contact_person_user = UserSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'

class PartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Part
        fields = ['id', 'name', 'description', 'price']

class AssignmentNoteSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentNote
        fields = ['id', 'assignment', 'user', 'user_name', 'content', 'created_at']
        read_only_fields = ['user', 'created_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

class AssignmentPartSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_price = serializers.DecimalField(source='part.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = AssignmentPart
        fields = ['id', 'assignment', 'part', 'part_name', 'part_price', 'quantity']

class AssignmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    elevator_serial = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'customer', 'customer_name', 
            'elevator', 'elevator_serial', 'assigned_to', 'assigned_to_name', 
            'assignment_type', 'status', 'scheduled_date', 'deadline_date', 
            'created_at', 'updated_at', 'completed_at',
            'procedure_step', 'checklist_status', 'procedure_notes' 
        ]
        # Vurder read_only for noen felt om nødvendig
        # read_only_fields = ['created_at', 'updated_at']

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else None
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return "Ikke tildelt"

    def get_elevator_serial(self, obj):
        return obj.elevator.serial_number if obj.elevator else None

    def validate_status(self, value):
        if value not in [choice[0] for choice in Assignment.STATUS_CHOICES]:
            raise serializers.ValidationError("Ugyldig statusverdi.")
        return value

    def validate_priority(self, value):
        if value not in [choice[0] for choice in Assignment.PRIORITY_CHOICES]:
            raise serializers.ValidationError("Ugyldig prioritetsverdi.")
        return value

    def validate_assignment_type(self, value):
        if value not in [choice[0] for choice in Assignment.ASSIGNMENT_TYPE_CHOICES]:
            raise serializers.ValidationError("Ugyldig oppdragstype.")
        return value

class AssignmentChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentChecklist
        # Inkluderer alle felt som frontend trenger å lese/skrive
        fields = [
            'assignment', # read-only, siden den er PK
            'checklist_data', 
            'completion_percentage', 
            'updated_at'
        ]
        read_only_fields = ['assignment', 'updated_at'] # Assignment settes via URL, updated_at automatisk

    # Valgfritt: Legg til validering for checklist_data hvis spesifikk struktur kreves
    # def validate_checklist_data(self, value):
    #     if not isinstance(value, dict):
    #         raise serializers.ValidationError("checklist_data må være et JSON-objekt.")
    #     # ... annen validering ...
    #     return value

class ReportSerializer(serializers.ModelSerializer):
    # Henter brukernavn for read-only visning
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 
            'assignment', 
            'content', 
            'created_at', 
            'updated_at', 
            'created_by', # Skrive-felt (ID)
            'created_by_username' # Lese-felt (navn)
        ]
        # created_by settes automatisk i viewet basert på innlogget bruker
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'created_by_username']

class AssignmentDetailSerializer(AssignmentSerializer):
    customer = CustomerSerializer(read_only=True)
    elevator = ElevatorDetailSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    notes = AssignmentNoteSerializer(many=True, read_only=True)
    parts_used = AssignmentPartSerializer(many=True, read_only=True)
    
    class Meta(AssignmentSerializer.Meta):
        fields = AssignmentSerializer.Meta.fields + ['notes', 'parts_used']
        # Eksempel på dypere nesting hvis ønskelig:
        # depth = 1

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class SalesOpportunitySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SalesOpportunity
        fields = (
            'id', 'name', 'customer', 'customer_name', 'description',
            'status', 'status_display', 'estimated_value',
            'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at', 'customer_name', 'status_display')