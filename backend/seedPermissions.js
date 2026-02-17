const Permission = require('../models/Permission');
const Role = require('../models/Role');

const seedPermissions = async () => {
  const permissions = [
    // Leave Management
    { name: 'APPLY_LEAVE', resource: 'leaves', action: 'create', category: 'Leave Management', description: 'Apply for leave' },
    { name: 'VIEW_OWN_LEAVES', resource: 'leaves', action: 'read_own', category: 'Leave Management', description: 'View own leave requests' },
    { name: 'VIEW_ALL_LEAVES', resource: 'leaves', action: 'read_all', category: 'Leave Management', description: 'View all leave requests' },
    { name: 'APPROVE_LEAVES', resource: 'leaves', action: 'approve', category: 'Leave Management', description: 'Approve leave requests' },
    { name: 'REJECT_LEAVES', resource: 'leaves', action: 'reject', category: 'Leave Management', description: 'Reject leave requests' },
    { name: 'CANCEL_LEAVES', resource: 'leaves', action: 'cancel', category: 'Leave Management', description: 'Cancel leave requests' },
    
    // User Management
    { name: 'CREATE_USERS', resource: 'users', action: 'create', category: 'User Management', description: 'Create new users' },
    { name: 'VIEW_USERS', resource: 'users', action: 'read', category: 'User Management', description: 'View user profiles' },
    { name: 'UPDATE_USERS', resource: 'users', action: 'update', category: 'User Management', description: 'Update user profiles' },
    { name: 'DELETE_USERS', resource: 'users', action: 'delete', category: 'User Management', description: 'Delete users' },
    { name: 'ASSIGN_ROLES', resource: 'users', action: 'assign_role', category: 'User Management', description: 'Assign roles to users' },
    
    // Reports & Analytics
    { name: 'VIEW_REPORTS', resource: 'reports', action: 'read', category: 'Reports', description: 'View reports and analytics' },
    { name: 'EXPORT_REPORTS', resource: 'reports', action: 'export', category: 'Reports', description: 'Export reports' },
    { name: 'VIEW_DASHBOARD', resource: 'dashboard', action: 'read', category: 'Reports', description: 'View dashboard' },
    
    // Leave Types
    { name: 'MANAGE_LEAVE_TYPES', resource: 'leave_types', action: 'manage', category: 'Configuration', description: 'Manage leave types' },
    
    // Attendance
    { name: 'VIEW_OWN_ATTENDANCE', resource: 'attendance', action: 'read_own', category: 'Attendance', description: 'View own attendance' },
    { name: 'VIEW_ALL_ATTENDANCE', resource: 'attendance', action: 'read_all', category: 'Attendance', description: 'View all attendance records' },
    { name: 'MARK_ATTENDANCE', resource: 'attendance', action: 'create', category: 'Attendance', description: 'Mark attendance' },
    
    // Files & Documents
    { name: 'VIEW_FILES', resource: 'files', action: 'read', category: 'Files', description: 'View files and documents' },
    { name: 'UPLOAD_FILES', resource: 'files', action: 'create', category: 'Files', description: 'Upload files' },
    { name: 'DELETE_FILES', resource: 'files', action: 'delete', category: 'Files', description: 'Delete files' },
    
    // Announcements
    { name: 'VIEW_ANNOUNCEMENTS', resource: 'announcements', action: 'read', category: 'Communication', description: 'View announcements' },
    { name: 'CREATE_ANNOUNCEMENTS', resource: 'announcements', action: 'create', category: 'Communication', description: 'Create announcements' },
    { name: 'UPDATE_ANNOUNCEMENTS', resource: 'announcements', action: 'update', category: 'Communication', description: 'Update announcements' },
    { name: 'DELETE_ANNOUNCEMENTS', resource: 'announcements', action: 'delete', category: 'Communication', description: 'Delete announcements' }
  ];

  for (const perm of permissions) {
    await Permission.findOneAndUpdate(
      { name: perm.name },
      perm,
      { upsert: true, new: true }
    );
  }

  // console.log('Permissions seeded successfully');
};

const seedRoles = async () => {
  const allPermissions = await Permission.find();
  
  const roles = [
    {
      name: 'SUPER_ADMIN',
      displayName: 'Super Admin',
      description: 'Full system access',
      permissions: allPermissions.map(p => p._id),
      isSystem: true,
      color: '#dc2626'
    },
    {
      name: 'HR_MANAGER',
      displayName: 'HR Manager',
      description: 'HR management with full leave and user access',
      permissions: allPermissions.filter(p => 
        !['DELETE_USERS', 'ASSIGN_ROLES'].includes(p.name)
      ).map(p => p._id),
      isSystem: true,
      color: '#059669'
    },
    {
      name: 'TEAM_MANAGER',
      displayName: 'Team Manager',
      description: 'Team management with approval rights',
      permissions: allPermissions.filter(p => 
        ['APPROVE_LEAVES', 'REJECT_LEAVES', 'VIEW_ALL_LEAVES', 'VIEW_USERS', 
         'VIEW_REPORTS', 'VIEW_DASHBOARD', 'VIEW_ALL_ATTENDANCE', 'VIEW_ANNOUNCEMENTS'].includes(p.name)
      ).map(p => p._id),
      isSystem: true,
      color: '#2563eb'
    },
    {
      name: 'EMPLOYEE',
      displayName: 'Employee',
      description: 'Basic employee access',
      permissions: allPermissions.filter(p => 
        ['APPLY_LEAVE', 'VIEW_OWN_LEAVES', 'CANCEL_LEAVES', 'VIEW_OWN_ATTENDANCE', 
         'MARK_ATTENDANCE', 'VIEW_FILES', 'VIEW_ANNOUNCEMENTS', 'VIEW_DASHBOARD'].includes(p.name)
      ).map(p => p._id),
      isSystem: true,
      color: '#6366f1'
    }
  ];

  for (const role of roles) {
    await Role.findOneAndUpdate(
      { name: role.name },
      role,
      { upsert: true, new: true }
    );
  }

  // console.log('Roles seeded successfully');
};

const seedPermissionsAndRoles = async () => {
  try {
    await seedPermissions();
    await seedRoles();
    // console.log('All permissions and roles seeded successfully');
  } catch (error) {
    console.error('Error seeding permissions and roles:', error);
  }
};

module.exports = { seedPermissionsAndRoles };