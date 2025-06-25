from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    UserViewSet, CustomerViewSet, ElevatorTypeViewSet, ElevatorViewSet, 
    AssignmentViewSet, PartViewSet, AssignmentPartViewSet, 
    AssignmentNoteViewSet, AssignmentChecklistViewSet, ReportViewSet,
    SalesOpportunityViewSet, QuoteViewSet, QuoteLineItemViewSet,
    QuotePDFView, OrderViewSet, OrderLineItemViewSet,
    AbsenceViewSet,
    ProjectSummaryViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'elevator-types', ElevatorTypeViewSet)
router.register(r'elevators', ElevatorViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'parts', PartViewSet)
router.register(r'assignment-parts', AssignmentPartViewSet)
router.register(r'assignment-notes', AssignmentNoteViewSet)
router.register(r'reports', ReportViewSet)
router.register(r'sales-opportunities', SalesOpportunityViewSet)
router.register(r'quotes', QuoteViewSet)
router.register(r'quote-line-items', QuoteLineItemViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-line-items', OrderLineItemViewSet)
router.register(r'absences', AbsenceViewSet)
router.register(r'project-summary', ProjectSummaryViewSet, basename='project-summary')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
    # Fjernet api-token-auth herfra siden den er definert i heis_backend/urls.py
    path('assignments/<int:assignment_pk>/checklist/', AssignmentChecklistViewSet.as_view(), name='assignment-checklist-detail'),
    path('quotes/<int:quote_id>/pdf/', QuotePDFView.as_view(), name='quote-pdf'),
]