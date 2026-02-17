import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Form, InputGroup, Badge, Button, Modal, Pagination } from 'react-bootstrap';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ search: '', department: '', location: '' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roleSaving, setRoleSaving] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [editableProfile, setEditableProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [inlineRoles, setInlineRoles] = useState({});
  const [inlineSaving, setInlineSaving] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // allow calling fetchEmployees when filters change without adding the function to deps
  useEffect(() => {
    fetchEmployees();
    setCurrentPage(1); // Reset to first page when filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // Build query only for non-empty filter values to avoid sending empty params
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const url = params.toString() ? `/api/employees/directory?${params.toString()}` : '/api/employees/directory';
      const response = await api.get(url);
      // response.data.profiles expected; fallback to response.data
      const list = response.data?.profiles || response.data || [];
      setEmployees(list);

      // initialize inline role map
      const roleMap = {};
      list.forEach(emp => {
        const id = emp.userId?._id || emp.userId;
        roleMap[id] = emp.userId?.role || 'EMPLOYEE';
      });
      setInlineRoles(roleMap);
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
      // Open modal immediately and show loading state
      setSelectedEmployee(null);
      setEditableProfile({ userId: {}, workInfo: {}, professionalInfo: {}, personalInfo: {}, skills: [] });
      setNewRole('EMPLOYEE');
      setShowModal(true);
      setProfileLoading(true);
      // robust id extraction
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
        console.error('handleViewProfile: missing id for', employeeOrId);
        toast.error('Cannot open profile: missing user id');
        setProfileLoading(false);
        return;
      }
      const response = await api.get(`/api/employees/profile/${id}`);
      const profile = response.data;
      console.log('Received profile:', profile);
      console.log('Profile employeeId:', profile.employeeId);
      console.log('Profile location:', profile.location);
      setSelectedEmployee(profile);
      setEditableProfile(profile);
      setNewRole(profile.userId?.role || 'EMPLOYEE');
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load profile');
      // keep modal open to show error state or allow retry
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedEmployee) return;
    setRoleSaving(true);
    try {
      await api.put(`/api/users/${selectedEmployee.userId._id}/role`, { role: newRole });
      // update local state
      setSelectedEmployee(prev => ({ ...prev, userId: { ...prev.userId, role: newRole } }));
      setEmployees(prev => prev.map(emp => emp.userId._id === selectedEmployee.userId._id ? { ...emp, userId: { ...emp.userId, role: newRole } } : emp));
      toast.success('Role updated successfully');
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    // show confirmation modal before saving
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    if (!selectedEmployee || !editableProfile) return;
    const userId = selectedEmployee.userId._id || selectedEmployee.userId;
    try {
      // 1) update User document first
      const userPayload = {
        firstName: editableProfile.userId?.firstName,
        lastName: editableProfile.userId?.lastName,
        email: editableProfile.userId?.email,
        department: editableProfile.workInfo?.department || editableProfile.professionalInfo?.department || editableProfile.userId?.department,
        designation: editableProfile.workInfo?.designation || editableProfile.professionalInfo?.designation || editableProfile.userId?.designation,
        joinDate: editableProfile.userId?.joinDate || null,
        dateOfBirth: editableProfile.userId?.dateOfBirth || null
      };
      console.log('Saving user with payload:', userPayload);
      const userResponse = await api.put(`/api/users/${userId}`, userPayload);
      console.log('User update response:', userResponse.data);

      // 2) update EmployeeProfile (will create if doesn't exist)
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
      console.log('Saving profile with payload:', payload);
      const res = await api.put(`/api/employees/profile/${userId}`, payload);
      const updatedProfile = res.data.profile || res.data;

      // Refresh profile from server to get latest data
      const refreshResponse = await api.get(`/api/employees/profile/${userId}`);
      const refreshedProfile = refreshResponse.data;
      
      // update UI
      setSelectedEmployee(refreshedProfile);
      setEditableProfile(refreshedProfile);
      setEmployees(prev => prev.map(emp => (emp.userId._id === userId ? { ...emp, userId: { ...emp.userId, firstName: userPayload.firstName || emp.userId.firstName, lastName: userPayload.lastName || emp.userId.lastName, email: userPayload.email || emp.userId.email, department: userPayload.department || emp.userId.department, designation: userPayload.designation || emp.userId.designation, joinDate: userPayload.joinDate, dateOfBirth: userPayload.dateOfBirth } } : emp)));
      toast.success('Profile and user updated');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(err.response?.data?.message || 'Failed to save profile');
    }
  };

  const handleDeleteEmployee = async (employee) => {
    const result = await Swal.fire({
      title: 'Delete Employee?',
      text: `Are you sure you want to delete ${employee.userId.firstName} ${employee.userId.lastName}? This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const userId = employee.userId._id || employee.userId;
        await api.delete(`/api/users/${userId}`);
        setEmployees(prev => prev.filter(emp => (emp.userId._id || emp.userId) !== userId));
        Swal.fire('Deleted!', 'Employee has been deleted successfully.', 'success');
      } catch (err) {
        console.error('Delete failed', err);
        Swal.fire('Error!', err.response?.data?.message || 'Failed to delete employee', 'error');
      }
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    const userId = selectedEmployee.userId._id || selectedEmployee.userId;
    try {
      await api.delete(`/api/users/${userId}`);
      // remove from list
      setEmployees(prev => prev.filter(emp => (emp.userId._id || emp.userId) !== userId));
      setShowDeleteConfirm(false);
      setShowModal(false);
      toast.success('Employee deleted');
    } catch (err) {
      console.error('Delete failed', err);
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  return (
    <div className="fade-in-up">
      <div className="page-header d-flex align-items-center justify-content-between">
        <div>
          <h1 className="page-title">
            <i className="fas fa-users me-3 text-primary"></i>
            Employee Directory
          </h1>
          <p className="text-muted mb-0">Browse and search company employees</p>
        </div>
        {['HR', 'ADMIN'].includes(user?.role) && (
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => navigate('/employee-import')}>
              <i className="fas fa-file-import me-2"></i>Import Employees
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search employees..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              >
                <option value="">All Departments</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              >
                <option value="">Office</option>
                <option value="Remote">Remote</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                onClick={() => setFilters({ search: '', department: '', location: '' })}
                className="w-100"
              >
                <i className="fas fa-times me-1"></i>
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Employee Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2">Loading employees...</p>
        </div>
      ) : (
        <>
          <Row>
            {employees
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map(employee => (
              <Col md={6} lg={4} xl={3} key={employee._id} className="mb-4">
                <Card className="h-100 employee-card modern-card hover-lift" style={{cursor: 'pointer'}} onClick={() => handleViewProfile(employee)}>
                  <Card.Body className="p-4">
                    {/* Profile Section */}
                    <div className="text-center mb-3">
                      {employee.userId.profileImage ? (
                        <div className="avatar-modern">
                          <img 
                            src={employee.userId.profileImage} 
                            alt={`${employee.userId.firstName} ${employee.userId.lastName}`}
                            className="rounded-circle mb-3"
                            style={{width: '80px', height: '80px', objectFit: 'cover', border: '3px solid var(--secondary-100)'}}
                          />
                        </div>
                      ) : (
                        <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                             style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-400))', border: '3px solid var(--secondary-100)'}}>
                          <span className="text-white fw-bold" style={{fontSize: '24px', fontFamily: 'var(--font-family)'}}>
                            {employee.userId.firstName?.charAt(0)}{employee.userId.lastName?.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <h6 className="mb-1 fw-bold" style={{color: 'var(--secondary-800)', fontSize: 'var(--font-size-base)'}}>
                        {employee.userId.firstName} {employee.userId.lastName}
                      </h6>
                      
                      <span className="status-badge" style={{background: 'rgba(168, 85, 247, 0.1)', color: 'var(--primary-600)'}}>
                        {employee.userId.role}
                      </span>
                    </div>
                    
                    {/* Info Section */}
                    <div style={{borderTop: '1px solid var(--secondary-100)', paddingTop: 'var(--space-3)'}}>
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-building" style={{fontSize: 'var(--font-size-xs)', width: '14px', color: 'var(--secondary-400)', marginRight: 'var(--space-2)'}}></i>
                        <small style={{fontSize: 'var(--font-size-xs)', color: 'var(--secondary-500)'}}>
                          {employee.workInfo?.department || employee.professionalInfo?.department || employee.userId?.department || 'No Department'}
                        </small>
                      </div>
                      
                      {employee.workInfo?.workLocation && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-map-marker-alt" style={{fontSize: 'var(--font-size-xs)', width: '14px', color: 'var(--secondary-400)', marginRight: 'var(--space-2)'}}></i>
                          <small style={{fontSize: 'var(--font-size-xs)', color: 'var(--secondary-500)'}}>
                            {employee.workInfo.workLocation}
                          </small>
                        </div>
                      )}
                      
                      <div className="d-flex align-items-center">
                        <i className="fas fa-envelope" style={{fontSize: 'var(--font-size-xs)', width: '14px', color: 'var(--secondary-400)', marginRight: 'var(--space-2)'}}></i>
                        <small className="text-truncate" style={{fontSize: 'var(--font-size-xs)', color: 'var(--secondary-500)'}} title={employee.userId.email}>
                          {employee.userId.email}
                        </small>
                      </div>
                    </div>
                    
                    {/* Admin Role Editor */}
                    {user?.role === 'ADMIN' && (
                      <div style={{borderTop: '1px solid var(--secondary-100)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-3)'}} onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex align-items-center gap-2">
                          <Form.Select 
                            size="sm" 
                            className="form-control-modern"
                            value={inlineRoles[employee.userId._id || employee.userId] || (employee.userId?.role || 'EMPLOYEE')} 
                            onChange={(e) => setInlineRoles(prev => ({ ...prev, [employee.userId._id || employee.userId]: e.target.value }))}
                            style={{fontSize: 'var(--font-size-xs)', flex: 1}}
                          >
                             <option value="EMPLOYEE">Employee</option>
                            <option value="MANAGER">Manager</option>
                            <option value="HR">HR</option>
                            <option value="ADMIN">Admin</option>
                          </Form.Select>
                          <Button 
                            size="sm" 
                            className="btn-modern"
                            style={{
                              fontSize: 'var(--font-size-xs)', 
                              padding: 'var(--space-1) var(--space-2)',
                              background: 'var(--primary-500)',
                              border: 'none',
                              color: 'white',
                              borderRadius: 'var(--radius-md)'
                            }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const id = employee.userId._id || employee.userId;
                              const role = inlineRoles[id];
                              if (!role) return;
                              setInlineSaving(prev => ({ ...prev, [id]: true }));
                              try {
                                await api.put(`/api/users/${id}/role`, { role });
                                setEmployees(prev => prev.map(emp => ( (emp.userId._id === id || emp.userId === id) ? { ...emp, userId: { ...emp.userId, role } } : emp)));
                                toast.success('Role updated');
                              } catch (err) {
                                console.error('Inline role update failed', err);
                                toast.error(err.response?.data?.message || 'Failed to update role');
                              } finally {
                                setInlineSaving(prev => ({ ...prev, [id]: false }));
                              }
                            }} 
                            disabled={inlineSaving[employee.userId._id || employee.userId]}
                          >
                            {inlineSaving[employee.userId._id || employee.userId] ? (
                              <div className="spinner-border" style={{width: '12px', height: '12px'}} role="status"></div>
                            ) : (
                              <i className="fas fa-save"></i>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* Pagination */}
          {employees.length > itemsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                />
                
                {Array.from({ length: Math.ceil(employees.length / itemsPerPage) }, (_, i) => i + 1)
                  .filter(page => {
                    const totalPages = Math.ceil(employees.length / itemsPerPage);
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <Pagination.Ellipsis disabled />}
                        <Pagination.Item
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Pagination.Item>
                      </React.Fragment>
                    );
                  })
                }
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(employees.length / itemsPerPage)))} 
                  disabled={currentPage === Math.ceil(employees.length / itemsPerPage)}
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(Math.ceil(employees.length / itemsPerPage))} 
                  disabled={currentPage === Math.ceil(employees.length / itemsPerPage)}
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      {employees.length === 0 && !loading && (
        <div className="text-center py-5">
          <i className="fas fa-users text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No employees found</h5>
          <p className="text-muted">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Employee Profile Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered scrollable dialogClassName="employee-profile-dialog">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-user me-2"></i>
            Employee Profile
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profileLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"></div>
              <div className="text-muted mt-2">Loading profile...</div>
            </div>
          ) : (
            selectedEmployee && (
              <div className="employee-profile-grid">
              <div className="profile-left text-center">
                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3 avatar-lg">
                  <i className="fas fa-user text-white fs-2"></i>
                </div>
                {user?.role === 'ADMIN' && (
                  <div className="mb-2">
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
                <h5 className="mb-1 mt-1">{editableProfile?.userId?.firstName || selectedEmployee.userId.firstName} {editableProfile?.userId?.lastName || selectedEmployee.userId.lastName}</h5>
                <div className="mb-2">
                  <span className="badge bg-light text-dark">{selectedEmployee.userId.role}</span>
                </div>
                <div className="text-muted small">{selectedEmployee.workInfo?.designation || selectedEmployee.professionalInfo?.designation || ''}</div>
              </div>

              <div className="profile-right">
                <Form>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted">First Name</Form.Label>
                        {user?.role === 'ADMIN' ? (
                          <Form.Control size="sm" value={editableProfile.userId?.firstName || ''} onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, firstName: e.target.value } }))} />
                        ) : (
                          <div className="text-muted">{selectedEmployee.userId.firstName}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted">Last Name</Form.Label>
                        {user?.role === 'ADMIN' ? (
                          <Form.Control size="sm" value={editableProfile.userId?.lastName || ''} onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, lastName: e.target.value } }))} />
                        ) : (
                          <div className="text-muted">{selectedEmployee.userId.lastName}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted">Employee ID</Form.Label>
                        {user?.role === 'ADMIN' ? (
                          <Form.Control size="sm" value={editableProfile.employeeId || editableProfile.professionalInfo?.employeeId || ''} onChange={(e) => setEditableProfile(prev => ({ ...prev, employeeId: e.target.value, professionalInfo: { ...prev.professionalInfo, employeeId: e.target.value } }))} />
                        ) : (
                          <Form.Control readOnly size="sm" value={selectedEmployee.employeeId || selectedEmployee.professionalInfo?.employeeId || 'N/A'} />
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted">Department</Form.Label>
                        {user?.role === 'ADMIN' ? (
                          <Form.Control size="sm" value={editableProfile.workInfo?.department || editableProfile.professionalInfo?.department || editableProfile.userId?.department || ''} onChange={(e) => setEditableProfile(prev => ({ ...prev, workInfo: { ...prev.workInfo, department: e.target.value }, professionalInfo: { ...prev.professionalInfo, department: e.target.value }, userId: { ...prev.userId, department: e.target.value } }))} />
                        ) : (
                          <div className="text-muted">{selectedEmployee.workInfo?.department || selectedEmployee.professionalInfo?.department || selectedEmployee.userId?.department || 'N/A'}</div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small text-muted">Email</Form.Label>
                        {user?.role === 'ADMIN' ? (
                          <Form.Control value={editableProfile.userId?.email || ''} onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, email: e.target.value } }))} />
                        ) : (
                          <div className="text-muted">{selectedEmployee.userId.email}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted">Phone</Form.Label>
                        {user?.role === 'ADMIN' ? (
                          <Form.Control size="sm" value={editableProfile.personalInfo?.phone || ''} onChange={(e) => setEditableProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: e.target.value } }))} />
                        ) : (
                          <div className="text-muted">{selectedEmployee.personalInfo?.phone || selectedEmployee.contactInfo?.phone || 'N/A'}</div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted">Designation</Form.Label>
                        {user?.role === 'ADMIN' ? (
                          <Form.Control size="sm" value={editableProfile.workInfo?.designation || editableProfile.professionalInfo?.designation || ''} onChange={(e) => setEditableProfile(prev => ({ ...prev, workInfo: { ...prev.workInfo, designation: e.target.value }, professionalInfo: { ...prev.professionalInfo, designation: e.target.value } }))} />
                        ) : (
                          <div className="text-muted">{selectedEmployee.workInfo?.designation || selectedEmployee.professionalInfo?.designation || 'N/A'}</div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted">Join Date</Form.Label>
                        {user?.role === 'ADMIN' ? (
                          <Form.Control type="date" size="sm" value={
                            (editableProfile.userId?.joinDate && editableProfile.userId.joinDate !== '1970-01-01T00:00:00.000Z' && new Date(editableProfile.userId.joinDate).toISOString().slice(0,10)) ||
                            (selectedEmployee.userId?.joinDate && selectedEmployee.userId.joinDate !== '1970-01-01T00:00:00.000Z' && new Date(selectedEmployee.userId.joinDate).toISOString().slice(0,10)) || ''
                          } onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, joinDate: e.target.value ? e.target.value : null } }))} />
                        ) : (
                          <Form.Control readOnly size="sm" value={
                            (selectedEmployee.userId?.joinDate && selectedEmployee.userId.joinDate !== '1970-01-01T00:00:00.000Z') ? new Date(selectedEmployee.userId.joinDate).toLocaleDateString() : 
                            (selectedEmployee.workInfo?.dateOfJoining && selectedEmployee.workInfo.dateOfJoining !== '1970-01-01T00:00:00.000Z') ? new Date(selectedEmployee.workInfo.dateOfJoining).toLocaleDateString() : 
                            (selectedEmployee.professionalInfo?.dateOfJoining && selectedEmployee.professionalInfo.dateOfJoining !== '1970-01-01T00:00:00.000Z') ? new Date(selectedEmployee.professionalInfo.dateOfJoining).toLocaleDateString() : ''
                          } placeholder="Not set" />
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted">Location</Form.Label>
                        <Form.Control readOnly={user?.role !== 'ADMIN'} size="sm" value={editableProfile.location || editableProfile.workInfo?.workLocation || editableProfile.professionalInfo?.workLocation || selectedEmployee.location || selectedEmployee.workInfo?.workLocation || selectedEmployee.professionalInfo?.workLocation || ''} onChange={(e) => setEditableProfile(prev => ({ ...prev, location: e.target.value, workInfo: { ...prev.workInfo, workLocation: e.target.value } }))} />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted">Date of Birth</Form.Label>
                        {user?.role === 'ADMIN' ? (
                          <Form.Control type="date" size="sm" value={
                            (editableProfile.userId?.dateOfBirth && editableProfile.userId.dateOfBirth !== '1970-01-01T00:00:00.000Z' && new Date(editableProfile.userId.dateOfBirth).toISOString().slice(0,10)) ||
                            (selectedEmployee.userId?.dateOfBirth && selectedEmployee.userId.dateOfBirth !== '1970-01-01T00:00:00.000Z' && new Date(selectedEmployee.userId.dateOfBirth).toISOString().slice(0,10)) || ''
                          } onChange={(e) => setEditableProfile(prev => ({ ...prev, userId: { ...prev.userId, dateOfBirth: e.target.value ? e.target.value : null } }))} />
                        ) : (
                          <Form.Control readOnly size="sm" value={
                            (selectedEmployee.userId?.dateOfBirth && selectedEmployee.userId.dateOfBirth !== '1970-01-01T00:00:00.000Z') ? new Date(selectedEmployee.userId.dateOfBirth).toLocaleDateString() : ''
                          } placeholder="Not set" />
                        )}
                      </Form.Group>
                    </Col>

                    {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="small text-muted">Skills</Form.Label>
                          <div>
                            {selectedEmployee.skills.map((skill, index) => (
                              <Badge key={index} bg="primary" className="me-1 mb-1">{skill}</Badge>
                            ))}
                          </div>
                        </Form.Group>
                      </Col>
                    )}
                  </Row>
                </Form>
              </div>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          {user?.role === 'ADMIN' && (
            <Button variant="danger" onClick={handleDeleteClick}>Delete</Button>
          )}
          {user?.role === 'ADMIN' && (
            <Button variant="primary" onClick={handleSaveRole} disabled={roleSaving}>{roleSaving ? 'Saving...' : 'Save Role'}</Button>
          )}
          {user?.role === 'ADMIN' && (
            <Button variant="success" onClick={handleSaveProfile}>Save Profile</Button>
          )}
        </Modal.Footer>

        {/* Delete confirmation modal */}
        <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to permanently delete this employee? This action cannot be undone.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete}>Yes, Delete</Button>
          </Modal.Footer>
        </Modal>
      </Modal>

      {/* Confirm Save Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Save</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to save changes to this employee's profile? This will update both the profile and user record.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmSave}>Yes, Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeDirectory;