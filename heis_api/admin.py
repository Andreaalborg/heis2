from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Customer, Elevator, Assignment, ElevatorType, Part, AssignmentPart, AssignmentNote

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone_number', 'date_of_birth')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Files', {'fields': ('profile_picture', 'driver_license', 'other_certificate')}),
    )

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person_name', 'email', 'phone', 'city')
    search_fields = ('name', 'contact_person', 'email', 'city')
    list_filter = ('city',)
    raw_id_fields = ('contact_person_user',)

@admin.register(ElevatorType)
class ElevatorTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Elevator)
class ElevatorAdmin(admin.ModelAdmin):
    list_display = ('serial_number', 'customer', 'elevator_type', 'installation_date', 'last_inspection_date', 'next_inspection_date')
    search_fields = ('serial_number', 'customer__name', 'location_description')
    list_filter = ('elevator_type', 'customer__city')
    date_hierarchy = 'installation_date'
    raw_id_fields = ('customer', 'elevator_type')
    readonly_fields = ('service_manual_url', 'certification_url')

    def service_manual_url(self, obj):
        if obj.service_manual:
            return obj.service_manual.url
        return "-"
    service_manual_url.short_description = 'Service Manual URL'

    def certification_url(self, obj):
        if obj.certification:
            return obj.certification.url
        return "-"
    certification_url.short_description = 'Certification URL'

class AssignmentPartInline(admin.TabularInline):
    model = AssignmentPart
    raw_id_fields = ('part',)
    extra = 1

class AssignmentNoteInline(admin.TabularInline):
    model = AssignmentNote
    raw_id_fields = ('user',)
    readonly_fields = ('created_at', 'user')
    extra = 1

    def has_change_permission(self, request, obj=None):
        return False # Notater skal ikke endres fra admin
    
    def has_delete_permission(self, request, obj=None):
        return False # Notater skal ikke slettes fra admin

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'elevator', 'customer', 'assigned_to', 'status', 'assignment_type', 'scheduled_date', 'created_at')
    search_fields = ('title', 'description', 'elevator__serial_number', 'customer__name', 'assigned_to__username')
    list_filter = ('status', 'assignment_type', 'assigned_to', 'customer__city')
    date_hierarchy = 'created_at'
    raw_id_fields = ('elevator', 'customer', 'assigned_to')
    inlines = [AssignmentNoteInline, AssignmentPartInline]

@admin.register(Part)
class PartAdmin(admin.ModelAdmin):
    list_display = ('part_number', 'name', 'price', 'stock_quantity')
    search_fields = ('name', 'part_number', 'description')
    list_filter = ()

@admin.register(AssignmentPart)
class AssignmentPartAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'part', 'quantity')
    search_fields = ('assignment__title', 'part__name', 'part__part_number')
    raw_id_fields = ('assignment', 'part')

@admin.register(AssignmentNote)
class AssignmentNoteAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'user', 'created_at')
    search_fields = ('assignment__title', 'user__username', 'content')
    list_filter = ('user',)
    date_hierarchy = 'created_at'
    raw_id_fields = ('assignment', 'user')
    readonly_fields = ('created_at', 'user')
