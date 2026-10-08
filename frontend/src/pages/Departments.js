import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Table, Badge, Row, Col, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { SkeletonTable } from '../components/Skeleton';
import './Departments.css';

const Departments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptEmployees, setDeptEmployees] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterHead, setFilterHead] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [formData, setFormData] = useState({
    name: '', code: '', description: '', departmentHead: '', 
    parentDepartment: '', location: ''
  });
  const [assignData, setAssignData] = useState({ employeeId: '', departmentId: '' });
  const [bulkData, setBulkData] = useState({ employeeIds: [], departmentId: '' });
  const [transferData, setTransferData] = useState({ employeeIds: [], fromDepartmentId: '', toDepartmentId: '' });
  const [importFile, setImportFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortField, sortOrder, searchTerm, filterStatus, filterLocation, filterHead]);

  useEffect(() => {
    let filtered = departments;
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus) filtered = filtered.filter(d => d.status === filterStatus);
    if (filterLocation) filtered = filtered.filter(d => d.location === filterLocation);
    if (filterHead) filtered = filtered.filter(d => d.departmentHead?._id === filterHead);
    setFilteredDepartments(filtered);
  }, [departments, searchTerm, filterStatus, filterLocation, filterHead]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        sort: sortField,
        order: sortOrder
      });
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (filterLocation) params.append('location', filterLocation);
      if (filterHead) params.append('departmentHead', filterHead);
      
      const res = await api.get(`/api/departments?${params}`);
      setDepartments(res.data.data || []);
      setFilteredDepartments(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching departments:', error);
      Swal.fire('Error', 'Failed to load departments list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/departments/employees-for-transfer');
      setEmployees(res.data.data || res.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedDept) {
        await api.put(`/api/departments/${selectedDept._id}`, formData);
        Swal.fire({ icon: 'success', title: 'Updated!', text: 'Department details updated successfully', timer: 1800, showConfirmButton: false });
      } else {
        await api.post('/api/departments', formData);
        Swal.fire({ icon: 'success', title: 'Created!', text: 'Department created successfully', timer: 1800, showConfirmButton: false });
      }
      fetchDepartments();
      resetForm();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error saving department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Department?',
      text: 'This action will remove the department record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete department'
    });
    
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/departments/${id}`);
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Department deleted successfully', timer: 1800, showConfirmButton: false });
        fetchDepartments();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error deleting department', 'error');
      }
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/departments/assign', assignData);
      Swal.fire({ icon: 'success', title: 'Assigned!', text: 'Employee assigned to department', timer: 1800, showConfirmButton: false });
      setShowAssignModal(false);
      setAssignData({ employeeId: '', departmentId: '' });
      fetchDepartments();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error assigning employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/departments/bulk-assign', bulkData);
      Swal.fire({ icon: 'success', title: 'Bulk Assigned!', text: `${bulkData.employeeIds.length} employees assigned successfully`, timer: 1800, showConfirmButton: false });
      setShowBulkModal(false);
      setBulkData({ employeeIds: [], departmentId: '' });
      fetchDepartments();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error in bulk assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedRows.length === 0) {
      Swal.fire('Warning', 'Please select departments first', 'warning');
      return;
    }
    try {
      await api.post('/api/departments/bulk-status', { departmentIds: selectedRows, status });
      Swal.fire({ icon: 'success', title: 'Updated!', text: `${selectedRows.length} departments updated`, timer: 1800, showConfirmButton: false });
      setSelectedRows([]);
      fetchDepartments();
    } catch (error) {
      Swal.fire('Error', 'Error updating departments', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      Swal.fire('Warning', 'Please select departments first', 'warning');
      return;
    }
    const result = await Swal.fire({
      title: 'Delete Departments?',
      text: `Are you sure you want to delete ${selectedRows.length} selected departments?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete selected'
    });
    
    if (result.isConfirmed) {
      try {
        await api.post('/api/departments/bulk-delete', { departmentIds: selectedRows });
        Swal.fire({ icon: 'success', title: 'Deleted!', text: `${selectedRows.length} departments deleted`, timer: 1800, showConfirmButton: false });
        setSelectedRows([]);
        fetchDepartments();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error deleting departments', 'error');
      }
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (transferData.fromDepartmentId === transferData.toDepartmentId) {
      Swal.fire('Error', 'Source and target departments cannot be the same', 'error');
      return;
    }
    if (transferData.employeeIds.length === 0) {
      Swal.fire('Error', 'Please select at least one employee to transfer', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/departments/transfer', transferData);
      Swal.fire({ icon: 'success', title: 'Transferred!', text: `${transferData.employeeIds.length} employee(s) transferred successfully`, timer: 1800, showConfirmButton: false });
      setShowTransferModal(false);
      setTransferData({ employeeIds: [], fromDepartmentId: '', toDepartmentId: '' });
      fetchDepartments();
      fetchEmployees();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error transferring employees', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      Swal.fire('Warning', 'Please select a file to import', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', importFile);
      const res = await api.post('/api/departments/import', form);
      Swal.fire({ icon: 'success', title: 'Import Complete!', text: `Imported ${res.data.results.success.length} departments` });
      setShowImportModal(false);
      setImportFile(null);
      fetchDepartments();
    } catch (error) {
      Swal.fire('Error', 'Error importing departments file', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleRowSelection = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredDepartments.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredDepartments.map(d => d._id));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', departmentHead: '', 
      parentDepartment: '', location: '' });
    setSelectedDept(null);
    setShowModal(false);
  };

  const editDepartment = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      departmentHead: dept.departmentHead?._id || '',
      parentDepartment: dept.parentDepartment?._id || '',
      location: dept.location || ''
    });
    setShowModal(true);
  };

  const viewDepartmentDetails = async (dept) => {
    setSelectedDept(dept);
    setShowDetailsModal(true);
    setDeptEmployees([]);
    try {
      const response = await api.get(`/api/departments/${dept._id}`);
      if (response.data.success && response.data.data.employees) {
        setDeptEmployees(response.data.data.employees);
      } else {
        setDeptEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching department employees:', error);
      setDeptEmployees([]);
    }
  };

  const handleRemoveEmployee = async (empId, empName) => {
    const result = await Swal.fire({
      title: 'Remove Employee?',
      html: `Remove <strong>${empName}</strong> from this department?<br/><small class="text-muted">Employee will remain in the system but unassigned from this department.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove employee'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/departments/${selectedDept._id}/employees/${empId}`);
        Swal.fire({ icon: 'success', title: 'Removed!', text: 'Employee removed from department', timer: 1800, showConfirmButton: false });
        const response = await api.get(`/api/departments/${selectedDept._id}`);
        if (response.data.success && response.data.data.employees) {
          setDeptEmployees(response.data.data.employees);
          setDepartments(prev => prev.map(d => 
            d._id === selectedDept._id ? { ...d, employeeCount: response.data.data.employees.length } : d
          ));
          setSelectedDept(prev => ({ ...prev, employeeCount: response.data.data.employees.length }));
        }
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to remove employee', 'error');
      }
    }
  };

  const exportToExcel = (selectedDepts = null) => {
    const dataToExport = selectedDepts || filteredDepartments;
    const data = dataToExport.map(d => ({
      Code: d.code,
      Name: d.name,
      Head: d.departmentHead ? `${d.departmentHead.firstName} ${d.departmentHead.lastName}` : 'N/A',
      Location: d.location || 'N/A',
      Employees: d.employeeCount,
      Status: d.status
    }));
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `departments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    Swal.fire({ icon: 'success', title: 'Report Exported 📊', text: 'Department list exported to CSV', timer: 1800, showConfirmButton: false });
    setShowExportModal(false);
  };

  const uniqueLocations = [...new Set(departments.map(d => d.location).filter(Boolean))].sort();

  // Metrics
  const totalEmployeesCount = departments.reduce((acc, curr) => acc + (curr.employeeCount || 0), 0);
  const activeDeptsCount = departments.filter(d => d.status === 'ACTIVE').length;
  const headedDeptsCount = departments.filter(d => d.departmentHead).length;

  return (
    <div className="departments-page-container">
      {/* Page Header */}
      <div className="dept-page-header">
        <div>
          <h1 className="dept-header-title">
            <div className="dept-header-icon">
              <i className="fas fa-sitemap"></i>
            </div>
            Department Management
          </h1>
          <p className="dept-header-subtitle">
            <span>Organizational structure & team alignment</span>
            <Badge bg="success" className="bg-emerald-light text-emerald border border-emerald px-2 py-1 rounded-pill">
              {filteredDepartments.length} Departments
            </Badge>
          </p>
        </div>

        <div className="dept-header-actions">
          <Button className="btn-dept-action btn-dept-primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus"></i> Add Department
          </Button>
          <Button className="btn-dept-action" onClick={() => setShowAssignModal(true)}>
            <i className="fas fa-user-plus text-primary"></i> Assign
          </Button>
          <Button className="btn-dept-action" onClick={() => setShowBulkModal(true)}>
            <i className="fas fa-users text-purple"></i> Bulk Assign
          </Button>
          <Button className="btn-dept-action" onClick={() => setShowTransferModal(true)}>
            <i className="fas fa-exchange-alt text-warning"></i> Transfer
          </Button>
          <Button className="btn-dept-action" onClick={() => setShowImportModal(true)}>
            <i className="fas fa-file-import text-info"></i> Import
          </Button>
          <Button className="btn-dept-action" onClick={() => setShowExportModal(true)}>
            <i className="fas fa-download text-emerald"></i> Export
          </Button>
        </div>
      </div>

      {/* Executive KPI Stats Dashboard */}
      <div className="dept-stats-grid">
        <div className="dept-stat-card">
          <div className="dept-stat-icon stat-icon-depts">
            <i className="fas fa-sitemap"></i>
          </div>
          <div className="dept-stat-info">
            <span className="dept-stat-label">Total Departments</span>
            <span className="dept-stat-value">{departments.length}</span>
            <span className="dept-stat-sub">Units registered</span>
          </div>
        </div>

        <div className="dept-stat-card">
          <div className="dept-stat-icon stat-icon-active">
            <i className="fas fa-building-circle-check"></i>
          </div>
          <div className="dept-stat-info">
            <span className="dept-stat-label">Active Units</span>
            <span className="dept-stat-value">{activeDeptsCount}</span>
            <span className="dept-stat-sub">Operational status</span>
          </div>
        </div>

        <div className="dept-stat-card">
          <div className="dept-stat-icon stat-icon-staff">
            <i className="fas fa-users"></i>
          </div>
          <div className="dept-stat-info">
            <span className="dept-stat-label">Assigned Staff</span>
            <span className="dept-stat-value">{totalEmployeesCount}</span>
            <span className="dept-stat-sub">Across departments</span>
          </div>
        </div>

        <div className="dept-stat-card">
          <div className="dept-stat-icon stat-icon-heads">
            <i className="fas fa-user-tie"></i>
          </div>
          <div className="dept-stat-info">
            <span className="dept-stat-label">Headed Units</span>
            <span className="dept-stat-value">{headedDeptsCount}</span>
            <span className="dept-stat-sub">With department head</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="dept-filter-bar">
        <div className="dept-filter-controls">
          <div className="dept-search-wrapper">
            <i className="fas fa-search"></i>
            <input
              type="text"
              className="dept-search-input"
              placeholder="Search by department name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="dept-select-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            className="dept-select-filter"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>

          <select
            className="dept-select-filter"
            value={filterHead}
            onChange={(e) => setFilterHead(e.target.value)}
          >
            <option value="">All Department Heads</option>
            {employees
              .filter(emp => departments.some(d => d.departmentHead?._id === emp._id))
              .map(emp => <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>)}
          </select>

          {(searchTerm || filterStatus || filterLocation || filterHead) && (
            <button 
              className="btn-reset-dept-filters"
              onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterLocation(''); setFilterHead(''); }}
            >
              <i className="fas fa-rotate-left"></i> Reset
            </button>
          )}
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedRows.length > 0 && (
          <div className="bulk-selection-bar">
            <span className="fw-semibold text-primary" style={{ fontSize: '0.875rem' }}>
              <i className="fas fa-check-double me-2"></i>{selectedRows.length} department(s) selected
            </span>
            <div className="bulk-action-btns">
              <Button variant="success" size="sm" onClick={() => handleBulkStatusChange('ACTIVE')} className="px-3">
                <i className="fas fa-check me-1"></i> Activate
              </Button>
              <Button variant="warning" size="sm" onClick={() => handleBulkStatusChange('INACTIVE')} className="px-3">
                <i className="fas fa-pause me-1"></i> Disable
              </Button>
              <Button variant="danger" size="sm" onClick={handleBulkDelete} className="px-3">
                <i className="fas fa-trash me-1"></i> Delete Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Department Data Grid */}
      <div className="dept-table-container">
        {loading ? (
          <SkeletonTable rows={10} columns={8} />
        ) : (
          <Table responsive className="dept-modern-table mb-0">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <Form.Check 
                    type="checkbox" 
                    checked={selectedRows.length === filteredDepartments.length && filteredDepartments.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th onClick={() => handleSort('code')} style={{ cursor: 'pointer' }}>
                  Code {sortField === 'code' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Department Name {sortField === 'name' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th>Department Head</th>
                <th>Location</th>
                <th onClick={() => handleSort('employeeCount')} style={{ cursor: 'pointer' }}>
                  Employees {sortField === 'employeeCount' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map(dept => (
                <tr key={dept._id}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Form.Check 
                      type="checkbox" 
                      checked={selectedRows.includes(dept._id)}
                      onChange={() => toggleRowSelection(dept._id)}
                    />
                  </td>
                  <td>
                    <span className="code-pill">{dept.code}</span>
                  </td>
                  <td>
                    <span className="dept-name-cell">{dept.name}</span>
                    {dept.description && (
                      <div className="text-muted small text-truncate" style={{ maxWidth: '240px' }}>{dept.description}</div>
                    )}
                  </td>
                  <td>
                    {dept.departmentHead ? (
                      <div className="head-chip">
                        <div className="head-avatar">
                          {dept.departmentHead.firstName?.charAt(0)}{dept.departmentHead.lastName?.charAt(0)}
                        </div>
                        <span>{dept.departmentHead.firstName} {dept.departmentHead.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-muted small">Not Assigned</span>
                    )}
                  </td>
                  <td>
                    {dept.location ? (
                      <span className="text-secondary small">
                        <i className="fas fa-location-dot me-1 text-emerald"></i>{dept.location}
                      </span>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                  </td>
                  <td>
                    <span className="count-pill">
                      <i className="fas fa-users me-1 text-muted" style={{ fontSize: '0.75rem' }}></i>
                      {dept.employeeCount || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge-pill ${dept.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      {dept.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="table-row-actions justify-content-end">
                      <button className="table-action-btn btn-view" onClick={() => viewDepartmentDetails(dept)} title="View Details">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="table-action-btn btn-edit" onClick={() => editDepartment(dept)} title="Edit Department">
                        <i className="fas fa-pen"></i>
                      </button>
                      <button className="table-action-btn btn-delete" onClick={() => handleDelete(dept._id)} title="Delete Department">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <i className="fas fa-building-circle-exclamation fa-3x mb-3 text-muted" style={{ opacity: 0.3 }}></i>
                    <h5 className="fw-bold text-dark mb-1">No Departments Found</h5>
                    <p className="text-muted small mb-0">Try changing your search terms or filter settings</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
            <Pagination.Prev onClick={() => setPage(page - 1)} disabled={page === 1} />
            {[...Array(totalPages)].map((_, i) => (
              <Pagination.Item key={i + 1} active={page === i + 1} onClick={() => setPage(i + 1)}>
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next onClick={() => setPage(page + 1)} disabled={page === totalPages} />
            <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
          </Pagination>
        </div>
      )}

      {/* ADD / EDIT DEPARTMENT MODAL */}
      <Modal show={showModal} onHide={resetForm} centered size="lg" className="dept-modal-styled">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            <i className="fas fa-building me-2"></i>
            {selectedDept ? 'Edit Department' : 'Add New Department'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Department Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Human Resources"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Department Code *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. HR"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Overview or responsibilities of this department"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Department Head</Form.Label>
                  <Form.Select
                    value={formData.departmentHead}
                    onChange={(e) => setFormData({ ...formData, departmentHead: e.target.value })}
                  >
                    <option value="">Select Department Head</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Parent Department</Form.Label>
                  <Form.Select
                    value={formData.parentDepartment}
                    onChange={(e) => setFormData({ ...formData, parentDepartment: e.target.value })}
                  >
                    <option value="">Select Parent Department (Optional)</option>
                    {departments.filter(d => d._id !== selectedDept?._id).map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Location</Form.Label>
              <Form.Select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                <option value="">Select Base Location</option>
                <option value="Office">Main Office</option>
                <option value="Remote">Remote Base</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8fafc' }}>
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={submitting} style={{ background: '#10b981', borderColor: '#10b981' }}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-1"></i> Save Department
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ASSIGN EMPLOYEE MODAL */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered className="dept-modal-styled">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            <i className="fas fa-user-plus me-2"></i> Assign Employee to Department
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAssign}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select Employee *</Form.Label>
              <Form.Select
                value={assignData.employeeId}
                onChange={(e) => setAssignData({ ...assignData, employeeId: e.target.value })}
                required
              >
                <option value="">Choose an employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} - {emp.email}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select Department *</Form.Label>
              <Form.Select
                value={assignData.departmentId}
                onChange={(e) => setAssignData({ ...assignData, departmentId: e.target.value })}
                required
              >
                <option value="">Choose a department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8fafc' }}>
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={submitting} style={{ background: '#10b981', borderColor: '#10b981' }}>
              {submitting ? 'Assigning...' : 'Assign Employee'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* BULK ASSIGN MODAL */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered size="lg" className="dept-modal-styled">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            <i className="fas fa-users me-2"></i> Bulk Assign Employees
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleBulkAssign}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select Employees *</Form.Label>
              <div className="bg-white border rounded-3 p-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                <Form.Select 
                  multiple 
                  size={6} 
                  value={bulkData.employeeIds}
                  onChange={(e) => setBulkData({...bulkData, employeeIds: Array.from(e.target.selectedOptions, opt => opt.value)})} 
                  required
                  style={{ border: 'none' }}
                >
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id} className="py-2 px-3">
                      👤 {emp.firstName} {emp.lastName} ({emp.email})
                    </option>
                  ))}
                </Form.Select>
              </div>
              <Form.Text className="text-muted mt-1 d-block">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple employees
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Target Department *</Form.Label>
              <Form.Select 
                value={bulkData.departmentId}
                onChange={(e) => setBulkData({...bulkData, departmentId: e.target.value})} 
                required
              >
                <option value="">Choose department</option>
                {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>)}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8fafc' }}>
            <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={submitting} style={{ background: '#10b981', borderColor: '#10b981' }}>
              {submitting ? 'Assigning...' : `Assign ${bulkData.employeeIds.length} Employees`}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* TRANSFER EMPLOYEES MODAL */}
      <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)} centered size="lg" className="dept-modal-styled">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            <i className="fas fa-exchange-alt me-2"></i> Transfer Employees
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTransfer}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">From Department *</Form.Label>
              <Form.Select 
                value={transferData.fromDepartmentId}
                onChange={(e) => setTransferData({...transferData, fromDepartmentId: e.target.value, employeeIds: []})} 
                required
              >
                <option value="">Select source department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code}) - {dept.employeeCount || 0} staff
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            {transferData.fromDepartmentId && (() => {
              const filteredEmployees = employees.filter(emp => {
                const empDeptId = emp.department?._id || emp.department;
                return empDeptId && empDeptId.toString() === transferData.fromDepartmentId.toString();
              });
              
              return (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Select Employees to Transfer * ({filteredEmployees.length} available)</Form.Label>
                  {filteredEmployees.length === 0 ? (
                    <div className="alert alert-warning py-2 mb-0">
                      No employees found in selected department
                    </div>
                  ) : (
                    <div className="bg-white border rounded-3 p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <Form.Select 
                        multiple 
                        size={5} 
                        value={transferData.employeeIds}
                        onChange={(e) => setTransferData({...transferData, employeeIds: Array.from(e.target.selectedOptions, opt => opt.value)})} 
                        required
                        style={{ border: 'none' }}
                      >
                        {filteredEmployees.map(emp => (
                          <option key={emp._id} value={emp._id} className="py-1 px-2">
                            👤 {emp.firstName} {emp.lastName} {emp.designation ? `- ${emp.designation}` : ''}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  )}
                </Form.Group>
              );
            })()}
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">To Department *</Form.Label>
              <Form.Select 
                value={transferData.toDepartmentId}
                onChange={(e) => setTransferData({...transferData, toDepartmentId: e.target.value})} 
                required
              >
                <option value="">Select target department</option>
                {departments
                  .filter(d => d._id !== transferData.fromDepartmentId)
                  .map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8fafc' }}>
            <Button variant="secondary" onClick={() => setShowTransferModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              type="submit" 
              disabled={submitting || !transferData.fromDepartmentId || !transferData.toDepartmentId || transferData.employeeIds.length === 0}
              style={{ background: '#10b981', borderColor: '#10b981' }}
            >
              {submitting ? 'Transferring...' : 'Transfer Employees'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* IMPORT MODAL */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} centered className="dept-modal-styled">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold"><i className="fas fa-file-import me-2"></i> Import Departments</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleImport}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Upload Excel / CSV File *</Form.Label>
              <Form.Control type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files[0])} required />
              <Form.Text className="text-muted mt-1 d-block">Required headers: name, code, description, location, status</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8fafc' }}>
            <Button variant="secondary" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button variant="success" type="submit" disabled={submitting} style={{ background: '#10b981', borderColor: '#10b981' }}>
              {submitting ? 'Importing...' : 'Upload & Import'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered className="dept-modal-styled">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold"><i className="fas fa-download me-2"></i> Export Department Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-3">
            <Button variant="outline-primary" className="py-2 font-weight-bold" onClick={() => exportToExcel()}>
              <i className="fas fa-file-csv me-2"></i> Export All Departments ({filteredDepartments.length})
            </Button>
            <Button variant="outline-success" className="py-2 font-weight-bold" onClick={() => {
              if (selectedRows.length === 0) {
                Swal.fire('Warning', 'Please select departments first', 'warning');
                return;
              }
              const selected = filteredDepartments.filter(d => selectedRows.includes(d._id));
              exportToExcel(selected);
            }}>
              <i className="fas fa-check-square me-2"></i> Export Selected Departments ({selectedRows.length})
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ background: '#f8fafc' }}>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* DEPARTMENT DETAILS MODAL */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="lg" className="dept-modal-styled">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            <i className="fas fa-building me-2"></i> Department Overview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedDept && (
            <div>
              {/* Header Section */}
              <div className="p-4 bg-emerald-light border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <div className="dept-header-icon">
                      <i className="fas fa-building"></i>
                    </div>
                    <div>
                      <h3 className="fw-bold text-dark mb-0">{selectedDept.name}</h3>
                      <span className="code-pill me-2">{selectedDept.code}</span>
                      <span className={`status-badge-pill ${selectedDept.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {selectedDept.status}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedDept.description && (
                  <p className="text-secondary small mt-3 mb-0">{selectedDept.description}</p>
                )}
              </div>

              {/* Roster & Info Grid */}
              <div className="p-4">
                <Row className="g-3 mb-4">
                  <Col md={4}>
                    <div className="bg-white border rounded-3 p-3">
                      <div className="text-muted small fw-bold text-uppercase">Department Head</div>
                      <div className="fw-bold text-dark mt-1">
                        {selectedDept.departmentHead ? `${selectedDept.departmentHead.firstName} ${selectedDept.departmentHead.lastName}` : 'Unassigned'}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="bg-white border rounded-3 p-3">
                      <div className="text-muted small fw-bold text-uppercase">Location</div>
                      <div className="fw-bold text-dark mt-1">
                        {selectedDept.location || 'Not Specified'}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="bg-white border rounded-3 p-3">
                      <div className="text-muted small fw-bold text-uppercase">Assigned Staff</div>
                      <div className="fw-bold text-emerald fs-5 mt-1">
                        {selectedDept.employeeCount || 0} Members
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Staff Roster */}
                <div className="bg-white border rounded-3 p-3">
                  <h6 className="fw-bold text-dark mb-3">
                    <i className="fas fa-users text-emerald me-2"></i> Department Roster ({deptEmployees.length})
                  </h6>
                  {deptEmployees.length > 0 ? (
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {deptEmployees.map((emp, idx) => (
                        <div key={idx} className="d-flex align-items-center justify-content-between p-2 border-bottom hover-bg-light">
                          <div className="d-flex align-items-center gap-2">
                            <div className="head-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                              {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div className="fw-bold text-dark small">{emp.firstName} {emp.lastName}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{emp.designation || emp.email}</div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline-danger" 
                            className="py-0 px-2" 
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleRemoveEmployee(emp._id, `${emp.firstName} ${emp.lastName}`)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted small">
                      No employees assigned to this department
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: '#f8fafc' }}>
          <Button variant="primary" size="sm" onClick={() => { setShowDetailsModal(false); editDepartment(selectedDept); }}>
            <i className="fas fa-pen me-1"></i> Edit Department
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Departments;
