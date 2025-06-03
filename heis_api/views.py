from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import User, Customer, ElevatorType, Elevator, Assignment, AssignmentNote, Part, AssignmentPart, AssignmentChecklist, Report, SalesOpportunity, Quote, QuoteLineItem, Order, OrderLineItem, Absence
from .serializers import (
    UserSerializer, CustomerSerializer, CustomerDetailSerializer,
    ElevatorTypeSerializer, ElevatorSerializer, ElevatorDetailSerializer,
    PartSerializer, AssignmentPartSerializer, AssignmentNoteSerializer,
    AssignmentSerializer, AssignmentDetailSerializer, AssignmentChecklistSerializer,
    ReportSerializer, SalesOpportunitySerializer, QuoteSerializer, QuoteLineItemSerializer,
    OrderSerializer, OrderLineItemSerializer, AbsenceSerializer, ProjectSummarySerializer
)
import os
from django.conf import settings
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import RetrieveUpdateAPIView
from django.http import HttpResponse
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.shortcuts import get_object_or_404
from io import BytesIO
from django.views import View
from django.db import transaction
from django.db.models import OuterRef, Subquery, F, Max, Value, CharField
from django.db.models.functions import Coalesce

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'admin'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    
    def perform_update(self, serializer):
        instance = self.get_object()
        request_data = self.request.data
        
        if 'profile_picture' in request_data and request_data['profile_picture'] == '':
            if instance.profile_picture:
                if os.path.isfile(os.path.join(settings.MEDIA_ROOT, instance.profile_picture.name)):
                    os.remove(os.path.join(settings.MEDIA_ROOT, instance.profile_picture.name))
            instance.profile_picture = None
        
        if 'driver_license' in request_data and request_data['driver_license'] == '':
            if instance.driver_license:
                if os.path.isfile(os.path.join(settings.MEDIA_ROOT, instance.driver_license.name)):
                    os.remove(os.path.join(settings.MEDIA_ROOT, instance.driver_license.name))
            instance.driver_license = None
        
        if 'other_certificate' in request_data and request_data['other_certificate'] == '':
            if instance.other_certificate:
                if os.path.isfile(os.path.join(settings.MEDIA_ROOT, instance.other_certificate.name)):
                    os.remove(os.path.join(settings.MEDIA_ROOT, instance.other_certificate.name))
            instance.other_certificate = None
        
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def current_user(self, request):
        user = request.user
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def tekniker(self, request):
        tekniker = User.objects.filter(role='tekniker', is_active=True)
        serializer = self.get_serializer(tekniker, many=True)
        return Response(serializer.data)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'contact_person', 'email', 'phone', 'address', 'city']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CustomerDetailSerializer
        return CustomerSerializer

class ElevatorTypeViewSet(viewsets.ModelViewSet):
    queryset = ElevatorType.objects.all().order_by('name')
    serializer_class = ElevatorTypeSerializer
    permission_classes = [IsAdminOrReadOnly]

