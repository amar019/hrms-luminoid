import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../../utils/api';


function CreateTaskModal({ show, onHide, projectId, onTaskCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState(null);
  const [allowedOwners, setAllowedOwners] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  
  const [formData, setFormData] = useState({
    project: projectId || '',
    module: '',
    title: '',
    description: '',
    type: 'Frontend',
    owner: '',
    status: 'Pending',
    progressPercent: 0,
    priority: 'Medium',
    eta: '',
    blocker: '',
    dependency: '',
    impact: 'Medium',
    notes: ''
  });

  useEffect(() => {
    if (show) {
      fetchProjects();
      fetchAllEmployees();
      if (projectId) {
        fetchProjectTeam(projectId);
        setFormData(prev => ({ ...prev, project: projectId, owner: '' }));
      } else {
        setProject(null);
        setFormData(prev => ({ ...prev, project: '', owner: '' }));
      }
    }
  }, [show, projectId]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/projects');
      setProjectsList(res.data);
    } catch (e) {
      console.error('Failed to load projects list');
    }
  };

  const fetchProjectTeam = async (projId) => {
    try {
      const res = await api.get(`/api/projects/${projId}`);
      setProject(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load project details' });
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setAllowedOwners(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load employee directory' });
    }
  };

  const handleProjectChange = (projId) => {
    setFormData(prev => ({ ...prev, project: projId, owner: '' }));
    if (projId) {
      fetchProjectTeam(projId);
    } else {
      setProject(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.module.trim() || !formData.owner || !formData.eta) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please enter Title, Module, Owner and ETA' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.project || payload.project === 'general') {
        delete payload.project;
      }
      await api.post('/api/project-tasks', payload);
      Swal.fire({ icon: 'success', title: 'Success', text: 'Task created successfully', timer: 2000, showConfirmButton: false });
      onTaskCreated();
      onHide();
      setFormData({
        project: projectId || '',
        module: '',
        title: '',
        description: '',
        type: 'Frontend',
        owner: '',
        status: 'Pending',
        progressPercent: 0,
        priority: 'Medium',
        eta: '',
        blocker: '',
        dependency: '',
        impact: 'Medium',
        notes: ''
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to create task' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="tracker-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '18px', fontWeight: 700 }}>Assign New Task</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ padding: '24px 32px' }}>
          {!project ? (
            <div className="d-flex align-items-center gap-2 mb-3 p-3 rounded" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE' }}>
              <i className="fas fa-tasks text-primary" style={{ fontSize: '18px' }}></i>
              <div>
                <span style={{ fontSize: '13px', color: '#1E40AF', fontWeight: 600 }}>
                  You are assigning a <span style={{ color: '#1D4ED8', fontWeight: 700 }}>General Task</span> (no project linked).
                </span>
              </div>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 mb-3 p-3 rounded" style={{ background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)', border: '1px solid #A7F3D0' }}>
              <i className="fas fa-project-diagram" style={{ color: '#059669', fontSize: '18px' }}></i>
              <div>
                <span style={{ fontSize: '13px', color: '#065F46', fontWeight: 600 }}>
                  You are assigning a task to <span style={{ color: '#047857', fontWeight: 700 }}>{project.name}</span>
                </span>
                <span className="ms-2 badge" style={{ background: '#D1FAE5', color: '#065F46', fontSize: '10.5px', fontWeight: 600 }}>
                  {project.code}
                </span>
              </div>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Project *</Form.Label>
            <Form.Select
              value={formData.project}
              onChange={(e) => handleProjectChange(e.target.value)}
              style={{ borderRadius: '6px' }}
            >
              <option value="">-- General --</option>
              {projectsList.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Task Title *</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="e.g. Implement login API integration"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ borderRadius: '6px' }}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Module Name *</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="e.g. Authentication"
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  style={{ borderRadius: '6px' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Outline the detailed tasks and instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ borderRadius: '6px' }}
            />
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Task Type *</Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ borderRadius: '6px' }}
                >
                  <optgroup label="Development">
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Frontend + Backend">Frontend + Backend</option>
                    <option value="Full Stack">Full Stack</option>
                    <option value="API Integration">API Integration</option>
                    <option value="Database">Database</option>
                  </optgroup>
                  <optgroup label="Quality & Deployment">
                    <option value="Testing">Testing</option>
                    <option value="QA">QA</option>
                    <option value="Bug Fix">Bug Fix</option>
                    <option value="Deployment">Deployment</option>
                    <option value="DevOps">DevOps</option>
                  </optgroup>
                  <optgroup label="Design">
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Graphic Design">Graphic Design</option>
                    <option value="Wireframing">Wireframing</option>
                  </optgroup>
                  <optgroup label="HR & Admin">
                    <option value="Recruitment">Recruitment</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Training">Training</option>
                    <option value="Policy & Compliance">Policy & Compliance</option>
                    <option value="Employee Engagement">Employee Engagement</option>
                  </optgroup>
                  <optgroup label="Sales & Marketing">
                    <option value="Lead Generation">Lead Generation</option>
                    <option value="Client Follow-up">Client Follow-up</option>
                    <option value="Sales Pitch/Demo">Sales Pitch/Demo</option>
                    <option value="Marketing Campaign">Marketing Campaign</option>
                    <option value="SEO/Content">SEO/Content</option>
                    <option value="Social Media">Social Media</option>
                  </optgroup>
                  <optgroup label="Finance & Operations">
                    <option value="Accounting">Accounting</option>
                    <option value="Invoicing">Invoicing</option>
                    <option value="Reporting">Reporting</option>
                    <option value="Operations">Operations</option>
                    <option value="Vendor Management">Vendor Management</option>
                  </optgroup>
                  <optgroup label="General">
                    <option value="Research">Research</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Meeting/Discussion">Meeting/Discussion</option>
                    <option value="Extra Feature">Extra Feature</option>
                    <option value="Support">Support</option>
                    <option value="Other">Other</option>
                  </optgroup>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>
                  {project ? 'Owner (Project Member) *' : 'Owner (Employee) *'}
                </Form.Label>
                <Form.Select
                  required
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  style={{ borderRadius: '6px' }}
                >
                  <option value="">-- Choose Member --</option>
                  {allowedOwners.map(u => (
                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.role || u.designation})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Priority</Form.Label>
                <Form.Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{ borderRadius: '6px' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>ETA (Due Date) *</Form.Label>
                <Form.Control
                  required
                  type="date"
                  value={formData.eta}
                  onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                  style={{ borderRadius: '6px' }}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Impact</Form.Label>
                <Form.Select
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  style={{ borderRadius: '6px' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Status</Form.Label>
                <Form.Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ borderRadius: '6px' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>


          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ borderRadius: '6px' }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} style={{ fontWeight: 600 }}>Cancel</Button>
          <Button type="submit" className="btn-emerald" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default CreateTaskModal;
