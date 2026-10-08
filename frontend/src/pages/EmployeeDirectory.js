import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Badge, Button, Modal, Table, Dropdown } from 'react-bootstrap';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './EmployeeDirectory.css';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]); // Store all employees for stats
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ search: '', department: '', role: '' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeProfileTab, setActiveProfileTab] = useState('overview'); // 'overview' | 'personal' | 'work' | 'bank' | 'exit'
  const [activeEditTab, setActiveEditTab] = useState('personal'); // 'personal' | 'address' | 'work' | 'emergency' | 'bank'
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editableProfile, setEditableProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'EMPLOYEE',
    department: '',
    designation: '',
    joinDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/departments?limit=1000');
      setDepartments(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/employee-management/all?status=${statusFilter}`);
      setEmployees(response.data || []);
      
      if (allEmployees.length === 0 || statusFilter === 'all') {
        const allResponse = await api.get('/api/employee-management/all?status=all');
        setAllEmployees(allResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to load employees list' });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (employeeOrId) => {
    try {
      setSelectedEmployee(null);
      setShowProfilePage(true);
      setProfileLoading(true);
      setActiveProfileTab('overview');
      
      let id = employeeOrId._id || employeeOrId;
      const response = await api.get(`/api/employees/profile/${id}`);
      const profile = response.data;
      
      // Fetch full user details including exitDetails
      const userResponse = await api.get(`/api/users/${profile.userId._id || profile.userId}`);
      profile.userId = userResponse.data;
      
      setSelectedEmployee(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to load profile details' });
      setShowProfilePage(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCloseProfilePage = () => {
    setShowProfilePage(false);
    setSelectedEmployee(null);
  };

  const handleEditProfile = () => {
    setEditableProfile(JSON.parse(JSON.stringify(selectedEmployee)));
    setActiveEditTab('personal');
    setShowEditModal(true);
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${label} copied to clipboard!`,
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true
    });
  };

  const handleSaveProfile = async () => {
    const result = await Swal.fire({
      title: 'Save Profile Changes?',
      text: 'Are you sure you want to update this employee profile?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, save changes'
    });

    if (!result.isConfirmed) return;
    if (!selectedEmployee || !editableProfile) return;
    
    const userId = selectedEmployee.userId._id || selectedEmployee.userId;
    try {
      const userPayload = {
        firstName: editableProfile.userId?.firstName,
        lastName: editableProfile.userId?.lastName,
        email: editableProfile.userId?.email,
        department: editableProfile.workInfo?.department || editableProfile.professionalInfo?.department || editableProfile.userId?.department,
        designation: editableProfile.workInfo?.designation || editableProfile.professionalInfo?.designation || editableProfile.userId?.designation,
        joinDate: editableProfile.userId?.joinDate || null,
        dateOfBirth: editableProfile.userId?.dateOfBirth || null
      };
      await api.put(`/api/users/${userId}`, userPayload);

      const payload = {
        employeeId: editableProfile.employeeId,
        personalInfo: editableProfile.personalInfo || {},
        professionalInfo: {
          ...editableProfile.professionalInfo,
          employeeId: editableProfile.employeeId,
          workLocation: editableProfile.location || editableProfile.professionalInfo?.workLocation
        },
        bankDetails: editableProfile.bankDetails || {},
        workInfo: {
          ...editableProfile.workInfo,
          workLocation: editableProfile.location || editableProfile.workInfo?.workLocation
        }
      };
      await api.put(`/api/employees/profile/${userId}`, payload);

      const refreshResponse = await api.get(`/api/employees/profile/${userId}`);
      const refreshedProfile = refreshResponse.data;
      
      setSelectedEmployee(refreshedProfile);
      setEditableProfile(refreshedProfile);
      setEmployees(prev => prev.map(emp => (emp.userId?._id === userId ? { ...emp, userId: { ...emp.userId, ...userPayload }, ...userPayload } : emp)));
      setShowEditModal(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Employee profile updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save profile' });
    }
  };

  const handleConfirmDelete = async () => {
    setShowEditModal(false);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { value: formValues } = await Swal.fire({
      title: '<strong>Employee Exit Process</strong>',
      html: `
        <div style="text-align: left; padding: 0.5rem;">
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 0.875rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem; color: #92400e;">
            <strong>Important:</strong> Employee will be immediately logged out and system access will be revoked.
          </div>
          
          <div style="margin-bottom: 1.25rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b; font-size: 0.9rem;">Exit Reason<span style="color: #dc2626; margin-left: 2px;">*</span></label>
            <select id="exitReason" style="width: 100%; padding: 0.625rem 0.875rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem;">
              <option value="">-- Select Reason --</option>
              <option value="RESIGNATION">Resignation (Employee Choice)</option>
              <option value="TERMINATION">Termination (Company Decision)</option>
              <option value="RETIREMENT">Retirement</option>
              <option value="CONTRACT_END">Contract Ended</option>
              <option value="MUTUAL_AGREEMENT">Mutual Agreement</option>
              <option value="RELOCATION">Relocation</option>
              <option value="HEALTH_REASONS">Health Reasons</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          
          <div style="margin-bottom: 1.25rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b; font-size: 0.9rem;">Last Working Day<span style="color: #dc2626; margin-left: 2px;">*</span></label>
            <input id="exitDate" type="date" style="width: 100%; padding: 0.625rem 0.875rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem;" value="${new Date().toISOString().split('T')[0]}">
          </div>
          
          <div style="margin-bottom: 1.25rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b; font-size: 0.9rem;">Exit Interview Completed?</label>
            <select id="exitInterview" style="width: 100%; padding: 0.625rem 0.875rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem;">
              <option value="NO">No</option>
              <option value="YES">Yes</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="NOT_REQUIRED">Not Required</option>
            </select>
          </div>
          
          <div style="margin-bottom: 1.25rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b; font-size: 0.9rem;">Handover Status</label>
            <select id="handoverStatus" style="width: 100%; padding: 0.625rem 0.875rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem;">
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="NOT_APPLICABLE">Not Applicable</option>
            </select>
          </div>
          
          <div style="margin-bottom: 1.25rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b; font-size: 0.9rem;">Additional Notes</label>
            <textarea id="exitNotes" style="width: 100%; padding: 0.625rem 0.875rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; resize: vertical;" rows="3" placeholder="Enter any additional details..."></textarea>
          </div>
        </div>
      `,
      width: '560px',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-user-slash me-1"></i> Deactivate Employee',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const exitReason = document.getElementById('exitReason').value;
        const exitDate = document.getElementById('exitDate').value;
        const exitInterview = document.getElementById('exitInterview').value;
        const handoverStatus = document.getElementById('handoverStatus').value;
        const exitNotes = document.getElementById('exitNotes').value;
        
        if (!exitReason) {
          Swal.showValidationMessage('⚠️ Please select an exit reason');
          return false;
        }
        if (!exitDate) {
          Swal.showValidationMessage('⚠️ Please select last working day');
          return false;
        }
        return { exitReason, exitDate, exitInterview, handoverStatus, exitNotes };
      }
    });

    if (!formValues || !selectedEmployee) return;
    const userId = selectedEmployee.userId?._id || selectedEmployee._id;
    
    try {
      await api.put(`/api/employee-management/${userId}/deactivate`, formValues);
      
      await Swal.fire({
        icon: 'success',
        title: 'Employee Deactivated',
        html: `<strong>${selectedEmployee.userId?.firstName} ${selectedEmployee.userId?.lastName}</strong> has been deactivated successfully.`,
        confirmButtonText: 'Done',
        confirmButtonColor: '#10b981'
      });
      
      await fetchEmployees();
      
      // Refresh profile view
      const refreshResponse = await api.get(`/api/employees/profile/${userId}`);
      const userResponse = await api.get(`/api/users/${userId}`);
      refreshResponse.data.userId = userResponse.data;
      setSelectedEmployee(refreshResponse.data);
    } catch (err) {
      console.error('Deactivate failed', err);
      Swal.fire({
        icon: 'error',
        title: 'Deactivation Failed',
        text: err.response?.data?.message || 'Failed to deactivate employee',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleToggleFieldEmployee = async (empId, currentValue) => {
    try {
      await api.put(`/api/employee-management/${empId}/toggle-field-employee`);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `GPS Field Tracking ${!currentValue ? 'enabled' : 'disabled'}`,
        showConfirmButton: false,
        timer: 2000
      });
      fetchEmployees();
      if (selectedEmployee) {
        const uid = selectedEmployee.userId?._id || selectedEmployee.userId;
        const res = await api.get(`/api/employees/profile/${uid}`);
        const userRes = await api.get(`/api/users/${uid}`);
        res.data.userId = userRes.data;
        setSelectedEmployee(res.data);
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update field employee status' });
    }
  };

  const handleReactivate = async (userId) => {
    const result = await Swal.fire({
      title: 'Reactivate Employee?',
      text: 'This will restore full system access and active status for this employee.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, reactivate'
    });

    if (!result.isConfirmed) return;

    try {
      const id = userId || selectedEmployee.userId?._id || selectedEmployee._id;
      await api.put(`/api/employee-management/${id}/reactivate`);
      
      await Swal.fire({
        icon: 'success',
        title: 'Employee Reactivated',
        text: 'Employee has been reactivated successfully.',
        confirmButtonColor: '#10b981'
      });
      
      await fetchEmployees();
      if (selectedEmployee) {
        const res = await api.get(`/api/employees/profile/${id}`);
        const userRes = await api.get(`/api/users/${id}`);
        res.data.userId = userRes.data;
        setSelectedEmployee(res.data);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Reactivation Failed',
        text: error.response?.data?.message || 'Failed to reactivate employee',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeletePermanently = async () => {
    const result = await Swal.fire({
      title: 'Delete Employee Permanently?',
      html: '<strong style="color: #dc2626;">WARNING: This action cannot be undone!</strong><br/>All employee records, history, and user data will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete permanently'
    });

    if (!result.isConfirmed) return;

    try {
      const userId = selectedEmployee.userId?._id || selectedEmployee._id;
      await api.delete(`/api/employee-management/${userId}`);
      
      await Swal.fire({
        icon: 'success',
        title: 'Employee Deleted',
        text: 'Employee has been permanently deleted from the system.',
        confirmButtonColor: '#10b981'
      });
      
      handleCloseProfilePage();
      await fetchEmployees();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Deletion Failed',
        text: error.response?.data?.message || 'Failed to delete employee',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleResetPassword = async () => {
    const { value: newPassword } = await Swal.fire({
      title: 'Reset Login Password',
      html: `
        <div style="text-align: left; padding: 0.5rem;">
          <p>Set a new password for <strong>${selectedEmployee.userId?.firstName} ${selectedEmployee.userId?.lastName}</strong></p>
          <input id="newPassword" type="text" class="swal2-input" placeholder="Enter new password" style="width: 90%; margin: 0.5rem auto;">
          <p style="color: #64748b; font-size: 0.85rem; margin-top: 0.5rem;">ℹ️ Password must be at least 6 characters long</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Reset Password',
      preConfirm: () => {
        const password = document.getElementById('newPassword').value;
        if (!password) {
          Swal.showValidationMessage('Please enter a new password');
        } else if (password.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters');
        }
        return password;
      }
    });

    if (!newPassword) return;

    try {
      const userId = selectedEmployee.userId?._id || selectedEmployee._id;
      await api.put(`/api/users/${userId}/reset-password`, { newPassword });
      
      await Swal.fire({
        icon: 'success',
        title: 'Password Reset Success 🔐',
        html: `
          <div style="text-align: left; padding: 0.5rem;">
            <p><strong>New Credentials:</strong></p>
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin: 0.5rem 0;">
              <p style="margin: 0.3rem 0;"><strong>Email:</strong> ${selectedEmployee.userId?.email}</p>
              <p style="margin: 0.3rem 0;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold;">${newPassword}</code></p>
            </div>
            <p style="color: #2563eb; font-size: 0.85rem;">Share these credentials securely with the employee.</p>
          </div>
        `,
        confirmButtonText: 'Done',
        confirmButtonColor: '#10b981'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Reset Failed',
        text: error.response?.data?.message || 'Failed to reset password',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleChangeRole = async () => {
    const currentRole = selectedEmployee.userId?.role;
    
    const { value: newRole } = await Swal.fire({
      title: 'Change Access Role',
      html: `
        <div style="text-align: left; padding: 0.5rem;">
          <p style="margin-bottom: 0.75rem;">Change system role for <strong>${selectedEmployee.userId?.firstName} ${selectedEmployee.userId?.lastName}</strong></p>
          <p style="margin-bottom: 0.5rem; color: #64748b; font-size: 0.875rem;">Current Role: <strong>${currentRole}</strong></p>
          <select id="roleSelect" class="swal2-input" style="width: 90%; padding: 0.6rem;">
            <option value="EMPLOYEE" ${currentRole === 'EMPLOYEE' ? 'selected' : ''}>Employee - Standard User</option>
            <option value="MANAGER" ${currentRole === 'MANAGER' ? 'selected' : ''}>Manager - Team Leader</option>
            <option value="HR" ${currentRole === 'HR' ? 'selected' : ''}>HR - Human Resources</option>
            <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>Admin - Full Administrator</option>
          </select>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Update Role',
      preConfirm: () => {
        return document.getElementById('roleSelect').value;
      }
    });

    if (!newRole || newRole === currentRole) return;

    try {
      const userId = selectedEmployee.userId?._id || selectedEmployee._id;
      await api.put(`/api/users/${userId}/role`, { role: newRole });
      
      await Swal.fire({
        icon: 'success',
        title: 'Role Updated!',
        text: `Role changed from ${currentRole} to ${newRole}`,
        confirmButtonColor: '#10b981'
      });
      
      await fetchEmployees();
      const response = await api.get(`/api/employees/profile/${userId}`);
      const userResponse = await api.get(`/api/users/${userId}`);
      response.data.userId = userResponse.data;
      setSelectedEmployee(response.data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Role Change Failed',
        text: error.response?.data?.message || 'Failed to change role',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleResetWfhLocation = async () => {
    if (!selectedEmployee) return;
    const rawUserId = selectedEmployee.userId?._id || selectedEmployee.userId || selectedEmployee._id;
    const userId = typeof rawUserId === 'object' ? rawUserId?._id : rawUserId;

    if (!userId) {
      return Swal.fire({ icon: 'error', title: 'Error', text: 'Could not resolve target User ID' });
    }

    const result = await Swal.fire({
      title: 'Reset Remote/WFH Base Location?',
      html: `Resetting the Remote/WFH anchor for <strong>${selectedEmployee.userId?.firstName || selectedEmployee.firstName || ''} ${selectedEmployee.userId?.lastName || selectedEmployee.lastName || ''}</strong> will allow them to set a new base GPS location on their next Remote check-in.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Reset Location'
    });

    if (!result.isConfirmed) return;

    try {
      await api.put(`/api/users/${userId}/reset-wfh-location`);
      Swal.fire({
        icon: 'success',
        title: 'Location Reset Successfully 📍',
        text: 'The employee can now pin a new Remote/WFH location boundary.',
        confirmButtonColor: '#10b981'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Reset Failed',
        text: error.response?.data?.message || 'Failed to reset WFH location',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please fill all required fields' });
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        department: formData.department,
        designation: formData.designation,
        joinDate: formData.joinDate
      };
      
      const response = await api.post('/api/employee-management/create', payload);
      
      if (response.data.employee?.tempPassword) {
        await Swal.fire({
          icon: 'success',
          title: 'Employee Created Successfully! 🎉',
          html: `
            <div style="text-align: left; padding: 0.5rem;">
              <p><strong>Login Credentials:</strong></p>
              <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin: 0.5rem 0;">
                <p style="margin: 0.3rem 0;"><strong>Email:</strong> ${response.data.employee.email}</p>
                <p style="margin: 0.3rem 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold;">${response.data.employee.tempPassword}</code></p>
              </div>
              <p style="color: #dc2626; font-size: 0.85rem;">⚠️ Save this password now - it won't be shown again!</p>
            </div>
          `,
          confirmButtonText: 'Got it!',
          confirmButtonColor: '#10b981'
        });
      } else {
        Swal.fire({ icon: 'success', title: 'Success', text: response.data.message || 'Employee created successfully!', timer: 2000, showConfirmButton: false });
      }
      
      setShowAddModal(false);
      resetForm();
      await fetchEmployees();
    } catch (error) {
      console.error('Create employee error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error creating employee';
      Swal.fire({ icon: 'error', title: 'Error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'EMPLOYEE',
      department: '',
      designation: '',
      joinDate: new Date().toISOString().split('T')[0]
    });
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      ADMIN: 'badge-role-admin',
      HR: 'badge-role-hr',
      MANAGER: 'badge-role-manager',
      EMPLOYEE: 'badge-role-employee'
    };
    return classes[role] || 'badge-role-employee';
  };

  // Filter Employees
  const filteredEmployees = employees.filter(emp => {
    const searchLower = filters.search.toLowerCase().trim();
    const fullName = `${emp?.firstName || ''} ${emp?.lastName || ''}`.toLowerCase();
    const email = (emp?.email || emp?.userId?.email || '').toLowerCase();
    const empId = (emp?.employeeId || emp?.professionalInfo?.employeeId || '').toLowerCase();
    const designation = (emp?.designation || emp?.workInfo?.designation || '').toLowerCase();
    const phone = (emp?.personalInfo?.phone || '').toLowerCase();

    const matchesSearch = !searchLower || 
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      empId.includes(searchLower) ||
      designation.includes(searchLower) ||
      phone.includes(searchLower);

    const empDept = emp?.department || emp?.workInfo?.department || emp?.userId?.department;
    const matchesDept = !filters.department || empDept === filters.department;
    
    const empRole = emp?.role || emp?.userId?.role;
    const matchesRole = !filters.role || empRole === filters.role;

    return matchesSearch && matchesDept && matchesRole;
  });

  const statsList = allEmployees.length > 0 ? allEmployees : employees;
  const stats = {
    total: statsList.length,
    active: statsList.filter(e => (e?.isActive !== false && e?.userId?.isActive !== false)).length,
    inactive: statsList.filter(e => (e?.isActive === false || e?.userId?.isActive === false)).length,
    departments: Array.isArray(departments) && departments.length > 0 
      ? departments.length 
      : [...new Set(statsList.map(e => e?.department || e?.workInfo?.department || e?.userId?.department).filter(Boolean))].length
  };

  const exportToExcel = async () => {
    try {
      const detailedEmployees = await Promise.all(
        filteredEmployees.map(async (emp) => {
          try {
            const response = await api.get(`/api/employees/profile/${emp._id}`);
            const profile = response.data;
            return {
              'Employee ID': profile.employeeId || 'N/A',
              'First Name': emp.firstName,
              'Last Name': emp.lastName,
              'Email': emp.email,
              'Role': emp.role,
              'Department': emp.department || 'N/A',
              'Designation': emp.designation || 'N/A',
              'Join Date': emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A',
              'Date of Birth': emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString() : 'N/A',
              'Phone': profile.personalInfo?.phone || 'N/A',
              'Blood Group': profile.personalInfo?.bloodGroup || 'N/A',
              'Marital Status': profile.personalInfo?.maritalStatus || 'N/A',
              'Address': profile.personalInfo?.address ? `${profile.personalInfo.address.street || ''}, ${profile.personalInfo.address.city || ''}, ${profile.personalInfo.address.state || ''}, ${profile.personalInfo.address.zipCode || ''}`.trim() : 'N/A',
              'Emergency Contact Name': profile.personalInfo?.emergencyContact?.name || 'N/A',
              'Emergency Contact Phone': profile.personalInfo?.emergencyContact?.phone || 'N/A',
              'Work Location': profile.workInfo?.workLocation || profile.professionalInfo?.workLocation || 'N/A',
              'Employment Type': profile.professionalInfo?.employmentType || 'N/A',
              'Bank Name': profile.bankDetails?.bankName || 'N/A',
              'Account Number': profile.bankDetails?.accountNumber || 'N/A',
              'IFSC Code': profile.bankDetails?.ifscCode || 'N/A',
              'Status': emp.isActive ? 'Active' : 'Exited'
            };
          } catch (error) {
            return {
              'Employee ID': 'N/A',
              'First Name': emp.firstName,
              'Last Name': emp.lastName,
              'Email': emp.email,
              'Role': emp.role,
              'Department': emp.department || 'N/A',
              'Designation': emp.designation || 'N/A',
              'Join Date': emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A',
              'Status': emp.isActive ? 'Active' : 'Exited'
            };
          }
        })
      );
      
      const ws = window.XLSX?.utils.json_to_sheet(detailedEmployees);
      const wb = window.XLSX?.utils.book_new();
      window.XLSX?.utils.book_append_sheet(wb, ws, 'Employees');
      window.XLSX?.writeFile(wb, `Employee_Directory_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      Swal.fire({ icon: 'success', title: 'Export Complete 📊', text: 'Employee details exported to Excel file.', timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to export employee data' });
    }
  };

  // FULL PAGE EMPLOYEE PROFILE VIEW
  if (showProfilePage) {
    return (
      <div className="employee-directory-v2 full-profile-page-container">
        {/* Top Navigation Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button 
            variant="light" 
            className="btn-back-directory shadow-sm"
            onClick={handleCloseProfilePage}
          >
            <i className="fas fa-arrow-left me-2"></i> Back to Employee Directory
          </Button>

          {['HR', 'ADMIN'].includes(user?.role) && selectedEmployee && (
            <div className="d-flex gap-2">
              <Button variant="primary" size="sm" onClick={handleEditProfile} className="px-3">
                <i className="fas fa-pen me-1"></i> Edit Profile
              </Button>
              {selectedEmployee?.userId?.isActive !== false ? (
                <Button variant="outline-danger" size="sm" onClick={handleConfirmDelete}>
                  <i className="fas fa-user-slash me-1"></i> Deactivate
                </Button>
              ) : (
                <Button variant="outline-success" size="sm" onClick={() => handleReactivate(selectedEmployee?.userId?._id)}>
                  <i className="fas fa-user-check me-1"></i> Reactivate
                </Button>
              )}
            </div>
          )}
        </div>

        {profileLoading ? (
          <div className="loading-container bg-white p-5 rounded-4 shadow-sm">
            <div className="spinner-border text-emerald"></div>
            <p className="mt-3">Loading employee profile details...</p>
          </div>
        ) : selectedEmployee ? (
          <div className="full-profile-content-card">
            {/* Hero Cover Banner */}
            <div className="profile-modal-banner rounded-4">
              <div className="profile-banner-bg-glow"></div>
              
              <div className="profile-modal-avatar-lg">
                {selectedEmployee.userId?.profileImage ? (
                  <img src={selectedEmployee.userId.profileImage} alt="Profile" />
                ) : (
                  <div className="initials-lg">
                    {selectedEmployee.userId?.firstName?.charAt(0)}{selectedEmployee.userId?.lastName?.charAt(0)}
                  </div>
                )}
              </div>

              <div className="profile-banner-info">
                <h2>{selectedEmployee.userId?.firstName} {selectedEmployee.userId?.lastName}</h2>
                <div className="banner-title">
                  {selectedEmployee.workInfo?.designation || selectedEmployee.professionalInfo?.designation || 'No Position Specified'} • {selectedEmployee.userId?.department || 'Unassigned Department'}
                </div>
                <div className="profile-banner-badges">
                  <span className={`card-role-badge ${getRoleBadgeClass(selectedEmployee.userId?.role)}`}>
                    {selectedEmployee.userId?.role}
                  </span>
                  <span className={`status-tag ${(selectedEmployee.userId?.isActive !== false) ? 'active' : 'exited'}`}>
                    {(selectedEmployee.userId?.isActive !== false) ? 'Active Employee' : 'Exited / Offboarded'}
                  </span>
                  {selectedEmployee.userId?.isFieldEmployee && (
                    <span className="field-tag">
                      <i className="fas fa-route me-1"></i> Field Personnel
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="modal-tabs-nav mt-3 bg-white rounded-3 border">
              <button 
                className={`modal-tab-item ${activeProfileTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveProfileTab('overview')}
              >
                <i className="fas fa-id-card"></i> Overview
              </button>
              <button 
                className={`modal-tab-item ${activeProfileTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveProfileTab('personal')}
              >
                <i className="fas fa-user"></i> Personal & Address
              </button>
              <button 
                className={`modal-tab-item ${activeProfileTab === 'work' ? 'active' : ''}`}
                onClick={() => setActiveProfileTab('work')}
              >
                <i className="fas fa-briefcase"></i> Work Information
              </button>
              <button 
                className={`modal-tab-item ${activeProfileTab === 'bank' ? 'active' : ''}`}
                onClick={() => setActiveProfileTab('bank')}
              >
                <i className="fas fa-building-columns"></i> Bank & Financial
              </button>
              {selectedEmployee.userId?.exitDetails && selectedEmployee.userId?.isActive === false && (
                <button 
                  className={`modal-tab-item ${activeProfileTab === 'exit' ? 'active' : ''}`}
                  onClick={() => setActiveProfileTab('exit')}
                  style={{ color: '#dc2626' }}
                >
                  <i className="fas fa-door-open"></i> Exit Details
                </button>
              )}
            </div>

            {/* Profile Tab Contents */}
            <div className="profile-tab-content bg-white rounded-4 border p-4 mt-3 shadow-sm">
              {activeProfileTab === 'overview' && (
                <div className="info-cards-grid">
                  <div className="detail-card">
                    <div className="detail-card-title"><i className="fas fa-address-book text-emerald"></i> Contact Information</div>
                    <div className="detail-item">
                      <div className="detail-label">Work Email</div>
                      <div className="detail-value">
                        <span>{selectedEmployee.userId?.email}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(selectedEmployee.userId?.email, 'Email')}>
                          <i className="fas fa-copy"></i>
                        </button>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Phone Number</div>
                      <div className="detail-value">
                        <span>{selectedEmployee.personalInfo?.phone || 'Not provided'}</span>
                        {selectedEmployee.personalInfo?.phone && (
                          <button className="copy-btn" onClick={() => copyToClipboard(selectedEmployee.personalInfo?.phone, 'Phone')}>
                            <i className="fas fa-copy"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-title"><i className="fas fa-briefcase text-primary"></i> Employment Summary</div>
                    <div className="detail-item">
                      <div className="detail-label">Employee ID</div>
                      <div className="detail-value">{selectedEmployee.employeeId || selectedEmployee.professionalInfo?.employeeId || 'Unassigned'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Base Work Location</div>
                      <div className="detail-value">{selectedEmployee.workInfo?.workLocation || selectedEmployee.professionalInfo?.workLocation || 'Not set'}</div>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-title"><i className="fas fa-calendar-check text-purple"></i> Key Dates</div>
                    <div className="detail-item">
                      <div className="detail-label">Joining Date</div>
                      <div className="detail-value">{selectedEmployee.userId?.joinDate ? new Date(selectedEmployee.userId.joinDate).toLocaleDateString() : 'Not set'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Date of Birth</div>
                      <div className="detail-value">
                        {(selectedEmployee.userId?.dateOfBirth && selectedEmployee.userId.dateOfBirth !== '1970-01-01T00:00:00.000Z') ? new Date(selectedEmployee.userId.dateOfBirth).toLocaleDateString() : 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'personal' && (
                <div className="info-cards-grid">
                  <div className="detail-card">
                    <div className="detail-card-title"><i className="fas fa-user-tag text-emerald"></i> Personal Details</div>
                    <div className="detail-item">
                      <div className="detail-label">Full Name</div>
                      <div className="detail-value">{selectedEmployee.userId?.firstName} {selectedEmployee.userId?.lastName}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Blood Group</div>
                      <div className="detail-value">{selectedEmployee.personalInfo?.bloodGroup || 'Not specified'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Marital Status</div>
                      <div className="detail-value">{selectedEmployee.personalInfo?.maritalStatus || 'Not specified'}</div>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-title"><i className="fas fa-house text-primary"></i> Home Address</div>
                    <div className="detail-item">
                      <div className="detail-label">Street Address</div>
                      <div className="detail-value">{selectedEmployee.personalInfo?.address?.street || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">City / State</div>
                      <div className="detail-value">{selectedEmployee.personalInfo?.address?.city || ''} {selectedEmployee.personalInfo?.address?.state ? `, ${selectedEmployee.personalInfo.address.state}` : ''}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Zip Code / Country</div>
                      <div className="detail-value">{selectedEmployee.personalInfo?.address?.zipCode || ''} {selectedEmployee.personalInfo?.address?.country ? `, ${selectedEmployee.personalInfo.address.country}` : ''}</div>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-title"><i className="fas fa-phone-volume text-danger"></i> Emergency Contact</div>
                    <div className="detail-item">
                      <div className="detail-label">Contact Name</div>
                      <div className="detail-value">{selectedEmployee.personalInfo?.emergencyContact?.name || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Relationship</div>
                      <div className="detail-value">{selectedEmployee.personalInfo?.emergencyContact?.relationship || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Emergency Phone</div>
                      <div className="detail-value">{selectedEmployee.personalInfo?.emergencyContact?.phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'work' && (
                <div className="info-cards-grid">
                  <div className="detail-card">
                    <div className="detail-card-title"><i className="fas fa-sitemap text-emerald"></i> Organizational Structure</div>
                    <div className="detail-item">
                      <div className="detail-label">Department</div>
                      <div className="detail-value">{selectedEmployee.userId?.department || 'Unassigned'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Designation</div>
                      <div className="detail-value">{selectedEmployee.workInfo?.designation || selectedEmployee.professionalInfo?.designation || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Employment Type</div>
                      <div className="detail-value">{selectedEmployee.professionalInfo?.employmentType || 'Full Time'}</div>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-title"><i className="fas fa-location-dot text-primary"></i> Work Location & GPS Tracking</div>
                    <div className="detail-item">
                      <div className="detail-label">Base Work Location</div>
                      <div className="detail-value">{selectedEmployee.workInfo?.workLocation || selectedEmployee.professionalInfo?.workLocation || 'Office Base'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">GPS Field Tracking</div>
                      <div className="detail-value">
                        {selectedEmployee.userId?.isFieldEmployee ? (
                          <Badge bg="info" className="text-dark"><i className="fas fa-route me-1"></i> Field Tracking Active</Badge>
                        ) : (
                          <span className="text-muted">Standard Desk Employee</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'bank' && (
                <div className="info-cards-grid">
                  <div className="detail-card">
                    <div className="detail-card-title"><i className="fas fa-university text-emerald"></i> Bank Account Information</div>
                    <div className="detail-item">
                      <div className="detail-label">Bank Name</div>
                      <div className="detail-value">{selectedEmployee.bankDetails?.bankName || 'Not Provided'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Account Number</div>
                      <div className="detail-value">{selectedEmployee.bankDetails?.accountNumber || 'Not Provided'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">IFSC Code</div>
                      <div className="detail-value">{selectedEmployee.bankDetails?.ifscCode || 'Not Provided'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Account Type</div>
                      <div className="detail-value">{selectedEmployee.bankDetails?.accountType || 'SAVINGS'}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'exit' && selectedEmployee.userId?.exitDetails && (
                <div className="detail-card" style={{ borderLeft: '4px solid #dc2626' }}>
                  <div className="detail-card-title text-danger"><i className="fas fa-door-open"></i> Offboarding & Exit Information</div>
                  <div className="exit-info-grid mt-2">
                    <div className="detail-item">
                      <div className="detail-label">Reason for Exit</div>
                      <div className="detail-value">{selectedEmployee.userId.exitDetails.reason?.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Last Working Day</div>
                      <div className="detail-value">{new Date(selectedEmployee.userId.exitDetails.exitDate).toLocaleDateString()}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Exit Interview</div>
                      <div className="detail-value">{selectedEmployee.userId.exitDetails.exitInterview}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Handover Status</div>
                      <div className="detail-value">{selectedEmployee.userId.exitDetails.handoverStatus?.replace(/_/g, ' ')}</div>
                    </div>
                    {selectedEmployee.userId.exitDetails.notes && (
                      <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                        <div className="detail-label">Exit Notes</div>
                        <div className="detail-value">{selectedEmployee.userId.exitDetails.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Management Bar */}
            {['ADMIN', 'HR'].includes(user?.role) && (
              <div className="profile-actions-bar bg-white rounded-4 border p-4 mt-3 shadow-sm">
                <div className="field-employee-box w-100 mb-3">
                  <div className="field-box-info">
                    <i className="fas fa-street-view"></i>
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>GPS Field Tracking Control</div>
                      <div className="text-muted" style={{ fontSize: '0.785rem' }}>
                        {selectedEmployee.userId?.isFieldEmployee ? 'Live GPS tracking and visit route logging active' : 'Enable live field visit tracking for this employee'}
                      </div>
                    </div>
                  </div>
                  <label className="custom-switch">
                    <input 
                      type="checkbox" 
                      checked={!!selectedEmployee.userId?.isFieldEmployee}
                      onChange={() => handleToggleFieldEmployee(selectedEmployee.userId?._id, selectedEmployee.userId?.isFieldEmployee)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                <button className="action-btn-styled btn-edit" onClick={handleEditProfile}>
                  <i className="fas fa-user-pen"></i> Edit Profile
                </button>

                {user?.role === 'ADMIN' && (
                  <button className="action-btn-styled btn-role" onClick={handleChangeRole}>
                    <i className="fas fa-user-shield"></i> Change Role
                  </button>
                )}

                {user?.role === 'ADMIN' && (
                  <button className="action-btn-styled btn-password" onClick={handleResetPassword}>
                    <i className="fas fa-key"></i> Reset Password
                  </button>
                )}

                <button className="action-btn-styled btn-wfh" onClick={handleResetWfhLocation}>
                  <i className="fas fa-location-crosshairs"></i> Reset WFH Location
                </button>

                {(selectedEmployee.userId?.isActive !== false) ? (
                  <button className="action-btn-styled btn-deactivate ms-auto" onClick={handleConfirmDelete}>
                    <i className="fas fa-user-slash"></i> Deactivate
                  </button>
                ) : (
                  <button className="action-btn-styled btn-reactivate ms-auto" onClick={() => handleReactivate(selectedEmployee.userId?._id)}>
                    <i className="fas fa-user-check"></i> Reactivate
                  </button>
                )}

                {user?.role === 'ADMIN' && (
                  <button className="action-btn-styled btn-delete-perm" onClick={handleDeletePermanently}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="employee-directory-v2">
      {/* Directory Header */}
      <div className="directory-header">
        <div className="header-left">
          <h1 className="directory-title">
            <div className="title-icon-wrapper">
              <i className="fas fa-users-gear"></i>
            </div>
            Employee Directory
          </h1>
          <p className="directory-subtitle">
            <span>Manage staff, profiles & access roles</span>
            <span className="count-badge">{filteredEmployees.length} {filteredEmployees.length === 1 ? 'Member' : 'Members'}</span>
          </p>
        </div>
        
        <div className="header-actions">
          <Button variant="light" onClick={exportToExcel} className="btn-export">
            <i className="fas fa-file-excel text-success me-1"></i> Export Excel
          </Button>
          {['HR', 'ADMIN'].includes(user?.role) && (
            <Button className="btn-add-emp" onClick={() => setShowAddModal(true)}>
              <i className="fas fa-plus me-1"></i> Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-cards-container">
        <div 
          className={`stats-card stats-card-active ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          <div className="stats-card-icon-wrapper stats-icon-active">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stats-card-content">
            <div className="stats-card-label">Active Employees</div>
            <div className="stats-card-value">{stats.active}</div>
            <div className="stats-card-trend">
              <i className="fas fa-circle-check text-success"></i> Currently working
            </div>
          </div>
        </div>
        
        <div 
          className={`stats-card stats-card-inactive ${statusFilter === 'inactive' ? 'active' : ''}`}
          onClick={() => setStatusFilter('inactive')}
        >
          <div className="stats-card-icon-wrapper stats-icon-inactive">
            <i className="fas fa-user-slash"></i>
          </div>
          <div className="stats-card-content">
            <div className="stats-card-label">Exited Staff</div>
            <div className="stats-card-value">{stats.inactive}</div>
            <div className="stats-card-trend">
              <i className="fas fa-door-open text-danger"></i> Offboarded
            </div>
          </div>
        </div>

        <div className="stats-card stats-card-depts">
          <div className="stats-card-icon-wrapper stats-icon-depts">
            <i className="fas fa-building"></i>
          </div>
          <div className="stats-card-content">
            <div className="stats-card-label">Departments</div>
            <div className="stats-card-value">{stats.departments}</div>
            <div className="stats-card-trend">
              <i className="fas fa-sitemap text-primary"></i> Active units
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="filters-bar">
        <div className="filter-group-left">
          <div className="search-box">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search by name, email, ID, phone..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            {filters.search && (
              <button className="clear-search-btn" onClick={() => setFilters(prev => ({ ...prev, search: '' }))}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          <div className="filter-selects">
            <select
              className="filter-select"
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
            >
              <option value="">All Departments</option>
              {Array.isArray(departments) && departments.map(dept => (
                <option key={dept._id || dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>

            {(filters.search || filters.department || filters.role) && (
              <button 
                className="btn-reset-filters"
                onClick={() => setFilters({ search: '', department: '', role: '' })}
              >
                <i className="fas fa-filter-circle-xmark"></i> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* View Switcher */}
        <div className="view-switcher-group">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <i className="fas fa-th-large"></i> Grid
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Table View"
          >
            <i className="fas fa-list"></i> Table
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner-border text-emerald"></div>
          <p>Loading employee directory...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="empty-container">
          <i className="fas fa-users-slash"></i>
          <h3>No Employees Found</h3>
          <p>We couldn't find any employees matching your current search or filter criteria.</p>
          {(filters.search || filters.department || filters.role) && (
            <button className="btn-reset-filters" style={{ margin: '0 auto' }} onClick={() => setFilters({ search: '', department: '', role: '' })}>
              <i className="fas fa-arrows-rotate me-1"></i> Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid-view-container">
          <Row className="g-3">
            {filteredEmployees.map((employee) => {
              const isActive = employee?.isActive !== false && employee?.userId?.isActive !== false;
              const isField = employee?.isFieldEmployee || employee?.userId?.isFieldEmployee;
              const role = employee?.role || employee?.userId?.role || 'EMPLOYEE';
              const name = `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || 'Employee';
              const profileImg = employee?.profileImage || employee?.userId?.profileImage;
              const designation = employee?.designation || employee?.workInfo?.designation || employee?.professionalInfo?.designation;
              const department = employee?.department || employee?.workInfo?.department || employee?.userId?.department;

              return (
                <Col key={employee?._id} xs={12} sm={6} md={4} lg={3} xl={2.4} className="mb-3">
                  <div 
                    className={`employee-card-v2 ${!isActive ? 'exited-card' : ''}`}
                    onClick={() => handleViewProfile(employee)}
                  >
                    {/* Top Status Tags */}
                    <div className="card-top-badges">
                      <span className={`status-tag ${isActive ? 'active' : 'exited'}`}>
                        <i className={`fas ${isActive ? 'fa-circle' : 'fa-door-open'}`} style={{ fontSize: '0.45rem' }}></i>
                        {isActive ? 'Active' : 'Exited'}
                      </span>
                      {isField && (
                        <span className="field-tag" title="GPS Field Tracking Enabled">
                          <i className="fas fa-route"></i> Field
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="card-avatar-wrapper">
                      {profileImg ? (
                        <img
                          src={profileImg}
                          alt={name}
                          className="card-avatar-img"
                        />
                      ) : (
                        <div className={`card-avatar-initials ${isActive ? 'active-bg' : 'inactive-bg'}`}>
                          {employee?.firstName?.charAt(0)?.toUpperCase()}{employee?.lastName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className={`avatar-online-dot ${isActive ? 'active' : 'inactive'}`}></div>
                    </div>

                    {/* Details */}
                    <div className="card-emp-name">{name}</div>
                    <div className="card-emp-designation">{designation || 'No Designation'}</div>
                    <div className="card-emp-dept">
                      <i className="fas fa-building text-muted"></i>
                      <span>{department || 'Unassigned'}</span>
                    </div>

                    <span className={`card-role-badge ${getRoleBadgeClass(role)}`}>
                      {role}
                    </span>

                    {/* Quick Action Footer */}
                    <div className="card-action-bar" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="quick-icon-btn btn-profile-view" 
                        onClick={() => handleViewProfile(employee)}
                      >
                        <i className="fas fa-user me-1"></i> Profile
                      </button>
                      {employee?.email && (
                        <a 
                          href={`mailto:${employee.email}`} 
                          className="quick-icon-btn" 
                          title="Send Email"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="fas fa-envelope"></i>
                        </a>
                      )}
                      {employee?.personalInfo?.phone && (
                        <a 
                          href={`tel:${employee.personalInfo.phone}`} 
                          className="quick-icon-btn" 
                          title="Call Phone"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="fas fa-phone"></i>
                        </a>
                      )}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="table-view-container">
          <Table responsive hover className="directory-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department & Position</th>
                <th>Role</th>
                <th>Location</th>
                <th>Field Tracking</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const isActive = employee?.isActive !== false && employee?.userId?.isActive !== false;
                const isField = employee?.isFieldEmployee || employee?.userId?.isFieldEmployee;
                const role = employee?.role || employee?.userId?.role || 'EMPLOYEE';
                const name = `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || 'Employee';
                const profileImg = employee?.profileImage || employee?.userId?.profileImage;
                const designation = employee?.designation || employee?.workInfo?.designation || employee?.professionalInfo?.designation || 'N/A';
                const department = employee?.department || employee?.workInfo?.department || employee?.userId?.department || 'Unassigned';
                const empId = employee?.employeeId || employee?.professionalInfo?.employeeId || 'N/A';
                const location = employee?.workInfo?.workLocation || employee?.professionalInfo?.workLocation || 'N/A';

                return (
                  <tr key={employee?._id} onClick={() => handleViewProfile(employee)}>
                    <td>
                      <div className="table-emp-cell">
                        {profileImg ? (
                          <img src={profileImg} alt={name} className="table-avatar-img" />
                        ) : (
                          <div className="table-avatar-initials" style={{ background: isActive ? '#10b981' : '#94a3b8' }}>
                            {employee?.firstName?.charAt(0)?.toUpperCase()}{employee?.lastName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="table-emp-name">{name}</div>
                          <div className="table-emp-email">{employee?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{empId}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{designation}</div>
                      <div className="text-muted small">{department}</div>
                    </td>
                    <td>
                      <span className={`card-role-badge ${getRoleBadgeClass(role)}`}>
                        {role}
                      </span>
                    </td>
                    <td>
                      <span className="text-secondary small">{location}</span>
                    </td>
                    <td>
                      {isField ? (
                        <Badge bg="info" className="text-dark">
                          <i className="fas fa-location-dot me-1"></i> Active
                        </Badge>
                      ) : (
                        <span className="text-muted small">Standard</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-tag ${isActive ? 'active' : 'exited'}`}>
                        {isActive ? 'Active' : 'Exited'}
                      </span>
                    </td>
                    <td className="text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="table-actions justify-content-end">
                        <Button 
                          size="sm" 
                          variant="outline-emerald"
                          className="btn-profile-view me-1"
                          onClick={() => handleViewProfile(employee)}
                        >
                          <i className="fas fa-eye me-1"></i> View
                        </Button>
                        
                        {['ADMIN', 'HR'].includes(user?.role) && (
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="light" size="sm" className="no-caret">
                              <i className="fas fa-ellipsis-v"></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleViewProfile(employee)}>
                                <i className="fas fa-user-gear me-2 text-primary"></i> View Details
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleToggleFieldEmployee(employee?.userId?._id || employee?._id, isField)}>
                                <i className="fas fa-route me-2 text-info"></i> {isField ? 'Disable Field GPS' : 'Enable Field GPS'}
                              </Dropdown.Item>
                              {user?.role === 'ADMIN' && (
                                <Dropdown.Item onClick={async () => {
                                  await handleViewProfile(employee);
                                  handleResetPassword();
                                }}>
                                  <i className="fas fa-key me-2 text-secondary"></i> Reset Password
                                </Dropdown.Item>
                              )}
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl" centered className="edit-employee-modal">
        <Modal.Header closeButton className="edit-modal-header">
          <Modal.Title>
            <i className="fas fa-user-gear me-2"></i> Edit Employee Profile
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="edit-modal-body">
          {selectedEmployee && editableProfile && (
            <div>
              {/* Profile Photo Header */}
              <div className="avatar-upload-card">
                <div className="avatar-preview-wrapper">
                  {editableProfile.userId?.profileImage ? (
                    <img src={editableProfile.userId.profileImage} alt="Profile" />
                  ) : (
                    <div className="avatar-preview-initials">
                      {editableProfile.userId?.firstName?.charAt(0)}{editableProfile.userId?.lastName?.charAt(0)}
                    </div>
                  )}
                  <div className="avatar-overlay-icon" onClick={() => document.getElementById('profileImageInput').click()}>
                    <i className="fas fa-camera"></i>
                  </div>
                </div>
                <div>
                  <h5 className="mb-1 text-dark fw-bold">{editableProfile.userId?.firstName} {editableProfile.userId?.lastName}</h5>
                  <p className="text-muted small mb-2">{editableProfile.employeeId || 'No ID'} • {editableProfile.workInfo?.designation || 'No Position'}</p>
                  <Button size="sm" variant="outline-primary" onClick={() => document.getElementById('profileImageInput').click()}>
                    <i className="fas fa-upload me-1"></i> Upload Photo
                  </Button>
                  <input
                    id="profileImageInput"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const form = new FormData();
                        form.append('profileImage', file);
                        try {
                          const userId = selectedEmployee.userId._id || selectedEmployee.userId;
                          await api.post(`/api/employees/profile/${userId}/profile-image`, form, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          const response = await api.get(`/api/employees/profile/${userId}`);
                          setSelectedEmployee(response.data);
                          setEditableProfile(response.data);
                          fetchEmployees();
                          Swal.fire({ icon: 'success', title: 'Success', text: 'Profile photo updated successfully', timer: 1800, showConfirmButton: false });
                        } catch (error) {
                          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to upload photo' });
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Edit Tabs */}
              <div className="modal-tabs-nav mb-3">
                <button className={`modal-tab-item ${activeEditTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveEditTab('personal')}>
                  <i className="fas fa-user"></i> Personal Info
                </button>
                <button className={`modal-tab-item ${activeEditTab === 'address' ? 'active' : ''}`} onClick={() => setActiveEditTab('address')}>
                  <i className="fas fa-house"></i> Address
                </button>
                <button className={`modal-tab-item ${activeEditTab === 'work' ? 'active' : ''}`} onClick={() => setActiveEditTab('work')}>
                  <i className="fas fa-briefcase"></i> Work & Role
                </button>
                <button className={`modal-tab-item ${activeEditTab === 'emergency' ? 'active' : ''}`} onClick={() => setActiveEditTab('emergency')}>
                  <i className="fas fa-phone-volume"></i> Emergency Contact
                </button>
                <button className={`modal-tab-item ${activeEditTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveEditTab('bank')}>
                  <i className="fas fa-building-columns"></i> Bank Details
                </button>
              </div>

              {/* Tab Form Contents */}
              {activeEditTab === 'personal' && (
                <div className="form-section-card">
                  <div className="form-section-title"><i className="fas fa-user text-emerald"></i> Personal Details</div>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">First Name</Form.Label>
                        <Form.Control type="text" value={editableProfile?.userId?.firstName || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, firstName: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Last Name</Form.Label>
                        <Form.Control type="text" value={editableProfile?.userId?.lastName || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, lastName: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Email</Form.Label>
                        <Form.Control type="email" value={editableProfile?.userId?.email || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, email: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Phone Number</Form.Label>
                        <Form.Control type="tel" value={editableProfile?.personalInfo?.phone || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Date of Birth</Form.Label>
                        <Form.Control type="date" value={(editableProfile?.userId?.dateOfBirth && editableProfile.userId.dateOfBirth !== '1970-01-01T00:00:00.000Z' && new Date(editableProfile.userId.dateOfBirth).toISOString().slice(0, 10)) || ''}
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, dateOfBirth: e.target.value || null } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Blood Group</Form.Label>
                        <Form.Control type="text" placeholder="e.g. O+" value={editableProfile?.personalInfo?.bloodGroup || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, bloodGroup: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Marital Status</Form.Label>
                        <Form.Select value={editableProfile?.personalInfo?.maritalStatus || 'SINGLE'} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, maritalStatus: e.target.value } }))}>
                          <option value="SINGLE">Single</option>
                          <option value="MARRIED">Married</option>
                          <option value="DIVORCED">Divorced</option>
                          <option value="WIDOWED">Widowed</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {activeEditTab === 'address' && (
                <div className="form-section-card">
                  <div className="form-section-title"><i className="fas fa-house text-primary"></i> Address Details</div>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Street Address</Form.Label>
                    <Form.Control type="text" value={editableProfile?.personalInfo?.address?.street || ''} 
                      onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, street: e.target.value } } }))} />
                  </Form.Group>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">City</Form.Label>
                        <Form.Control type="text" value={editableProfile?.personalInfo?.address?.city || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, city: e.target.value } } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">State</Form.Label>
                        <Form.Control type="text" value={editableProfile?.personalInfo?.address?.state || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, state: e.target.value } } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Zip Code</Form.Label>
                        <Form.Control type="text" value={editableProfile?.personalInfo?.address?.zipCode || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, zipCode: e.target.value } } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Country</Form.Label>
                        <Form.Control type="text" value={editableProfile?.personalInfo?.address?.country || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, country: e.target.value } } }))} />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {activeEditTab === 'work' && (
                <div className="form-section-card">
                  <div className="form-section-title"><i className="fas fa-briefcase text-purple"></i> Work Information</div>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Employee ID</Form.Label>
                        <Form.Control type="text" value={editableProfile?.employeeId || editableProfile?.professionalInfo?.employeeId || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, employeeId: e.target.value, professionalInfo: { ...prev.professionalInfo, employeeId: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Department</Form.Label>
                        <Form.Select 
                          value={editableProfile?.workInfo?.department || editableProfile?.userId?.department || ''}
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, workInfo: { ...prev.workInfo, department: e.target.value }, userId: { ...prev.userId, department: e.target.value } }))}
                        >
                          <option value="">Select Department</option>
                          {departments.map(d => (
                            <option key={d._id || d.name} value={d.name}>{d.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Designation</Form.Label>
                        <Form.Control type="text" value={editableProfile?.workInfo?.designation || editableProfile?.professionalInfo?.designation || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, workInfo: { ...prev.workInfo, designation: e.target.value }, professionalInfo: { ...prev.professionalInfo, designation: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Work Location</Form.Label>
                        <Form.Control type="text" value={editableProfile?.workInfo?.workLocation || editableProfile?.professionalInfo?.workLocation || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, workInfo: { ...prev.workInfo, workLocation: e.target.value }, professionalInfo: { ...prev.professionalInfo, workLocation: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Joining Date</Form.Label>
                        <Form.Control type="date" value={(editableProfile?.userId?.joinDate && editableProfile.userId.joinDate !== '1970-01-01T00:00:00.000Z' && new Date(editableProfile.userId.joinDate).toISOString().slice(0, 10)) || ''}
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, joinDate: e.target.value || null } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Employment Type</Form.Label>
                        <Form.Select value={editableProfile?.professionalInfo?.employmentType || 'FULL_TIME'} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, professionalInfo: { ...prev.professionalInfo, employmentType: e.target.value } }))}>
                          <option value="FULL_TIME">Full Time</option>
                          <option value="PART_TIME">Part Time</option>
                          <option value="CONTRACT">Contract</option>
                          <option value="INTERN">Intern</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {activeEditTab === 'emergency' && (
                <div className="form-section-card">
                  <div className="form-section-title"><i className="fas fa-phone-volume text-danger"></i> Emergency Contact</div>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Contact Name</Form.Label>
                        <Form.Control type="text" value={editableProfile?.personalInfo?.emergencyContact?.name || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, emergencyContact: { ...prev.personalInfo?.emergencyContact, name: e.target.value } } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Relationship</Form.Label>
                        <Form.Control type="text" placeholder="e.g. Spouse, Parent" value={editableProfile?.personalInfo?.emergencyContact?.relationship || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, emergencyContact: { ...prev.personalInfo?.emergencyContact, relationship: e.target.value } } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Emergency Phone</Form.Label>
                        <Form.Control type="tel" value={editableProfile?.personalInfo?.emergencyContact?.phone || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, emergencyContact: { ...prev.personalInfo?.emergencyContact, phone: e.target.value } } }))} />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {activeEditTab === 'bank' && (
                <div className="form-section-card">
                  <div className="form-section-title"><i className="fas fa-university text-info"></i> Bank Details</div>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Bank Name</Form.Label>
                        <Form.Control type="text" value={editableProfile?.bankDetails?.bankName || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, bankName: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Account Number</Form.Label>
                        <Form.Control type="text" value={editableProfile?.bankDetails?.accountNumber || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountNumber: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">IFSC Code</Form.Label>
                        <Form.Control type="text" value={editableProfile?.bankDetails?.ifscCode || ''} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, ifscCode: e.target.value } }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Account Type</Form.Label>
                        <Form.Select value={editableProfile?.bankDetails?.accountType || 'SAVINGS'} 
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountType: e.target.value } }))}>
                          <option value="SAVINGS">Savings</option>
                          <option value="CURRENT">Current</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: '#f8fafc' }}>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSaveProfile} style={{ background: '#10b981', borderColor: '#10b981' }}>
            <i className="fas fa-check me-1"></i> Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ADD EMPLOYEE MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered className="add-employee-modal">
        <Modal.Header closeButton className="add-modal-header">
          <Modal.Title>
            <i className="fas fa-user-plus me-2"></i> Add New Employee
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddEmployee}>
          <Modal.Body className="add-modal-body">
            <Row>
              <Col md={6}>
                <div className="form-section-card">
                  <div className="form-section-title"><i className="fas fa-user text-primary"></i> Basic Information</div>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">First Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Last Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Work Email *</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="john.doe@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </Form.Group>
                </div>
              </Col>

              <Col md={6}>
                <div className="form-section-card">
                  <div className="form-section-title"><i className="fas fa-briefcase text-emerald"></i> Job & Role</div>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Department</Form.Label>
                    <Form.Select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments && departments.length > 0 ? (
                        departments.map(dept => (
                          <option key={dept._id || dept.name} value={dept.name}>{dept.name}</option>
                        ))
                      ) : (
                        <option disabled>Loading departments...</option>
                      )}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Designation</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Software Engineer"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Joining Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Access Role *</Form.Label>
                    <Form.Select
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      <option value="EMPLOYEE">Employee (Standard Access)</option>
                      <option value="MANAGER">Manager (Team Leader)</option>
                      <option value="HR">HR (HR Portal & Management)</option>
                      {user?.role === 'ADMIN' && <option value="ADMIN">Admin (Full Administrator)</option>}
                    </Form.Select>
                  </Form.Group>
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8fafc' }}>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={loading} style={{ background: '#10b981', borderColor: '#10b981' }}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-1"></i> Create Employee
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeDirectory;
