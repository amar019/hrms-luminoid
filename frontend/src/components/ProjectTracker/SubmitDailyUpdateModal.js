import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../../utils/api';

import { useAuth } from '../../context/AuthContext';

function SubmitDailyUpdateModal({ show, onHide, preselectedProjectId, preselectedTaskId, updateToEdit, onUpdateSubmitted }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectId: (preselectedProjectId === 'general' ? '' : preselectedProjectId) || '',
    taskId: preselectedTaskId || '',
    module: '',
    taskType: '',
    workDone: '',
    hoursWorked: '',
    progressPercent: 0,
    blockers: '',
    tomorrowPlan: '',
    remarks: '',
    date: new Date().toISOString().substring(0, 10)
  });

  useEffect(() => {
    if (show) {
      if (updateToEdit) {
        const pId = updateToEdit.projectId?._id || updateToEdit.projectId || '';
        setFormData({
          projectId: pId === 'general' ? '' : pId,
          taskId: updateToEdit.taskId?._id || updateToEdit.taskId || '',
          module: updateToEdit.module || '',
          taskType: updateToEdit.taskType || '',
          workDone: updateToEdit.workDone || '',
          hoursWorked: updateToEdit.hoursWorked || '',
          progressPercent: updateToEdit.progressPercent || 0,
          blockers: updateToEdit.blockers || '',
          tomorrowPlan: updateToEdit.tomorrowPlan || '',
          remarks: updateToEdit.remarks || '',
          date: updateToEdit.date ? new Date(updateToEdit.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10)
        });
      } else {
        const pId = preselectedProjectId || '';
        setFormData({
          projectId: pId === 'general' ? '' : pId,
          taskId: preselectedTaskId || '',
          module: '',
          taskType: '',
          workDone: '',
          hoursWorked: '',
          progressPercent: 0,
          blockers: '',
          tomorrowPlan: '',
          remarks: '',
          date: new Date().toISOString().substring(0, 10)
        });
      }
      fetchUserProjects();
    }
  }, [show, preselectedProjectId, preselectedTaskId, updateToEdit]);

  // Fetch tasks of the selected project when projectId changes
  useEffect(() => {
    const fetchTasksForProject = async () => {
      try {
        let tasks = [];
        if (!formData.projectId || formData.projectId === 'general') {
          const res = await api.get('/api/project-tasks?project=general');
          tasks = res.data || [];
          if (user && user.id) {
            tasks = tasks.filter(t => t.owner?._id === user.id);
          }
        } else {
          const res = await api.get(`/api/projects/${formData.projectId}/tasks`);
          tasks = res.data || [];
        }
        setFilteredTasks(tasks);
        
        if (!preselectedTaskId) {
          setFormData(prev => ({ ...prev, taskId: '', module: '', taskType: '' }));
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load tasks' });
      }
    };

    fetchTasksForProject();
  }, [formData.projectId, preselectedTaskId]);

  // Update module when task selection changes
  useEffect(() => {
    if (formData.taskId && formData.taskId !== 'individual' && filteredTasks.length > 0) {
      const selectedTask = filteredTasks.find(t => t._id === formData.taskId);
      if (selectedTask) {
        setFormData(prev => ({ 
          ...prev, 
          module: selectedTask.module || '', 
          taskType: selectedTask.type || '',
          progressPercent: selectedTask.progressPercent || 0
        }));
      }
    } else if (formData.taskId === 'individual') {
      setFormData(prev => ({
        ...prev,
        module: '',
        taskType: 'Other',
        progressPercent: 0
      }));
    }
  }, [formData.taskId, filteredTasks]);

  const fetchUserProjects = async () => {
    setLoading(true);
    try {
      const isElevated = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);
      let projectsList = [];
      
      try {
        const empRes = await api.get('/api/projects/employee/dashboard');
        projectsList = empRes.data.myProjects || [];
      } catch (err) {
        // Fallback or ignore if dashboard route fails
      }

      if (isElevated || projectsList.length === 0) {
        const projRes = await api.get('/api/projects');
        projectsList = projRes.data || [];
      }
      
      setProjects(projectsList);
      
      // Set initial project selection if not preselected
      if (projectsList.length > 0 && !preselectedProjectId) {
        setFormData(prev => ({ ...prev, projectId: projectsList[0]._id }));
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load projects' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.workDone.trim() || !formData.hoursWorked) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please fill in Work Done and Hours Worked.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.taskId === 'individual' || !payload.taskId) {
        payload.taskId = undefined;
      }
      if (!payload.projectId || payload.projectId === 'general') {
        payload.projectId = undefined;
      }

      if (updateToEdit) {
        await api.put(`/api/projects/daily-updates/${updateToEdit._id}`, payload);
        Swal.fire({ icon: 'success', title: 'Success', text: 'Daily update updated successfully!', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/api/projects/daily-updates', payload);
        Swal.fire({ icon: 'success', title: 'Success', text: 'Daily update submitted successfully!', timer: 2000, showConfirmButton: false });
      }

      if (onUpdateSubmitted) onUpdateSubmitted();
      onHide();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to submit daily update' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="tracker-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '18px', fontWeight: 700 }}>{updateToEdit ? 'Edit Daily Update' : 'Submit Daily Update'}</Modal.Title>
      </Modal.Header>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-emerald" role="status"></div>
          <p className="mt-2 text-muted">Loading tasks...</p>
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: '24px 32px' }}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Select Project *</Form.Label>
                  <Form.Select
                    disabled={!!preselectedProjectId}
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    style={{ borderRadius: '6px' }}
                  >
                    <option value="">-- General --</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Update Date *</Form.Label>
                  <Form.Control
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ borderRadius: '6px' }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Select Task (Optional)</Form.Label>
                  <Form.Select
                    disabled={!!preselectedTaskId}
                    value={formData.taskId}
                    onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                    style={{ borderRadius: '6px' }}
                  >
                    <option value="">-- Choose Task --</option>
                    <option value="individual">-- Other / Individual Work --</option>
                    {filteredTasks.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.taskId}: {t.title} {t.owner ? `(${t.owner.firstName} ${t.owner.lastName})` : '(Unassigned)'}
                      </option>
                    ))}
                  </Form.Select>
                  {filteredTasks.length === 0 ? (
                    <Form.Text className="text-muted mt-1 d-block" style={{ fontSize: '11.5px' }}>
                      <i className="fas fa-info-circle me-1 text-emerald"></i> No tasks created in this project yet. Please select <strong>Other / Individual Work</strong> to log your report.
                    </Form.Text>
                  ) : (
                    <Form.Text className="text-muted mt-1 d-block" style={{ fontSize: '11.5px' }}>
                      If your task is not listed or assigned, select <strong>Other / Individual Work</strong>.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Module</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.module}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                    style={{ borderRadius: '6px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Task Type *</Form.Label>
                  <Form.Select
                    required
                    value={formData.taskType}
                    onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                    style={{ borderRadius: '6px' }}
                  >
                    <option value="">-- Choose Type --</option>
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
            </Row>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Work Completed Today *</Form.Label>
              <Form.Control
                required
                as="textarea"
                rows={3}
                placeholder="Describe what tasks were accomplished today..."
                value={formData.workDone}
                onChange={(e) => setFormData({ ...formData, workDone: e.target.value })}
                style={{ borderRadius: '6px' }}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Hours Worked *</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    placeholder="e.g. 6.5"
                    value={formData.hoursWorked}
                    onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                    style={{ borderRadius: '6px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>
                    Current Task Progress: <span className="text-success fw-bold">{formData.progressPercent}%</span>
                  </Form.Label>
                  <div className="d-flex align-items-center gap-3 mt-1">
                    <Form.Range
                      value={formData.progressPercent}
                      min="0"
                      max="100"
                      step="5"
                      onChange={(e) => setFormData({ ...formData, progressPercent: parseInt(e.target.value) })}
                    />
                    <Form.Control
                      type="number"
                      value={formData.progressPercent}
                      min="0"
                      max="100"
                      onChange={(e) => setFormData({ ...formData, progressPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                      style={{ width: '70px', borderRadius: '6px' }}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Blockers (If Any)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="List any blocker causing delay..."
                    value={formData.blockers}
                    onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                    style={{ borderRadius: '6px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Plan for Tomorrow</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Outline plan for tomorrow..."
                    value={formData.tomorrowPlan}
                    onChange={(e) => setFormData({ ...formData, tomorrowPlan: e.target.value })}
                    style={{ borderRadius: '6px' }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Remarks / Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={1}
                placeholder="Optional remarks..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                style={{ borderRadius: '6px' }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={onHide} style={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" className="btn-emerald" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Update'}
            </Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  );
}

export default SubmitDailyUpdateModal;
