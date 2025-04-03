from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    UserViewSet, CustomerViewSet, ElevatorViewSet, 
    AssignmentViewSet, ElevatorTypeViewSet, AssignmentNoteViewSet,
    AssignmentPartViewSet, PartViewSet, AssignmentChecklistViewSet,
    ReportViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'elevators', ElevatorViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'elevator-types', ElevatorTypeViewSet)
router.register(r'assignment-notes', AssignmentNoteViewSet)
router.register(r'assignment-parts', AssignmentPartViewSet)
router.register(r'parts', PartViewSet)
router.register(r'reports', ReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path(
        'assignments/<int:assignment_pk>/checklist/', 
        AssignmentChecklistViewSet.as_view(), 
        name='assignment-checklist'
    ),
]