class ElevatorViewSet(viewsets.ModelViewSet):
    queryset = Elevator.objects.all()
    serializer_class = ElevatorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['customer', 'elevator_type']
    search_fields = ['serial_number', 'location_description', 'customer__name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ElevatorDetailSerializer
        return ElevatorSerializer
    
    def perform_update(self, serializer):
        instance = self.get_object()
        request_data = self.request.data
        
        if 'service_manual' in request_data and request_data['service_manual'] == '':
            if instance.service_manual:
                if os.path.isfile(os.path.join(settings.MEDIA_ROOT, instance.service_manual.name)):
                    os.remove(os.path.join(settings.MEDIA_ROOT, instance.service_manual.name))
            instance.service_manual = None
        
        if 'certification' in request_data and request_data['certification'] == '':
            if instance.certification:
                if os.path.isfile(os.path.join(settings.MEDIA_ROOT, instance.certification.name)):
                    os.remove(os.path.join(settings.MEDIA_ROOT, instance.certification.name))
            instance.certification = None
        
        serializer.save()
    
    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        elevator = self.get_object()
        assignments = Assignment.objects.filter(elevator=elevator)
        serializer = AssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

class PartViewSet(viewsets.ModelViewSet):
    queryset = Part.objects.all().order_by('name')
    serializer_class = PartSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'part_number', 'description']
    permission_classes = [IsAdminOrReadOnly]

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'status': ['exact', 'in'],
        'assignment_type': ['exact', 'in'],
        'assigned_to': ['exact'],
        'customer': ['exact'],
        'scheduled_date': ['gte', 'lte', 'exact', 'isnull'],
        'deadline_date': ['gte', 'lte', 'exact', 'isnull'],
    }
    search_fields = ['title', 'description', 'customer__name', 'elevator__serial_number']
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AssignmentDetailSerializer
        return AssignmentSerializer
    
    @action(detail=False, methods=['get'])
    def mine(self, request):
        assignments = Assignment.objects.filter(assigned_to=request.user).order_by('status', 'scheduled_date')
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        assignments = Assignment.objects.filter(scheduled_date=today).order_by('scheduled_time')
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unassigned(self, request):
        assignments = Assignment.objects.filter(assigned_to=None, status='pending').order_by('scheduled_date')
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        assignment = self.get_object()
        serializer = AssignmentNoteSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(assignment=assignment, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_part(self, request, pk=None):
        assignment = self.get_object()
        serializer = AssignmentPartSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(assignment=assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        assignment = self.get_object()
        if not (request.user.is_staff or assignment.assigned_to == request.user):
             raise PermissionDenied("Du har ikke tilgang til å fullføre dette oppdraget.")
        assignment.status = 'completed'
        assignment.completed_at = timezone.now()
        assignment.save()
        serializer = self.get_serializer(assignment)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='update-procedure')
    def update_procedure(self, request, pk=None):
        assignment = self.get_object()
        user = request.user

        if not (user.is_staff or assignment.assigned_to == user):
            raise PermissionDenied("Du har ikke tilgang til å oppdatere prosedyren for dette oppdraget.")

        serializer = self.get_serializer(
            instance=assignment, 
            data=request.data, 
            partial=True, 
            fields=['procedure_step', 'checklist_status', 'procedure_notes']
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AssignmentNoteViewSet(viewsets.ModelViewSet):
    queryset = AssignmentNote.objects.all()
    serializer_class = AssignmentNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AssignmentPartViewSet(viewsets.ModelViewSet):
    queryset = AssignmentPart.objects.all()
    serializer_class = AssignmentPartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = AssignmentPart.objects.all()
        assignment_id = self.request.query_params.get('assignment', None)
        if assignment_id is not None:
            queryset = queryset.filter(assignment_id=assignment_id)
        return queryset

# ViewSet for å håndtere sjekkliste for et spesifikt oppdrag
class AssignmentChecklistViewSet(RetrieveUpdateAPIView):
    """ API View for å hente og oppdatere sjekklisten for et spesifikt oppdrag. """
    queryset = AssignmentChecklist.objects.all()
    serializer_class = AssignmentChecklistSerializer
    permission_classes = [permissions.IsAuthenticated] # Bør finjusteres
    lookup_field = 'assignment_id' # Bruker assignment ID fra URL
    lookup_url_kwarg = 'assignment_pk' # Navn på parameter i URL

    def get_object(self):
        # Henter assignment ID fra URL
        assignment_id = self.kwargs.get(self.lookup_url_kwarg)
        
        # Prøv å finne sjekklisten, eller opprett den hvis den ikke finnes
        checklist, created = AssignmentChecklist.objects.get_or_create(
            assignment_id=assignment_id,
            # Kan sette default checklist_data her hvis ønskelig ved opprettelse
            # defaults={'checklist_data': {'step1': 'pending'}}
        )

        # Sjekk tillatelser (f.eks., kun tildelt bruker eller admin)
        assignment = checklist.assignment
        user = self.request.user
        if not (user.is_staff or assignment.assigned_to == user):
            raise PermissionDenied("Du har ikke tilgang til å se eller endre denne sjekklisten.")

        return checklist

    # PUT/PATCH håndteres av RetrieveUpdateAPIView og serializeren
    # Vi kan legge til logikk i perform_update for å f.eks. beregne prosent
    def perform_update(self, serializer):
        # Her kan vi legge inn logikk FØR lagring hvis nødvendig
        # F.eks., beregne completion_percentage basert på oppdatert checklist_data
        checklist_data = serializer.validated_data.get('checklist_data', serializer.instance.checklist_data)
        
        # --- Eksempel på prosentberegning (krever definisjon av steg) ---
        # total_steps = 5 # Må defineres basert på oppdragstype/sjekkliste
        # completed_steps = 0
        # for key, value in checklist_data.items():
        #     if 'status' in value and value['status'] == 'completed':
        #          completed_steps += 1
        # percentage = int((completed_steps / total_steps) * 100) if total_steps > 0 else 0
        # serializer.validated_data['completion_percentage'] = percentage
        # --- Slutt eksempel ---

        serializer.save()

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        assignment_id = self.request.query_params.get('assignment_id')
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SalesOpportunityViewSet(viewsets.ModelViewSet):
    """ API endpoint som tillater salgsmuligheter å bli sett eller redigert."""
    queryset = SalesOpportunity.objects.all().order_by('-created_at')
    serializer_class = SalesOpportunitySerializer
    permission_classes = [permissions.IsAuthenticated] # Juster tilgang, f.eks. kun for admin/selgere?

    # Her kan man legge til filtrering, f.eks. basert på status eller selger
    # filter_backends = [DjangoFilterBackend]
    # filterset_fields = ['status', 'customer']

class QuoteViewSet(viewsets.ModelViewSet):
    """ API endpoint for tilbud. """
    queryset = Quote.objects.all().prefetch_related(
        'line_items__elevator_type', 
        'opportunity__customer', 
        'order'
    ).order_by('-issue_date')
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated] # Bør justeres (f.eks. admin/selger)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'opportunity', 'opportunity__customer']
    search_fields = ['quote_number', 'opportunity__name', 'opportunity__customer__name']

    def perform_create(self, serializer):
        quote = serializer.save() 
        quote.quote_number = f"QT-{quote.id:05d}" 
        quote.save()

    @action(detail=True, methods=['post'], url_path='create-order')
    @transaction.atomic
    def create_order(self, request, pk=None):
        quote = self.get_object()

        if quote.status != 'accepted':
            return Response({'detail': 'Kan kun opprette ordre fra et akseptert tilbud.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if hasattr(quote, 'order') and quote.order is not None:
             return Response({'detail': 'Det finnes allerede en ordre for dette tilbudet.'}, status=status.HTTP_400_BAD_REQUEST)

        new_order = Order.objects.create(
            quote=quote,
            customer=quote.opportunity.customer,
            order_date=timezone.localdate(),
            total_amount=quote.total_amount,
        )

        order_lines = []
        for quote_line in quote.line_items.all():
            if quote_line.elevator_type:
                order_lines.append(OrderLineItem(
                    order=new_order,
                    elevator_type=quote_line.elevator_type,
                    quantity=quote_line.quantity,
                    unit_price_at_order=quote_line.elevator_type.price or 0 
                ))
        
        if order_lines:
            OrderLineItem.objects.bulk_create(order_lines)
            calculated_total = sum(line.quantity * line.unit_price_at_order for line in order_lines)
            if new_order.total_amount != calculated_total:
                 print(f"Recalculating order total for order {new_order.id}. Initial: {new_order.total_amount}, Calculated: {calculated_total}")
                 new_order.total_amount = calculated_total
                 new_order.save()

        serializer = OrderSerializer(new_order, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class QuoteLineItemViewSet(viewsets.ModelViewSet):
    """ API endpoint for tilbudslinjer. """
    queryset = QuoteLineItem.objects.all().select_related('elevator_type')
    serializer_class = QuoteLineItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['quote']

    def create(self, request, *args, **kwargs):
        print("DEBUG: QuoteLineItemViewSet create method CALLED")
        print("DEBUG: Request data:", request.data)
        # Bare for testing, IKKE bruk i produksjon uten validering:
        # serializer = self.get_serializer(data=request.data)
        # serializer.is_valid(raise_exception=True)
        # self.perform_create(serializer)
        # headers = self.get_success_headers(serializer.data)
        # return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        return Response({"message": "Test create called successfully"}, status=status.HTTP_201_CREATED)

class QuotePDFView(View):
    """ Genererer en PDF-versjon av et spesifikt tilbud. """
    
    # Beholder link_callback for evt. andre bilder i templaten,
    # men den brukes ikke for hovedlogoen lenger.
    def link_callback(self, uri, rel):
        # ... (eksisterende link_callback logikk forblir her) ...
        # Denne kan potensielt forenkles senere hvis den ikke trengs
        # for annet enn logoen.
        # Standard fallback:
        print(f"link_callback called for: {uri}")
        return uri

    def get(self, request, *args, **kwargs):
        quote_id = kwargs.get('quote_id')
        quote = get_object_or_404(Quote.objects.select_related(
            'opportunity__customer'
        ).prefetch_related(
            'line_items__elevator_type'
        ), pk=quote_id)

        template_path = 'quote_pdf_template.html'
        template = get_template(template_path)
        
        serializer_context = {'request': request}
        quote_serializer = QuoteSerializer(quote, context=serializer_context)
        quote_data = quote_serializer.data
        
        # --- Ny, direkte måte å finne logo-sti --- 
        logo_relative_path = 'images/logo.png' 
        logo_abs_path = None
        # Søk i STATICFILES_DIRS definert i settings.py
        for static_dir in getattr(settings, 'STATICFILES_DIRS', []):
            potential_path = os.path.join(static_dir, logo_relative_path)
            if os.path.isfile(potential_path):
                logo_abs_path = potential_path
                break # Fant logoen, trenger ikke lete mer
        
        if not logo_abs_path:
            # Fallback hvis STATICFILES_DIRS ikke er satt opp riktig 
            # eller logoen ligger i en app sin static-mappe.
            # Prøv å bygge stien relativt til BASE_DIR hvis mulig.
            # Dette er en antagelse og må kanskje justeres basert på din struktur.
            potential_path_basedir = os.path.join(settings.BASE_DIR, 'heis_api', 'static', logo_relative_path) 
            if os.path.isfile(potential_path_basedir):
                 logo_abs_path = potential_path_basedir
            else:
                 print(f"Warning: Could not find logo at '{logo_relative_path}' in STATICFILES_DIRS or common locations.")
        # --- Slutt ny logikk --- 

        context = {
            'quote': quote,
            'line_items': quote_data['line_items'],
            'total_amount': quote_data['total_amount'],
            'logo_path': logo_abs_path # Send med den absolutte stien vi fant
        }
        
        html = template.render(context)
        
        result = BytesIO()
        # Sender fortsatt med link_callback i tilfelle andre bilder
        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result, link_callback=self.link_callback)
        
        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            filename = f"Tilbud_{quote.quote_number or quote.id}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        print(f"Error generating PDF for quote {quote_id}: {pdf.err}")
        return HttpResponse("Feil ved generering av PDF.", status=500)

class OrderViewSet(viewsets.ModelViewSet):
    """ API endpoint for Ordrer. """
    queryset = Order.objects.all().select_related(
        'customer', 'quote'
    ).prefetch_related(
        'line_items__elevator_type' # For å vise detaljer i listen/detaljvisning
    ).order_by('-order_date')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated] # Juster tilgang etter behov
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'status': ['exact', 'in'], 
        'customer': ['exact'],
        'order_date': ['gte', 'lte', 'exact']
    }
    search_fields = ['id', 'customer__name', 'quote__quote_number']

    # Tillater ikke direkte oppretting av ordre via POST til /orders/
    # Ordre skal opprettes via 'create-order' action på QuoteViewSet.
    http_method_names = ['get', 'put', 'patch', 'delete', 'head', 'options'] # Fjerner 'post'

    # TODO: Implementer logikk for å oppdatere total_amount hvis ordrelinjer endres/slettes


class OrderLineItemViewSet(viewsets.ModelViewSet):
    """ API endpoint for Ordrelinjer. """
    queryset = OrderLineItem.objects.all().select_related('elevator_type')
    serializer_class = OrderLineItemSerializer
    permission_classes = [permissions.IsAuthenticated] # Juster tilgang
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order']

    # TODO: Logikk for å oppdatere Order.total_amount ved CUD

# ViewSet for Fravær (kun admin har full tilgang)
class AbsenceViewSet(viewsets.ModelViewSet):
    """ API endpoint for å administrere fravær. """
    queryset = Absence.objects.all().select_related('user').order_by('-start_date')
    serializer_class = AbsenceSerializer
    # Kun admin kan opprette/endre/slette, andre kan kanskje lese?
    permission_classes = [IsAdminOrReadOnly] 
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'user': ['exact'], 
        'absence_type': ['exact', 'in'], 
        'start_date': ['gte', 'lte', 'exact'],
        'end_date': ['gte', 'lte', 'exact']
    }

    # Kan legge til logikk her for å f.eks. validere datoer, 
    # eller automatisk sette 'registered_by' hvis det feltet legges til.
    # def perform_create(self, serializer):
    #     serializer.save(registered_by=self.request.user)

