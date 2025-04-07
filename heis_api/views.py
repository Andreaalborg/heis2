from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import User, Customer, ElevatorType, Elevator, Assignment, AssignmentNote, Part, AssignmentPart, AssignmentChecklist, Report, SalesOpportunity
from .serializers import (
    UserSerializer, CustomerSerializer, CustomerDetailSerializer,
    ElevatorTypeSerializer, ElevatorSerializer, ElevatorDetailSerializer,
    PartSerializer, AssignmentPartSerializer, AssignmentNoteSerializer,
    AssignmentSerializer, AssignmentDetailSerializer, AssignmentChecklistSerializer,
    ReportSerializer, SalesOpportunitySerializer
)
import os
from django.conf import settings
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import RetrieveUpdateAPIView

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'admin'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
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
    filterset_fields = ['status', 'assignment_type', 'assigned_to', 'customer']
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


# Setup the router in urls.py