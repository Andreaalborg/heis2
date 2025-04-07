from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    UserViewSet, CustomerViewSet, ElevatorTypeViewSet, ElevatorViewSet, 
    AssignmentViewSet, PartViewSet, AssignmentPartViewSet, 
    AssignmentNoteViewSet, AssignmentChecklistViewSet, ReportViewSet,
    SalesOpportunityViewSet
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

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('assignments/<int:assignment_pk>/checklist/', AssignmentChecklistViewSet.as_view(), name='assignment-checklist-detail'),
]