# ViewSet for Prosjektsammendrag (Read Only)
class ProjectSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """ Viser et sammendrag av salgsmuligheter med relatert status. """
    serializer_class = ProjectSummarySerializer
    permission_classes = [permissions.IsAuthenticated] # Admin/Selger?
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    # Filtrering/Søk kan legges til her om ønskelig
    filterset_fields = {
        'status': ['exact', 'in'], 
        'customer': ['exact'], 
        # Kan filtrere på annoterte felt også, men krever litt mer
        # 'last_quote_status': ['exact'],
        # 'order_status': ['exact', 'isnull'],
    }
    search_fields = ['name', 'customer__name']

    def get_queryset(self):
        # Subquery for å hente status for det siste (nyeste) tilbudet
        latest_quote_sq = Quote.objects.filter(
            opportunity=OuterRef('pk')
        ).order_by('-created_at') # Sorter på opprettet dato

        # Subquery for å hente status og ID for ordren (OneToOne-relasjon)
        order_sq = Order.objects.filter(
            quote__opportunity=OuterRef('pk') # Kobler via Quote til Opportunity
        )

        queryset = SalesOpportunity.objects.select_related('customer').annotate(
            # Henter status for siste tilbud, setter '-' hvis ingen tilbud finnes
            last_quote_status=Coalesce(
                Subquery(latest_quote_sq.values('status')[:1]),
                Value('-', output_field=CharField())
            ),
             # Henter ID for ordren, setter None hvis ingen ordre finnes
             order_id=Subquery(order_sq.values('id')[:1]),
             # Henter status for ordren, setter '-' hvis ingen ordre finnes
             order_status=Coalesce(
                 Subquery(order_sq.values('status')[:1]),
                 Value('-', output_field=CharField())
             ),
            # Henter display-navn for quote/order status
            # Må gjøres manuelt da vi ikke har objektet direkte
            last_quote_status_display=F('last_quote_status'), # Start med koden
            order_status_display=F('order_status'), # Start med koden

        ).order_by('-created_at')
        
        # Map display-verdier manuelt etter annotering
        # (Kan gjøres mer elegant med en custom manager eller i serializeren)
        quote_status_map = dict(Quote.STATUS_CHOICES)
        order_status_map = dict(Order.STATUS_CHOICES)
        
        # Går gjennom queryset for å sette display-verdier
        # Dette er litt ineffektivt, bør ideelt sett løses i DB/Serializer
        # for entry in queryset:
        #     entry.last_quote_status_display = quote_status_map.get(entry.last_quote_status, entry.last_quote_status)
        #     entry.order_status_display = order_status_map.get(entry.order_status, entry.order_status)
            
        return queryset

# Setup the router in urls.py