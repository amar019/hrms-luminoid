import Swal from 'sweetalert2';
import React, { useState } from 'react';
import { Offcanvas, Nav, Form, Button, ProgressBar, Badge, Row, Col, Modal } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

import SubtaskManager from '../ProjectTracker/SubtaskManager';

const TASK_TYPES = [
  'DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'DEPLOYMENT', 'BUG_FIX', 'DOCUMENTATION', 
  'INTERVIEW', 'ONBOARDING', 'TRAINING', 'CLIENT_MEETING', 'LEAD_VISIT', 'OTHER'
];

export default function TaskDetailsPanel({ show, onHide, task, onTaskUpdated }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [comment, setComment] = useState('');
  const [updateForm, setUpdateForm] = useState({ progressPercent: task?.progressPercent || 0, workDone: '', hoursSpent: '', status: 'ON_TRACK' });
  const [loading, setLoading] = useState(false);

  // Parent Task Editing States
  const [isEditingParent, setIsEditingParent] = useState(false);
  const [parentTitle, setParentTitle] = useState('');
  const [parentDescription, setParentDescription] = useState('');
  const [parentTaskType, setParentTaskType] = useState('DEVELOPMENT');
  const [parentDepartment, setParentDepartment] = useState('');
  const [parentPriority, setParentPriority] = useState('MEDIUM');
  const [parentScheduledDate, setParentScheduledDate] = useState('');
  const [parentDueDate, setParentDueDate] = useState('');
  const [savingParent, setSavingParent] = useState(false);
  const [departments, setDepartments] = useState([]);

  if (!task) return null;

  const isAssigned = task.assignedTo?.some(emp => emp._id === user?.id);
  const isCreator = task.assignedBy && (task.assignedBy._id === user?.id || task.assignedBy === user?.id);
  const canAssignSubtasks = isCreator;
  const canEditOrDelete = isCreator;

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/api/departments');
      if (res.data && res.data.data) {
        setDepartments(res.data.data.filter(d => d.status === 'ACTIVE'));
      }
    } catch (e) {
      console.error("Error fetching departments", e);
    }
  };

  const handleStartEditParent = () => {
    setParentTitle(task.title || '');
    setParentDescription(task.description || '');
    setParentTaskType(task.taskType || 'DEVELOPMENT');
    setParentDepartment(task.department || '');
    setParentPriority(task.priority || 'MEDIUM');
    setParentScheduledDate(task.scheduledDate ? new Date(task.scheduledDate).toISOString().substring(0, 10) : '');
    setParentDueDate(task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : '');
    setIsEditingParent(true);
    fetchDepartments();
  };

  const handleDeleteParentTask = async () => {
    if (window.confirm('Are you sure you want to delete this parent task? All associated subtasks will also be deleted.')) {
      try {
        await api.delete(`/api/tasks/${task._id}`);
        Swal.fire({ icon: 'success', title: 'Success', text: 'Task deleted successfully', timer: 2000, showConfirmButton: false });
        onHide();
        if (onTaskUpdated) onTaskUpdated(null);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to delete task' });
      }
    }
  };

  const handleSaveParentTask = async (e) => {
    e.preventDefault();
    setSavingParent(true);
    try {
      const res = await api.put(`/api/tasks/${task._id}`, {
        title: parentTitle,
        description: parentDescription,
        taskType: parentTaskType,
        department: parentDepartment,
        priority: parentPriority,
        scheduledDate: parentScheduledDate,
        dueDate: parentDueDate || undefined
      });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Task updated successfully', timer: 2000, showConfirmButton: false });
      setIsEditingParent(false);
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to update task' });
    } finally {
      setSavingParent(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const response = await api.post(`/api/tasks/${task._id}/comments`, { text: comment });
      onTaskUpdated(response.data);
      setComment('');
      Swal.fire({ icon: 'success', title: 'Success', text: 'Comment added', timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add comment' });
    }
  };

  const handleDailyUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post(`/api/tasks/${task._id}/daily-update`, updateForm);
      onTaskUpdated(response.data);
      setUpdateForm({ progressPercent: response.data.progressPercent || 0, workDone: '', hoursSpent: '', status: 'ON_TRACK' });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Update logged successfully', timer: 2000, showConfirmButton: false });
      setActiveTab('timeline');
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to log update' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInOut = async (action) => {
    setLoading(true);
    try {
      let location = { lat: 0, lng: 0 }; // Mock location for brevity, ideally use navigator.geolocation
      let endpoint = `/api/tasks/${task._id}/${action === 'in' ? 'check-in' : 'check-out'}`;
      const payload = action === 'in' ? location : { ...location, outcome: 'Completed', notes: 'Checked out' };
      
      const response = await api.post(endpoint, payload);
      onTaskUpdated(response.data);
      Swal.fire({ icon: 'success', title: 'Success', text: `Checked ${action} successfully`, timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Failed to check ${action}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" style={{ width: '580px', borderLeft: 'none', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}>
      <Offcanvas.Header closeButton style={{ borderBottom: '1px solid var(--wm-border)', padding: '1.5rem' }}>
        <Offcanvas.Title className="d-flex align-items-center justify-content-between w-100 me-3">
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              {task.project || task.department}
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--wm-text-primary)' }}>{task.title}</span>
          </div>
          {canEditOrDelete && (
            <div className="d-flex gap-2 ms-auto">
              <Button variant="outline-primary" size="sm" className="px-3" onClick={handleStartEditParent} style={{ fontSize: '12px', fontWeight: 600 }}>
                <i className="fas fa-edit me-1"></i> Edit Task
              </Button>
              <Button variant="outline-danger" size="sm" className="px-3" onClick={handleDeleteParentTask} style={{ fontSize: '12px', fontWeight: 600 }}>
                <i className="fas fa-trash-alt me-1"></i> Delete Task
              </Button>
            </div>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>
      
      <Offcanvas.Body style={{ padding: 0, backgroundColor: 'var(--wm-bg)' }}>
        <div style={{ padding: '0 1.5rem', backgroundColor: '#fff', borderBottom: '1px solid var(--wm-border)' }}>
          <Nav variant="underline" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} style={{ gap: '1.5rem' }}>
            <Nav.Item>
              <Nav.Link eventKey="details" style={{ color: activeTab === 'details' ? 'var(--wm-primary)' : 'var(--wm-text-secondary)', fontWeight: 600, padding: '1rem 0' }}>Details</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="subtasks" style={{ color: activeTab === 'subtasks' ? 'var(--wm-primary)' : 'var(--wm-text-secondary)', fontWeight: 600, padding: '1rem 0' }}>Subtasks</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="timeline" style={{ color: activeTab === 'timeline' ? 'var(--wm-primary)' : 'var(--wm-text-secondary)', fontWeight: 600, padding: '1rem 0' }}>Timeline & Updates</Nav.Link>
            </Nav.Item>
            {isAssigned && task.status !== 'COMPLETED' && (
              <Nav.Item>
                <Nav.Link eventKey="update" style={{ color: activeTab === 'update' ? 'var(--wm-primary)' : 'var(--wm-text-secondary)', fontWeight: 600, padding: '1rem 0' }}>Log Work</Nav.Link>
              </Nav.Item>
            )}
          </Nav>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'details' && (
            <div className="task-details-view fade-in">
              <div className="d-flex justify-content-between mb-4">
                <Badge style={{ background: getPriorityColor(task.priority), padding: '0.4rem 0.8rem', borderRadius: '8px' }}>{task.priority}</Badge>
                <Badge bg={task.status === 'COMPLETED' ? 'success' : 'secondary'} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="mb-4">
                <h6 style={{ color: 'var(--wm-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Description</h6>
                <p style={{ color: 'var(--wm-text-primary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{task.description || 'No description provided.'}</p>
              </div>

              <div className="mb-4 p-3" style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--wm-border)' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--wm-text-secondary)' }}>Progress</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--wm-primary)' }}>{task.progressPercent || 0}%</span>
                </div>
                <ProgressBar now={task.progressPercent || 0} variant="primary" style={{ height: '8px', borderRadius: '4px' }} />
              </div>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--wm-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--wm-text-secondary)', marginBottom: '0.25rem' }}>Due Date</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--wm-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--wm-text-secondary)', marginBottom: '0.25rem' }}>Location</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.workLocation}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h6 style={{ color: 'var(--wm-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Assignees</h6>
                <div className="d-flex flex-wrap gap-2">
                  {task.assignedTo?.map(emp => (
                    <div key={emp._id} className="d-flex align-items-center gap-2" style={{ background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '20px', border: '1px solid var(--wm-border)' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--wm-primary-light)', color: 'var(--wm-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600 }}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{emp.firstName} {emp.lastName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isAssigned && task.requireCheckIn && task.status !== 'COMPLETED' && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--wm-border)' }}>
                  {task.status === 'ASSIGNED' ? (
                    <Button variant="primary" className="w-100 py-2" style={{ borderRadius: '8px', fontWeight: 600 }} onClick={() => handleCheckInOut('in')} disabled={loading}>
                      <i className="fas fa-sign-in-alt me-2"></i> Start Task (Check In)
                    </Button>
                  ) : (
                    <Button variant="success" className="w-100 py-2" style={{ borderRadius: '8px', fontWeight: 600 }} onClick={() => handleCheckInOut('out')} disabled={loading}>
                      <i className="fas fa-check-circle me-2"></i> Complete Task (Check Out)
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subtasks' && (
            <div className="task-subtasks-view fade-in">
              <SubtaskManager 
                parentTaskId={task._id} 
                parentType="GENERAL_TASK" 
                canCreate={canAssignSubtasks}
                onSubtaskChange={async () => {
                  try {
                    const res = await api.get(`/api/tasks/${task._id}`);
                    if (onTaskUpdated) onTaskUpdated(res.data);
                  } catch (err) {
                    console.error('Failed to sync parent task from subtask change:', err);
                  }
                }} 
              />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="task-timeline-view fade-in">
              <div className="mb-4">
                <h6 style={{ color: 'var(--wm-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Daily Updates</h6>
                {task.dailyUpdates?.length > 0 ? (
                  <div className="timeline-container">
                    {task.dailyUpdates.map((update, idx) => (
                      <div key={idx} style={{ paddingLeft: '1.5rem', borderLeft: '2px solid var(--wm-border)', position: 'relative', paddingBottom: '1.5rem' }}>
                        <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--wm-primary)' }}></div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--wm-text-secondary)', marginBottom: '0.25rem' }}>
                          {new Date(update.date).toLocaleDateString()} • {update.updatedBy?.firstName} {update.updatedBy?.lastName}
                        </div>
                        <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--wm-border)' }}>
                          <div className="d-flex justify-content-between mb-2">
                            <Badge bg={update.status === 'ON_TRACK' ? 'success' : update.status === 'BLOCKED' ? 'danger' : 'warning'}>{update.status}</Badge>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--wm-primary)' }}>Progress: {update.progressPercent}%</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', margin: 0 }}>{update.workDone}</p>
                          {update.hoursSpent && <div style={{ fontSize: '0.8rem', color: 'var(--wm-text-secondary)', marginTop: '0.5rem' }}><i className="fas fa-clock me-1"></i> {update.hoursSpent} hours</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4" style={{ background: '#fff', borderRadius: '12px', border: '1px dashed var(--wm-border)' }}>
                    <p style={{ color: 'var(--wm-text-secondary)', margin: 0, fontSize: '0.9rem' }}>No updates logged yet.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--wm-border)' }}>
                <h6 style={{ color: 'var(--wm-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Comments</h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                  {task.comments?.map((c, i) => (
                    <div key={i} className="mb-3 d-flex gap-2">
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                        {c.user?.firstName[0]}{c.user?.lastName[0]}
                      </div>
                      <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0 12px 12px 12px', border: '1px solid var(--wm-border)', flexGrow: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--wm-text-secondary)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, color: 'var(--wm-text-primary)' }}>{c.user?.firstName} {c.user?.lastName}</span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', margin: 0 }}>{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Form onSubmit={handleAddComment}>
                  <Form.Group>
                    <Form.Control 
                      as="textarea" 
                      rows={2} 
                      placeholder="Write a comment..." 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={{ borderRadius: '8px', fontSize: '0.9rem', resize: 'none' }}
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-end mt-2">
                    <Button type="submit" variant="primary" size="sm" style={{ borderRadius: '6px', fontWeight: 600 }} disabled={!comment.trim()}>
                      Post Comment
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          )}

          {activeTab === 'update' && (
            <div className="task-log-work-view fade-in">
              <Form onSubmit={handleDailyUpdate}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600 }}>What did you work on today?</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    required
                    value={updateForm.workDone}
                    onChange={(e) => setUpdateForm({...updateForm, workDone: e.target.value})}
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Group>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Hours Spent</Form.Label>
                      <Form.Control 
                        type="number" 
                        step="0.5"
                        required
                        value={updateForm.hoursSpent}
                        onChange={(e) => setUpdateForm({...updateForm, hoursSpent: e.target.value})}
                        style={{ borderRadius: '8px' }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Status</Form.Label>
                      <Form.Select 
                        value={updateForm.status}
                        onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                        style={{ borderRadius: '8px' }}
                      >
                        <option value="ON_TRACK">On Track</option>
                        <option value="NEED_HELP">Need Help</option>
                        <option value="BLOCKED">Blocked</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>

                <Form.Group className="mb-4">
                  <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Task Progress ({updateForm.progressPercent}%)</Form.Label>
                  <Form.Range 
                    value={updateForm.progressPercent}
                    onChange={(e) => setUpdateForm({...updateForm, progressPercent: parseInt(e.target.value)})}
                  />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100 py-2" style={{ borderRadius: '8px', fontWeight: 600 }} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Update'}
                </Button>
              </Form>
            </div>
          )}
        </div>
      </Offcanvas.Body>
      {/* ── Parent Task Edit Modal ── */}
      {isEditingParent && (
        <Modal show={isEditingParent} onHide={() => setIsEditingParent(false)} centered size="lg">
          <Modal.Header closeButton style={{ borderBottom: '1px solid var(--wm-border)', padding: '1.5rem' }}>
            <Modal.Title style={{ fontSize: '16px', fontWeight: 700, color: 'var(--wm-text-primary)' }}>
              Edit General Task: {task.title}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveParentTask}>
            <Modal.Body style={{ padding: '2rem' }}>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Title</Form.Label>
                    <Form.Control
                      type="text"
                      value={parentTitle}
                      onChange={(e) => setParentTitle(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={parentDescription}
                      onChange={(e) => setParentDescription(e.target.value)}
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Department</Form.Label>
                    <Form.Select
                      value={parentDepartment}
                      onChange={(e) => setParentDepartment(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    >
                      <option value="">Select Department...</option>
                      {departments.map(d => (
                        <option key={d._id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Task Type</Form.Label>
                    <Form.Select
                      value={parentTaskType}
                      onChange={(e) => setParentTaskType(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      {TASK_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type.replace('_', ' ')}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Priority</Form.Label>
                    <Form.Select
                      value={parentPriority}
                      onChange={(e) => setParentPriority(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={parentScheduledDate}
                      onChange={(e) => setParentScheduledDate(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Due Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={parentDueDate}
                      onChange={(e) => setParentDueDate(e.target.value)}
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer style={{ padding: '1.5rem', borderTop: '1px solid var(--wm-border)' }}>
              <Button variant="light" size="sm" onClick={() => setIsEditingParent(false)} style={{ borderRadius: '8px', fontWeight: 600 }}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={savingParent} style={{ borderRadius: '8px', fontWeight: 600, background: 'var(--wm-primary)', border: 'none' }}>
                {savingParent ? 'Saving...' : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Offcanvas>
  );
};

