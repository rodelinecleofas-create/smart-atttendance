export const ATTENDANCE_STATUSES = [
  { id: 'present', label: 'Present', color: 'bg-green-100 text-green-800' },
  { id: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800' },
  { id: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'excused', label: 'Excused', color: 'bg-blue-100 text-blue-800' },
  { id: 'sick', label: 'Sick', color: 'bg-purple-100 text-purple-800' },
  { id: 'permission', label: 'Permission', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'leave', label: 'Leave', color: 'bg-orange-100 text-orange-800' },
];

export const DEFAULT_STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
  sick: 'Sick',
  permission: 'Permission',
  leave: 'Leave',
};

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student',
};

export const ROLE_PERMISSIONS = {
  admin: ['view_all', 'create_user', 'delete_user', 'manage_settings', 'view_reports', 'manage_roster', 'manage_attendance'],
  teacher: ['manage_attendance', 'view_reports', 'view_class_data', 'export_data'],
  parent: ['view_child_attendance', 'view_child_profile'],
  student: ['view_own_attendance', 'view_own_profile'],
};

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function getStatusColor(status) {
  const statusObj = ATTENDANCE_STATUSES.find((s) => s.id === status);
  return statusObj?.color || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status) {
  const statusObj = ATTENDANCE_STATUSES.find((s) => s.id === status);
  return statusObj?.label || status;
}
