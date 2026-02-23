import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Form, InputGroup, Badge, Button, Modal, Table, Offcanvas } from 'react-bootstrap';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import './EmployeeDirectory.css';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ search: '', department: '', location: '' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editableProfile, setEditableProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const url = params.toString() ? `/api/employees/directory?${params.toString()}` : '/api/employees/directory';
      const response = await api.get(url);
      const list = response.data?.profiles || response.data || [];
      console.log('Employee data sample:', list[0]); // Debug log
      setEmployees(list);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Unable to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (employeeOrId) => {
    try {
      setSelectedEmployee(null);
      setEditableProfile({ userId: {}, workInfo: {}, professionalInfo: {}, personalInfo: {}, skills: [] });
      setShowSidePanel(true);
      setProfileLoading(true);
      
      let id = '';
      if (!employeeOrId) id = '';
      else if (typeof employeeOrId === 'string') id = employeeOrId;
      else if (employeeOrId._id) id = employeeOrId._id;
      else if (employeeOrId.userId && (employeeOrId.userId._id || typeof employeeOrId.userId === 'string')) {
        id = employeeOrId.userId._id || employeeOrId.userId;
      } else if (employeeOrId.userId && employeeOrId.userId.toString) {
        id = employeeOrId.userId.toString();
      }
      id = id ? encodeURIComponent(id) : '';
      if (!id) {
        toast.error('Cannot open profile: missing user id');
        setProfileLoading(false);
        return;
      }
      const response = await api.get(`/api/employees/profile/${id}`);
      const profile = response.data;
      setSelectedEmployee(profile);
      setEditableProfile(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    const result = await Swal.fire({
      title: 'Save Changes?',
      text: 'Are you sure you want to save these changes?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, save!'
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
      setEmployees(prev => prev.map(emp => (emp.userId._id === userId ? { ...emp, userId: { ...emp.userId, ...userPayload } } : emp)));
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(err.response?.data?.message || 'Failed to save profile');
    }
  };

  const handleConfirmDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Employee?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete!'
    });

    if (!result.isConfirmed) return;
    if (!selectedEmployee) return;
    const userId = selectedEmployee.userId._id || selectedEmployee.userId;
    try {
      await api.delete(`/api/users/${userId}`);
      setEmployees(prev => prev.filter(emp => (emp.userId._id || emp.userId) !== userId));
      setShowSidePanel(false);
      toast.success('Employee deleted');
    } catch (err) {
      console.error('Delete failed', err);
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      ADMIN: 'badge-admin',
      HR: 'badge-hr',
      MANAGER: 'badge-manager',
      EMPLOYEE: 'badge-employee'
    };
    return classes[role] || classes.EMPLOYEE;
  };

  const paginatedEmployees = employees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  return (
    <div className="employee-directory-v2">
      {/* Header */}
      <div className="directory-header">
        <div className="header-left">
          <h1 className="directory-title">
            <i className="fas fa-address-book"></i>
            Employee Directory
          </h1>
          <p className="directory-subtitle">{employees.length} Total Employees</p>
        </div>
        <div className="header-actions">
          {['HR', 'ADMIN'].includes(user?.role) && (
            <Button className="btn-import" onClick={() => navigate('/employee-import')}>
              <i className="fas fa-upload me-2"></i>Import
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filter-group">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search employees..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
        <div className="filter-group">
          <select
            className="filter-select"
            value={filters.department}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
          >
            <option value="">All Departments</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
          </select>
          <select
            className="filter-select"
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
          >
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="Office">Office</option>
          </select>
          {(filters.search || filters.department || filters.location) && (
            <button 
              className="btn-reset"
              onClick={() => setFilters({ search: '', department: '', location: '' })}
            >
              <i className="fas fa-times"></i> Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner-border text-primary"></div>
          <p>Loading employees...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="empty-container">
          <i className="fas fa-users-slash"></i>
          <h3>No Employees Found</h3>
          <p>Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <div className="grid-view">
          <Row>
            {paginatedEmployees.map((employee) => (
              <Col key={employee._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <div className="employee-card-v2" onClick={() => handleViewProfile(employee)}>
                  <div 
                    className="card-top-bar" 
                    style={{ 
                      background: employee.userId.role === 'ADMIN' ? '#dc2626' : 
                                 employee.userId.role === 'HR' ? '#1e40af' : 
                                 employee.userId.role === 'MANAGER' ? '#059669' : '#3b82f6' 
                    }}
                  ></div>
                  <div className="card-content-v2">
                    <div className="employee-avatar-card">
                      {employee.userId.profileImage ? (
                        <img src={employee.userId.profileImage} alt="Profile" />
                      ) : (
                        <div className="avatar-initials-card">
                          {employee.userId.firstName?.charAt(0)}{employee.userId.lastName?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="employee-name-card">
                      {employee.userId.firstName} {employee.userId.lastName}
                    </h3>
                    <p className="employee-role-card">{employee.userId.role}</p>
                    
                    <div className="card-divider"></div>
                    
                    <div className="employee-info-card">
                      {(employee.employeeId || employee.professionalInfo?.employeeId || employee.workInfo?.employeeId) && (
                        <div className="info-item-card">
                          <i className="fas fa-id-badge"></i>
                          <div className="info-text-card">
                            <small>Employee ID</small>
                            <span>
                              {employee.employeeId || 
                               employee.professionalInfo?.employeeId || 
                               employee.workInfo?.employeeId}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="info-item-card">
                        <i className="fas fa-building"></i>
                        <div className="info-text-card">
                          <small>Department</small>
                          <span>
                            {employee.userId?.department || 
                             employee.workInfo?.department || 
                             employee.professionalInfo?.department || 
                             'Not Set'}
                          </span>
                        </div>
                      </div>
                      <div className="info-item-card">
                        <i className="fas fa-briefcase"></i>
                        <div className="info-text-card">
                          <small>Position</small>
                          <span>
                            {employee.userId?.designation || 
                             employee.workInfo?.designation || 
                             employee.professionalInfo?.designation || 
                             'Not Set'}
                          </span>
                        </div>
                      </div>
                      <div className="info-item-card">
                        <i className="fas fa-envelope"></i>
                        <div className="info-text-card">
                          <small>Email</small>
                          <span title={employee.userId?.email}>
                            {employee.userId?.email || 'Not Set'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Pagination */}
      {employees.length > itemsPerPage && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, employees.length)} of {employees.length}
          </div>
          <div className="pagination-controls">
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-angle-left"></i>
            </button>
            <span className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`page-num ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </span>
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-angle-right"></i>
            </button>
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Side Panel */}
      <Offcanvas show={showSidePanel} onHide={() => setShowSidePanel(false)} placement="end" className="profile-panel">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Employee Profile</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {profileLoading ? (
            <div className="loading-container">
              <div className="spinner-border text-primary"></div>
              <p>Loading...</p>
            </div>
          ) : selectedEmployee && (
            <div className="profile-content-v2">
              <div className="profile-header-v2">
                <div className="profile-avatar-large-v2">
                  {selectedEmployee.userId.profileImage ? (
                    <img src={selectedEmployee.userId.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span className="profile-initials-large">
                      {selectedEmployee.userId.firstName?.charAt(0)}{selectedEmployee.userId.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                {['ADMIN', 'HR'].includes(user?.role) && (
                  <div className="profile-upload-btn">
                    <Button size="sm" variant="outline-primary" onClick={() => document.getElementById('profileImageInput').click()}>
                      <i className="fas fa-camera me-1"></i>Upload Photo
                    </Button>
                    <input
                      id="profileImageInput"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          toast.info('Photo upload functionality will be implemented');
                        }
                      }}
                    />
                  </div>
                )}
                <h3 className="profile-name-large">{selectedEmployee.userId.firstName} {selectedEmployee.userId.lastName}</h3>
                <div className="profile-meta-badges">
                  <Badge className={`profile-role-badge ${getRoleBadgeClass(selectedEmployee.userId.role)}`}>
                    {selectedEmployee.userId.role}
                  </Badge>
                </div>
                <div className="profile-quick-stats">
                  <div className="quick-stat-item">
                    <i className="fas fa-id-badge"></i>
                    <span>{selectedEmployee.employeeId || selectedEmployee.professionalInfo?.employeeId || 'No ID'}</span>
                  </div>
                  <div className="quick-stat-divider"></div>
                  <div className="quick-stat-item">
                    <i className="fas fa-briefcase"></i>
                    <span>{selectedEmployee.workInfo?.designation || selectedEmployee.professionalInfo?.designation || 'No Position'}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h5><i className="fas fa-user"></i> Personal Information</h5>
                <div className="info-grid">
                  <div className="info-field">
                    <label>First Name</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.userId?.firstName || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, firstName: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.userId.firstName}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Last Name</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.userId?.lastName || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, lastName: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.userId.lastName}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Email</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="email" 
                        value={editableProfile?.userId?.email || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, email: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.userId.email}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Phone</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="tel" 
                        value={editableProfile?.personalInfo?.phone || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.phone || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Date of Birth</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="date" 
                        value={(editableProfile?.userId?.dateOfBirth && editableProfile.userId.dateOfBirth !== '1970-01-01T00:00:00.000Z' && new Date(editableProfile.userId.dateOfBirth).toISOString().slice(0,10)) || ''}
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, dateOfBirth: e.target.value || null } }))}
                      />
                    ) : (
                      <p>{(selectedEmployee.userId?.dateOfBirth && selectedEmployee.userId.dateOfBirth !== '1970-01-01T00:00:00.000Z') ? new Date(selectedEmployee.userId.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Alternate Phone</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="tel" 
                        value={editableProfile?.personalInfo?.alternatePhone || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, alternatePhone: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.alternatePhone || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Blood Group</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.personalInfo?.bloodGroup || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, bloodGroup: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.bloodGroup || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Marital Status</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <select 
                        value={editableProfile?.personalInfo?.maritalStatus || 'SINGLE'} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, maritalStatus: e.target.value } }))}
                      >
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                      </select>
                    ) : (
                      <p>{selectedEmployee.personalInfo?.maritalStatus || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h5><i className="fas fa-home"></i> Address</h5>
                <div className="info-grid">
                  <div className="info-field">
                    <label>Street</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.personalInfo?.address?.street || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, street: e.target.value } } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.address?.street || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>City</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.personalInfo?.address?.city || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, city: e.target.value } } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.address?.city || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>State</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.personalInfo?.address?.state || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, state: e.target.value } } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.address?.state || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Zip Code</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.personalInfo?.address?.zipCode || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, zipCode: e.target.value } } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.address?.zipCode || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Country</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.personalInfo?.address?.country || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo?.address, country: e.target.value } } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.address?.country || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h5><i className="fas fa-briefcase"></i> Work Information</h5>
                <div className="info-grid">
                  <div className="info-field">
                    <label>Employee ID</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.employeeId || editableProfile?.professionalInfo?.employeeId || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, employeeId: e.target.value, professionalInfo: { ...prev.professionalInfo, employeeId: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.employeeId || selectedEmployee.professionalInfo?.employeeId || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Department</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.workInfo?.department || editableProfile?.userId?.department || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, workInfo: { ...prev.workInfo, department: e.target.value }, userId: { ...prev.userId, department: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.workInfo?.department || selectedEmployee.userId?.department || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Designation</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.workInfo?.designation || editableProfile?.professionalInfo?.designation || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, workInfo: { ...prev.workInfo, designation: e.target.value }, professionalInfo: { ...prev.professionalInfo, designation: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.workInfo?.designation || selectedEmployee.professionalInfo?.designation || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Work Location</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.workInfo?.workLocation || editableProfile?.professionalInfo?.workLocation || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, workInfo: { ...prev.workInfo, workLocation: e.target.value }, professionalInfo: { ...prev.professionalInfo, workLocation: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.workInfo?.workLocation || selectedEmployee.professionalInfo?.workLocation || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Join Date</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="date" 
                        value={(editableProfile?.userId?.joinDate && editableProfile.userId.joinDate !== '1970-01-01T00:00:00.000Z' && new Date(editableProfile.userId.joinDate).toISOString().slice(0,10)) || ''}
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, joinDate: e.target.value || null } }))}
                      />
                    ) : (
                      <p>{(selectedEmployee.userId?.joinDate && selectedEmployee.userId.joinDate !== '1970-01-01T00:00:00.000Z') ? new Date(selectedEmployee.userId.joinDate).toLocaleDateString() : 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Employment Type</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <select 
                        value={editableProfile?.professionalInfo?.employmentType || 'FULL_TIME'} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, professionalInfo: { ...prev.professionalInfo, employmentType: e.target.value } }))}
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERN">Intern</option>
                      </select>
                    ) : (
                      <p>{selectedEmployee.professionalInfo?.employmentType || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h5><i className="fas fa-phone-alt"></i> Emergency Contact</h5>
                <div className="info-grid">
                  <div className="info-field">
                    <label>Contact Name</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.personalInfo?.emergencyContact?.name || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, emergencyContact: { ...prev.personalInfo?.emergencyContact, name: e.target.value } } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.emergencyContact?.name || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Relationship</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.personalInfo?.emergencyContact?.relationship || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, emergencyContact: { ...prev.personalInfo?.emergencyContact, relationship: e.target.value } } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.emergencyContact?.relationship || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Phone</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="tel" 
                        value={editableProfile?.personalInfo?.emergencyContact?.phone || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, emergencyContact: { ...prev.personalInfo?.emergencyContact, phone: e.target.value } } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.emergencyContact?.phone || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Email</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="email" 
                        value={editableProfile?.personalInfo?.emergencyContact?.email || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, emergencyContact: { ...prev.personalInfo?.emergencyContact, email: e.target.value } } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.personalInfo?.emergencyContact?.email || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h5><i className="fas fa-university"></i> Bank Details</h5>
                <div className="info-grid">
                  <div className="info-field">
                    <label>Account Number</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.bankDetails?.accountNumber || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountNumber: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.bankDetails?.accountNumber ? '****' + selectedEmployee.bankDetails.accountNumber.slice(-4) : 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Bank Name</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.bankDetails?.bankName || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, bankName: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.bankDetails?.bankName || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>IFSC Code</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <input 
                        type="text" 
                        value={editableProfile?.bankDetails?.ifscCode || ''} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, ifscCode: e.target.value } }))}
                      />
                    ) : (
                      <p>{selectedEmployee.bankDetails?.ifscCode || 'N/A'}</p>
                    )}
                  </div>
                  <div className="info-field">
                    <label>Account Type</label>
                    {['ADMIN', 'HR'].includes(user?.role) ? (
                      <select 
                        value={editableProfile?.bankDetails?.accountType || 'SAVINGS'} 
                        onChange={(e) => setEditableProfile(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountType: e.target.value } }))}
                      >
                        <option value="SAVINGS">Savings</option>
                        <option value="CURRENT">Current</option>
                      </select>
                    ) : (
                      <p>{selectedEmployee.bankDetails?.accountType || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              {['ADMIN', 'HR'].includes(user?.role) && (
                <div className="profile-actions">
                  <Button variant="danger" onClick={handleConfirmDelete}>
                    <i className="fas fa-trash me-2"></i>Delete
                  </Button>
                  <Button variant="primary" onClick={handleSaveProfile}>
                    <i className="fas fa-save me-2"></i>Save Changes
                  </Button>
                </div>
              )}
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default EmployeeDirectory;
