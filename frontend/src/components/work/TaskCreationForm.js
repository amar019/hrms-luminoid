import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import api from '../../utils/api';


const TASK_TYPES = [
  'DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'DEPLOYMENT', 'BUG_FIX', 'DOCUMENTATION', 
  'INTERVIEW', 'ONBOARDING', 'TRAINING', 'CLIENT_MEETING', 'LEAD_VISIT', 'OTHER'
];

export default function TaskCreationForm({ show, onHide, onTaskCreated, editTask = null }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const initialForm = {
    title: '', description: '', department: '', taskType: 'DEVELOPMENT',
    assignedTo: [], scheduledDate: '', dueDate: '', estimatedHours: '', 
    priority: 'MEDIUM', project: '', workLocation: 'OFFICE'
  };
  
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (editTask) {
      setForm({
        ...editTask,
        scheduledDate: editTask.scheduledDate ? new Date(editTask.scheduledDate).toISOString().split('T')[0] : '',
        dueDate: editTask.dueDate ? new Date(editTask.dueDate).toISOString().split('T')[0] : '',
        assignedTo: editTask.assignedTo.map(e => e._id)
      });
    } else {
      setForm(initialForm);
    }
  }, [editTask, show]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data);
    } catch (e) { console.error("Error fetching employees"); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/api/departments');
      if (res.data && res.data.data) {
        setDepartments(res.data.data.filter(d => d.status === 'ACTIVE'));
      }
    } catch (e) { console.error("Error fetching departments"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.assignedTo.length === 0) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please assign to at least one employee' });
      return;
    }

    setLoading(true);
    try {
      let res;
      if (editTask) {
        res = await api.put(`/api/tasks/${editTask._id}`, form);
        Swal.fire({ icon: 'success', title: 'Success', text: 'Task updated successfully', timer: 2000, showConfirmButton: false });
      } else {
        res = await api.post('/api/tasks', form);
        Swal.fire({ icon: 'success', title: 'Success', text: 'Task created successfully', timer: 2000, showConfirmButton: false });
      }
      onTaskCreated(res.data);
      onHide();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Error saving task' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" contentClassName="modern-modal">
      <Modal.Header closeButton style={{ borderBottom: '1px solid var(--wm-border)', padding: '1.5rem' }}>
        <Modal.Title style={{ fontWeight: 700, color: 'var(--wm-text-primary)' }}>
          {editTask ? 'Edit Task' : 'Create New Task'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '2rem' }}>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label className="modern-label">Task Title</Form.Label>
            <Form.Control 
              type="text" 
              required
              className="modern-input"
              placeholder="e.g., Update Authentication Flow"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
            />
          </Form.Group>

          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="modern-label">Department</Form.Label>
                <Form.Select className="modern-input" required value={form.department} onChange={(e) => setForm({...form, department: e.target.value})}>
                  <option value="">Select Department...</option>
                  {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="modern-label">Project</Form.Label>
                <Form.Control type="text" className="modern-input" placeholder="e.g., Q3 Mobile App" value={form.project} onChange={(e) => setForm({...form, project: e.target.value})} />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="modern-label">Task Type</Form.Label>
                <Form.Select className="modern-input" value={form.taskType} onChange={(e) => setForm({...form, taskType: e.target.value})}>
                  {TASK_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="modern-label">Priority</Form.Label>
                <Form.Select className="modern-input" value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="modern-label">Work Location</Form.Label>
                <Form.Select className="modern-input" value={form.workLocation} onChange={(e) => setForm({...form, workLocation: e.target.value})}>
                  <option value="OFFICE">Office</option>
                  <option value="REMOTE">Remote</option>
                  <option value="FIELD">Field / Client Site</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label className="modern-label">Description</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3}
              className="modern-input"
              placeholder="Provide detailed instructions..."
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
            />
          </Form.Group>

          <Row className="mb-4">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="modern-label">Start Date</Form.Label>
                <Form.Control type="date" required className="modern-input" value={form.scheduledDate} onChange={(e) => setForm({...form, scheduledDate: e.target.value})} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="modern-label">Due Date</Form.Label>
                <Form.Control type="date" className="modern-input" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="modern-label">Estimated Hours</Form.Label>
                <Form.Control type="number" className="modern-input" placeholder="e.g., 8" value={form.estimatedHours} onChange={(e) => setForm({...form, estimatedHours: e.target.value})} />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label className="modern-label">Assign To</Form.Label>
            <div className="modern-assignee-list" style={{maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--wm-border)', borderRadius: '8px', padding: '0.5rem'}}>
              {employees.map(emp => (
                <Form.Check 
                  key={emp._id}
                  type="checkbox"
                  id={`assign-${emp._id}`}
                  label={`${emp.firstName} ${emp.lastName} (${emp.department || 'N/A'})`}
                  checked={form.assignedTo.includes(emp._id)}
                  onChange={(e) => {
                    const newAssigned = e.target.checked 
                      ? [...form.assignedTo, emp._id]
                      : form.assignedTo.filter(id => id !== emp._id);
                    setForm({...form, assignedTo: newAssigned});
                  }}
                  className="mb-2"
                />
              ))}
            </div>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--wm-border)' }}>
            <Button variant="light" onClick={onHide} style={{ borderRadius: '8px', fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading} style={{ borderRadius: '8px', fontWeight: 600, background: 'var(--wm-primary)', border: 'none' }}>
              {loading ? 'Saving...' : (editTask ? 'Save Changes' : 'Create Task')}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

