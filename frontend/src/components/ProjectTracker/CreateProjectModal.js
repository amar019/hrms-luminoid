import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../../utils/api';


function CreateProjectModal({ show, onHide, onProjectCreated, projectToEdit, onProjectUpdated }) {
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    leader: '',
    members: [],
    startDate: '',
    endDate: '',
    priority: 'MEDIUM',
    status: 'Planning'
  });

  useEffect(() => {
    if (show) {
      fetchEmployees();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      if (projectToEdit) {
        setFormData({
          name: projectToEdit.name || '',
          code: projectToEdit.code || '',
          description: projectToEdit.description || '',
          leader: projectToEdit.leader?._id || projectToEdit.leader || '',
          members: projectToEdit.members?.map(m => m._id || m) || [],
          startDate: projectToEdit.startDate ? new Date(projectToEdit.startDate).toISOString().substring(0, 10) : '',
          endDate: projectToEdit.endDate ? new Date(projectToEdit.endDate).toISOString().substring(0, 10) : '',
          priority: projectToEdit.priority || 'MEDIUM',
          status: projectToEdit.status || 'Planning'
        });
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          leader: '',
          members: [],
          startDate: '',
          endDate: '',
          priority: 'MEDIUM',
          status: 'Planning'
        });
      }
    }
  }, [show, projectToEdit]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load employee directory' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.leader) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please fill in Project Name, Code and Leader' });
      return;
    }

    setSubmitting(true);
    try {
      if (projectToEdit) {
        await api.put(`/api/projects/${projectToEdit._id}`, formData);
        Swal.fire({ icon: 'success', title: 'Success', text: 'Project updated successfully', timer: 2000, showConfirmButton: false });
        if (onProjectUpdated) onProjectUpdated();
      } else {
        await api.post('/api/projects', formData);
        Swal.fire({ icon: 'success', title: 'Success', text: 'Project created successfully', timer: 2000, showConfirmButton: false });
        if (onProjectCreated) onProjectCreated();
      }
      onHide();
      setFormData({
        name: '',
        code: '',
        description: '',
        leader: '',
        members: [],
        startDate: '',
        endDate: '',
        priority: 'MEDIUM',
        status: 'Planning'
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || `Failed to ${projectToEdit ? 'update' : 'create'} project` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" className="tracker-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="border-0 px-4 py-4" style={{ backgroundColor: '#5DCD9A' }}>
          <div>
            <Modal.Title style={{ fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
              {projectToEdit ? 'Edit Project' : 'Create New Project'}
            </Modal.Title>
            <p className="mb-0 mt-1" style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.9)' }}>
              {projectToEdit ? 'Update the details and team members for this project.' : 'Set up a new workspace and assign your team members.'}
            </p>
          </div>
          <button type="button" className="btn-close btn-close-white shadow-none" onClick={onHide} style={{ alignSelf: 'flex-start' }}></button>
        </Modal.Header>

        <Modal.Body className="px-4 py-3">
          <div className="bg-white rounded-4 p-4 shadow-sm border" style={{ borderColor: '#F3F4F6' }}>
            <Row className="g-4 mb-4">
              <Col md={8}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>Project Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="e.g. Luminoid Core Hub"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-light border-0 shadow-none px-3 py-2"
                    style={{ borderRadius: '10px', fontSize: '14.5px', color: '#111827' }}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>Project Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="e.g. LMS"
                    maxLength={10}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="bg-light border-0 shadow-none px-3 py-2 text-uppercase"
                    style={{ borderRadius: '10px', fontSize: '14.5px', color: '#111827', fontWeight: 600 }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>Project Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Briefly outline the project scope, goals, and deliverables..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-light border-0 shadow-none px-3 py-2"
                style={{ borderRadius: '10px', fontSize: '14.5px', color: '#111827', resize: 'none' }}
              />
            </Form.Group>

            <Row className="g-4 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>Project Leader <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    required
                    value={formData.leader}
                    onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                    className="bg-light border-0 shadow-none px-3 py-2"
                    style={{ borderRadius: '10px', fontSize: '14.5px', color: '#111827', cursor: 'pointer' }}
                  >
                    <option value="">-- Assign a Team Leader --</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>Priority Level</Form.Label>
                  <Form.Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="bg-light border-0 shadow-none px-3 py-2"
                    style={{ borderRadius: '10px', fontSize: '14.5px', color: '#111827', cursor: 'pointer' }}
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical Priority</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-light border-0 shadow-none px-3 py-2"
                    style={{ borderRadius: '10px', fontSize: '14.5px', color: '#111827' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>Target End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="bg-light border-0 shadow-none px-3 py-2"
                    style={{ borderRadius: '10px', fontSize: '14.5px', color: '#111827' }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Assign Team Members</Form.Label>
              <div 
                className="d-flex flex-column gap-2 pe-2 custom-scrollbar" 
                style={{ maxHeight: '220px', overflowY: 'auto' }}
              >
                {employees.map(emp => {
                  const isSelected = formData.members.includes(emp._id);
                  return (
                    <label 
                      key={emp._id} 
                      className={`d-flex align-items-center p-2 rounded-3 transition-all ${isSelected ? 'bg-success-subtle' : 'bg-light'}`}
                      style={{ cursor: 'pointer', border: isSelected ? '1px solid #5DCD9A' : '1px solid transparent' }}
                    >
                      <Form.Check
                        type="checkbox"
                        className="me-3 ms-2 mb-0"
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                        checked={isSelected}
                        onChange={(e) => {
                          const selected = [...formData.members];
                          if (e.target.checked) {
                            selected.push(emp._id);
                          } else {
                            const idx = selected.indexOf(emp._id);
                            if (idx > -1) selected.splice(idx, 1);
                          }
                          setFormData({ ...formData, members: selected });
                        }}
                      />
                      <div className="d-flex align-items-center gap-2">
                        {emp.profileImage ? (
                          <img src={emp.profileImage} alt={emp.firstName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center bg-secondary text-white" style={{ width: '32px', height: '32px', borderRadius: '50%', fontSize: '12px', fontWeight: 600 }}>
                            {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', lineHeight: '1.2' }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: '11.5px', color: '#6B7280' }}>{emp.designation || emp.email}</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
                {employees.length === 0 && (
                  <div className="text-center text-muted py-3" style={{ fontSize: '13px' }}>Loading employees...</div>
                )}
              </div>
            </Form.Group>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 px-4 pb-4 pt-0">
          <Button 
            variant="light" 
            onClick={onHide} 
            className="border-0 shadow-none"
            style={{ fontWeight: 600, borderRadius: '8px', padding: '10px 20px', backgroundColor: '#F3F4F6', color: '#4B5563' }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="border-0 shadow-sm" 
            disabled={submitting}
            style={{ fontWeight: 600, borderRadius: '8px', padding: '10px 24px', backgroundColor: '#5DCD9A', color: 'white' }}
          >
            {submitting ? (projectToEdit ? 'Saving...' : 'Creating...') : (projectToEdit ? 'Save Changes' : 'Create Project')}
          </Button>
        </Modal.Footer>
      </Form>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
        }
      `}</style>
    </Modal>
  );
}

export default CreateProjectModal;
