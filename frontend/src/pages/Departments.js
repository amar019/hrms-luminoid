import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Table, Badge, Container, Row, Col } from 'react-bootstrap';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [formData, setFormData] = useState({
    name: '', code: '', description: '', departmentHead: '', 
    parentDepartment: '', location: ''
  });
  const [assignData, setAssignData] = useState({ employeeId: '', departmentId: '' });

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

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
    setFilteredDepartments(filtered);
  }, [departments, searchTerm, filterStatus, filterLocation]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/api/departments');
      setDepartments(res.data.data);
      setFilteredDepartments(res.data.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data.data || res.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedDept) {
        await api.put(`/api/departments/${selectedDept._id}`, formData);
        toast.success('Department updated successfully');
      } else {
        await api.post('/api/departments', formData);
        toast.success('Department created successfully');
      }
      fetchDepartments();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving department');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/api/departments/${id}`);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting department');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/departments/assign', assignData);
      toast.success('Employee assigned successfully');
      setShowAssignModal(false);
      setAssignData({ employeeId: '', departmentId: '' });
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error assigning employee');
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

  const exportToExcel = () => {
    const data = filteredDepartments.map(d => ({
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
    toast.success('Report exported successfully');
  };

  const uniqueLocations = [...new Set(departments.map(d => d.location).filter(Boolean))];

  return (
    <Container fluid className="p-4" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <style>{`
        .dept-header {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 4px 15px rgba(30, 60, 114, 0.3);
        }
        .dept-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .dept-table thead {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
        }
        .dept-table thead th {
          border: none;
          padding: 15px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }
        .dept-table tbody tr {
          transition: all 0.3s ease;
        }
        .dept-table tbody tr:hover {
          background: #f0f4f8;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .dept-table tbody td {
          padding: 18px 15px;
          vertical-align: middle;
        }
        .btn-add-dept {
          background: #6366f1;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-add-dept:hover {
          background: #4f46e5;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }
        .btn-assign {
          background: #10b981;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-assign:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        .badge-code {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
        }
        .badge-count {
          background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
        }
        .action-btn-edit {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          color: white;
          transition: all 0.3s ease;
        }
        .action-btn-edit:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.4);
        }
        .action-btn-delete {
          background: linear-gradient(135deg, #c33764 0%, #1d2671 100%);
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          color: white;
          transition: all 0.3s ease;
        }
        .action-btn-delete:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(195, 55, 100, 0.4);
        }
      `}</style>

      <div className="dept-header text-white">
        <Row className="align-items-center">
          <Col md={8}>
            <h2 className="mb-2 fw-bold">
              <i className="fas fa-sitemap me-3"></i>Department Management
            </h2>
            <p className="mb-0 opacity-90">
              <i className="fas fa-building me-2"></i>
              {filteredDepartments.length} of {departments.length} Departments
            </p>
          </Col>
          <Col md={4} className="text-md-end">
            <Button className="btn-add-dept me-2" size="sm" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus me-2"></i>Add
            </Button>
            <Button className="btn-assign me-2" size="sm" onClick={() => setShowAssignModal(true)}>
              <i className="fas fa-user-plus me-2"></i>Assign
            </Button>
            <Button style={{ background: '#f59e0b', border: 'none', borderRadius: '8px', padding: '8px 16px' }} size="sm" onClick={exportToExcel}>
              <i className="fas fa-download me-2"></i>Export
            </Button>
          </Col>
        </Row>
      </div>

      <Card className="dept-card mb-3">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
            </Col>
            <Col md={3}>
              <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ borderRadius: '8px' }}>
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} style={{ borderRadius: '8px' }}>
                <option value="">All Locations</option>
                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="outline-secondary" onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterLocation(''); }} style={{ borderRadius: '8px', width: '100%' }}>
                <i className="fas fa-redo me-2"></i>Reset
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="dept-card">
        <Card.Body className="p-0">
          <Table responsive className="dept-table mb-0">
            <thead>
              <tr>
                <th>Code</th>
                <th>Department Name</th>
                <th>Department Head</th>
                <th>Location</th>
                <th>Employees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map(dept => (
                <tr key={dept._id}>
                  <td><Badge className="badge-code">{dept.code}</Badge></td>
                  <td><strong style={{ color: '#1e3c72' }}>{dept.name}</strong></td>
                  <td>
                    {dept.departmentHead ? (
                      <div style={{ color: '#555' }}>
                        <i className="fas fa-user-tie me-2" style={{ color: '#1e3c72' }}></i>
                        {dept.departmentHead.firstName} {dept.departmentHead.lastName}
                      </div>
                    ) : <span className="text-muted">Not Assigned</span>}
                  </td>
                  <td>
                    {dept.location ? (
                      <span>
                        <i className="fas fa-map-marker-alt me-2" style={{ color: '#1e3c72' }}></i>
                        {dept.location}
                      </span>
                    ) : <span className="text-muted">-</span>}
                  </td>
                  <td>
                    <Badge className="badge-count">{dept.employeeCount}</Badge>
                  </td>
                  <td>
                    <Badge bg={dept.status === 'ACTIVE' ? 'success' : 'danger'} style={{ padding: '6px 12px', borderRadius: '6px' }}>
                      {dept.status}
                    </Badge>
                  </td>
                  <td>
                    <Button className="action-btn-edit me-2" size="sm" onClick={() => editDepartment(dept)}>
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button className="action-btn-delete" size="sm" onClick={() => handleDelete(dept._id)}>
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <i className="fas fa-inbox fa-3x mb-3" style={{ color: '#1e3c72', opacity: 0.3 }}></i>
                    <h5 className="text-muted">No departments found</h5>
                    <p className="text-muted">Try adjusting your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={resetForm} centered size="lg">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white', border: 'none' }}>
          <Modal.Title>
            <i className="fas fa-building me-2"></i>
            {selectedDept ? 'Edit Department' : 'Add New Department'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '30px' }}>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Department Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Human Resources"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ borderRadius: '8px', padding: '10px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Department Code *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., HR"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    style={{ borderRadius: '8px', padding: '10px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Brief description of the department"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ borderRadius: '8px', padding: '10px' }}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Department Head</Form.Label>
                  <Form.Select
                    value={formData.departmentHead}
                    onChange={(e) => setFormData({ ...formData, departmentHead: e.target.value })}
                    style={{ borderRadius: '8px', padding: '10px' }}
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
                    style={{ borderRadius: '8px', padding: '10px' }}
                  >
                    <option value="">Select Parent Department</option>
                    {departments.filter(d => d._id !== selectedDept?._id).map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Building A, Floor 3"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{ borderRadius: '8px', padding: '10px' }}
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={resetForm} style={{ borderRadius: '8px', padding: '10px 24px' }}>
                <i className="fas fa-times me-2"></i>Cancel
              </Button>
              <Button type="submit" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', border: 'none', borderRadius: '8px', padding: '10px 24px' }}>
                <i className="fas fa-save me-2"></i>Save Department
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Assign Employee Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', color: 'white', border: 'none' }}>
          <Modal.Title>
            <i className="fas fa-user-plus me-2"></i>
            Assign Employee to Department
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '30px' }}>
          <Form onSubmit={handleAssign}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select Employee *</Form.Label>
              <Form.Select
                value={assignData.employeeId}
                onChange={(e) => setAssignData({ ...assignData, employeeId: e.target.value })}
                required
                style={{ borderRadius: '8px', padding: '10px' }}
              >
                <option value="">Choose an employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} - {emp.email}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Select Department *</Form.Label>
              <Form.Select
                value={assignData.departmentId}
                onChange={(e) => setAssignData({ ...assignData, departmentId: e.target.value })}
                required
                style={{ borderRadius: '8px', padding: '10px' }}
              >
                <option value="">Choose a department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowAssignModal(false)} style={{ borderRadius: '8px', padding: '10px 24px' }}>
                <i className="fas fa-times me-2"></i>Cancel
              </Button>
              <Button type="submit" style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', border: 'none', borderRadius: '8px', padding: '10px 24px' }}>
                <i className="fas fa-check me-2"></i>Assign
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Departments;
