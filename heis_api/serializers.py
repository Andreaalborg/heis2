from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User, Customer, ElevatorType, Elevator, Assignment, AssignmentNote, Part, AssignmentPart, AssignmentChecklist, Report, Service, SalesOpportunity, QuoteLineItem, Quote, OrderLineItem, Order, Absence
from django.db.models import OuterRef, Subquery, F, CharField, Value
from django.db.models.functions import Coalesce

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
        fields = ('id', 'name', 'description', 'price')

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
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    elevator_serial = serializers.CharField(source='elevator.serial_number', read_only=True, allow_null=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_assignment_type_display', read_only=True)
    # Inkluderer relatert ordre-ID
    order_id = serializers.IntegerField(source='order.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Assignment
        fields = (
            'id', 'title', 'customer', 'customer_name', 'elevator', 'elevator_serial',
            'assigned_to', 'assigned_to_name', 'status', 'status_display', 
            'scheduled_date', 'created_at', 'assignment_type', 'type_display',
            'order', 'order_id',
            # Legger til manglende felt for listevisning
            'description', 'deadline_date' 
        )
        read_only_fields = ('created_at', 'customer_name', 'elevator_serial', 'assigned_to_name', 'status_display', 'type_display', 'order_id')

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
        fields = AssignmentSerializer.Meta.fields + (
            'description', 'deadline_date', 'updated_at', 'completed_at',
            'procedure_step', 'checklist_status', 'procedure_notes',
            'notes', 'parts_used' # Legger til notes og parts
        )
        read_only_fields = AssignmentSerializer.Meta.read_only_fields + ('updated_at', 'completed_at', 'notes', 'parts_used')

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

class QuoteLineItemSerializer(serializers.ModelSerializer):
    # Viser detaljer om heistypen ved lesing
    elevator_type_details = ElevatorTypeSerializer(source='elevator_type', read_only=True)
    # Beregner linjetotal dynamisk
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = QuoteLineItem
        # Tar nå imot elevator_type ID, ikke description/unit_price
        fields = ('id', 'quote', 'elevator_type', 'elevator_type_details', 'quantity', 'line_total')
        # read_only_fields fjernes da vi ikke har unit_price/line_total direkte i modellen

    def get_line_total(self, obj):
        # Beregner total: antall * pris fra heistype
        if obj.elevator_type and obj.elevator_type.price is not None:
            return obj.quantity * obj.elevator_type.price
        return 0 # Eller annen håndtering hvis pris mangler

class QuoteSerializer(serializers.ModelSerializer):
    line_items = QuoteLineItemSerializer(many=True, read_only=True) 
    opportunity_details = SalesOpportunitySerializer(source='opportunity', read_only=True) 
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # Beregner totalsum dynamisk
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = (
            'id', 'opportunity', 'opportunity_details', 'quote_number', 'issue_date', 
            'expiry_date', 'status', 'status_display', 'notes', 'customer_notes', 
            'total_amount', 'line_items', 
            'order', # Legger til relatert ordre-ID
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'quote_number', 
            'status_display',
            'line_items', 
            'opportunity_details',
            'total_amount', 
            'order', # Ordre-ID er også read-only her
            'created_at', 
            'updated_at'
        )

    def get_total_amount(self, obj):
        # Gjenbruker line_total beregningen fra QuoteLineItemSerializer
        total = 0
        # Må hente line_items direkte fra databasen her, da read_only=True 
        # betyr at de ikke er tilgjengelig i validated_data under create/update.
        # For GET-requests vil obj.line_items.all() fungere hvis prefetch_related brukes i viewet.
        # For enkelhets skyld her, antar vi at vi henter data (GET)
        for item in obj.line_items.all(): 
             if item.elevator_type and item.elevator_type.price is not None:
                 total += item.quantity * item.elevator_type.price
        return total

    # Fjerner TODO om å oppdatere total_amount i modellen
    # Nå skjer beregningen i serializeren.

class OrderLineItemSerializer(serializers.ModelSerializer):
    # Viser detaljer om heistypen ved lesing
    elevator_type_details = ElevatorTypeSerializer(source='elevator_type', read_only=True)
    
    class Meta:
        model = OrderLineItem
        fields = (
            'id', 'order', 'elevator_type', 'elevator_type_details', 
            'quantity', 'unit_price_at_order', 'line_total'
        )
        read_only_fields = ('line_total',) # Beregnes i modellen nå

class OrderSerializer(serializers.ModelSerializer):
    line_items = OrderLineItemSerializer(many=True, read_only=True)
    # Henter kundenavn direkte for enklere visning
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    # Viser status-tekst
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # Kan også inkludere tilbudsnummer hvis ønskelig
    quote_number = serializers.CharField(source='quote.quote_number', read_only=True, allow_null=True)
    # Viser relaterte oppdrag (kun IDer for enkelhet)
    assignment_ids = serializers.PrimaryKeyRelatedField(source='assignments', many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'quote', 'quote_number', 'customer', 'customer_name', 'order_date', 
            'status', 'status_display', 'total_amount', 'notes', 
            'line_items', 
            'assignment_ids', # Legger til assignment IDs
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'customer_name', 
            'status_display', 
            'line_items', 
            'quote_number', 
            'assignment_ids', # Assignments er read-only her
            'created_at', 
            'updated_at'
        )
        # Merk: total_amount og customer bør settes ved opprettelse,
        # ikke direkte redigeres etterpå (hentes fra tilbud).

# Serializer for Fravær
class AbsenceSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True) # Viser brukerinfo
    absence_type_display = serializers.CharField(source='get_absence_type_display', read_only=True)

    class Meta:
        model = Absence
        fields = (
            'id', 'user', 'user_details', 'start_date', 'end_date', 
            'absence_type', 'absence_type_display', 'description', 'created_at'
        )
        read_only_fields = ('user_details', 'absence_type_display', 'created_at')

# Serializer for prosjektsammendrag
class ProjectSummarySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # Henter annoterte felt fra queryset
    last_quote_status = serializers.CharField(read_only=True)
    last_quote_status_display = serializers.CharField(read_only=True)
    order_status = serializers.CharField(read_only=True)
    order_status_display = serializers.CharField(read_only=True)
    order_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = SalesOpportunity
        fields = (
            'id', 'name', 'customer', 'customer_name', 'status', 'status_display',
            'estimated_value', 'created_at',
            'last_quote_status', 'last_quote_status_display', # Nye felt
            'order_id', 'order_status', 'order_status_display' # Nye felt
        )