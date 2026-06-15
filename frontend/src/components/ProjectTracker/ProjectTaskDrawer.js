import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Offcanvas, Button, Form, Row, Col, Modal, Badge } from 'react-bootstrap';
import api from '../../utils/api';

import { useAuth } from '../../context/AuthContext';



function ProjectTaskDrawer({ show, onHide, taskId, onTaskUpdated }) {
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingRemark, setSubmittingRemark] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [localDependency, setLocalDependency] = useState('');
  const [localBlocker, setLocalBlocker] = useState('');
  const [localNotes, setLocalNotes] = useState('');
  const [localProgress, setLocalProgress] = useState(0);
  const [savingFields, setSavingFields] = useState(false);
  
  // Parent Task Editing State
  const [isEditingParent, setIsEditingParent] = useState(false);
  const [parentTitle, setParentTitle] = useState('');
  const [parentDescription, setParentDescription] = useState('');
  const [parentModule, setParentModule] = useState('');
  const [parentType, setParentType] = useState('Frontend');
  const [parentImpact, setParentImpact] = useState('Medium');
  const [parentPriority, setParentPriority] = useState('Medium');
  const [parentEta, setParentEta] = useState('');
  const [parentOwner, setParentOwner] = useState('');
  const [savingParent, setSavingParent] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
  const [newSubtaskOwner, setNewSubtaskOwner] = useState('');
  const [newSubtaskEta, setNewSubtaskEta] = useState('');
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('');
  const [editSubtaskDescription, setEditSubtaskDescription] = useState('');
  const [editSubtaskOwner, setEditSubtaskOwner] = useState('');
  const [editSubtaskEta, setEditSubtaskEta] = useState('');
  const [savingEditSubtask, setSavingEditSubtask] = useState(false);
  
  const leaderId = task?.project?.leader?._id || task?.project?.leader;
  const isLeaderOrAdmin = task && (
    user?.role === 'ADMIN' || 
    user?.role === 'HR' || 
    user?.role === 'MANAGER' || 
    (leaderId && user?.id && leaderId.toString() === user.id.toString())
  );
  const isOwner = task && user && (
    (task.owner?._id && user.id && task.owner._id.toString() === user.id.toString()) || 
    (task.owner && user.id && task.owner.toString() === user.id.toString())
  );

  const isAssigner = task && user && (
    (task.assignedBy?._id && user.id && task.assignedBy._id.toString() === user.id.toString()) || 
    (task.assignedBy && user.id && task.assignedBy.toString() === user.id.toString())
  );

  const canEditETA = isAssigner || (isLeaderOrAdmin && !isOwner);
  const canAssignSubtasks = isAssigner;

  const isSubtaskOwner = (sub) => {
    if (!sub.owner || !user?.id) return false;
    const subOwnerId = sub.owner._id || sub.owner;
    return subOwnerId.toString() === user.id.toString();
  };

  const getAssignerName = () => {
    if (!task) return 'System/Admin';
    if (task.assignedBy) {
      return `${task.assignedBy.firstName} ${task.assignedBy.lastName}`;
    }
    const leader = task.project?.leader;
    if (leader && typeof leader === 'object') {
      const leaderId = leader._id || leader;
      const ownerId = task.owner?._id || task.owner;
      if (leaderId && ownerId && leaderId.toString() !== ownerId.toString()) {
        return `${leader.firstName} ${leader.lastName}`;
      }
    }
    return 'System/Admin';
  };

  const getAssignerImage = () => {
    if (!task) return `https://ui-avatars.com/api/?name=System+Admin&background=F59E0B&color=fff&size=48`;
    if (task.assignedBy?.profileImage) return task.assignedBy.profileImage;
    const leader = task.project?.leader;
    if (leader && typeof leader === 'object') {
      const leaderId = leader._id || leader;
      const ownerId = task.owner?._id || task.owner;
      if (leaderId && ownerId && leaderId.toString() !== ownerId.toString()) {
        return leader.profileImage || `https://ui-avatars.com/api/?name=${leader.firstName}+${leader.lastName}&background=F59E0B&color=fff&size=48`;
      }
    }
    return `https://ui-avatars.com/api/?name=System+Admin&background=F59E0B&color=fff&size=48`;
  };

  useEffect(() => {
    if (show && taskId) {
      setTask(null);
      fetchTaskDetails(true);
      fetchEmployees();
    }
  }, [show, taskId]);

  const hasChanges = task && (
    localDependency !== (task.dependency || '') ||
    localBlocker !== (task.blocker || '') ||
    localNotes !== (task.notes || '') ||
    (parseInt(localProgress) || 0) !== (task.progressPercent || 0)
  );

  const handleSaveFields = async () => {
    setSavingFields(true);
    try {
      const val = parseInt(localProgress);
      const progressPercent = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
      
      const payload = {
        dependency: localDependency,
        blocker: localBlocker,
        notes: localNotes,
        progressPercent
      };

      const res = await api.put(`/api/project-tasks/${taskId}`, payload);
      Swal.fire({ icon: 'success', title: 'Success', text: 'Task details saved successfully', timer: 2000, showConfirmButton: false });
      
      setTask(res.data);
      setLocalDependency(res.data.dependency || '');
      setLocalBlocker(res.data.blocker || '');
      setLocalNotes(res.data.notes || '');
      setLocalProgress(res.data.progressPercent !== undefined ? res.data.progressPercent : 0);

      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || 'Failed to save changes' });
    } finally {
      setSavingFields(false);
    }
  };

  const fetchTaskDetails = async (initializeLocal = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/project-tasks/${taskId}`);
      setTask(res.data);
      if (initializeLocal) {
        setLocalDependency(res.data.dependency || '');
        setLocalBlocker(res.data.blocker || '');
        setLocalNotes(res.data.notes || '');
        setLocalProgress(res.data.progressPercent !== undefined ? res.data.progressPercent : 0);
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load task details' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const payload = { status: newStatus };
      if (newStatus === 'Completed') {
        payload.progressPercent = 100;
        setLocalProgress(100);
      }
      const res = await api.put(`/api/project-tasks/${taskId}`, payload);
      Swal.fire({ icon: 'success', title: 'Success', text: `Status updated to ${newStatus}`, timer: 2000, showConfirmButton: false });
      fetchTaskDetails(true);
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || 'Failed to update status' });
    }
  };

  const handleFieldChange = async (field, value) => {
    try {
      const res = await api.put(`/api/project-tasks/${taskId}`, { [field]: value });
      fetchTaskDetails(false);
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || `Failed to update ${field}` });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post(`/api/project-tasks/${taskId}/comments`, { text: newComment });
      setNewComment('');
      fetchTaskDetails(false);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to post comment' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    setSubmittingRemark(true);
    try {
      await api.post(`/api/project-tasks/${taskId}/remarks`, { text: newRemark });
      setNewRemark('');
      fetchTaskDetails();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to submit remark' });
    } finally {
      setSubmittingRemark(false);
    }
  };

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    setCreatingSubtask(true);
    try {
      const res = await api.post(`/api/project-tasks/${taskId}/subtasks`, {
        title: newSubtaskTitle,
        description: newSubtaskDescription || undefined,
        owner: newSubtaskOwner || undefined,
        eta: newSubtaskEta || undefined
      });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Subtask added successfully', timer: 2000, showConfirmButton: false });
      setNewSubtaskTitle('');
      setNewSubtaskDescription('');
      setNewSubtaskOwner('');
      setNewSubtaskEta('');
      setTask(res.data);
      if (res.data.progressPercent !== undefined) {
        setLocalProgress(res.data.progressPercent);
      }
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to add subtask' });
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleSaveEditSubtask = async (subtaskId) => {
    if (!editSubtaskTitle.trim()) return Swal.fire({ icon: 'error', title: 'Error', text: 'Subtask title is required' });
    setSavingEditSubtask(true);
    try {
      const res = await api.put(`/api/project-tasks/${taskId}/subtasks/${subtaskId}`, {
        title: editSubtaskTitle,
        description: editSubtaskDescription || undefined,
        owner: editSubtaskOwner || undefined,
        eta: editSubtaskEta || undefined
      });
      setTask(res.data);
      setEditingSubtaskId(null);
      Swal.fire({ icon: 'success', title: 'Success', text: 'Subtask updated', timer: 2000, showConfirmButton: false });
      if (res.data.progressPercent !== undefined) {
        setLocalProgress(res.data.progressPercent);
      }
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update subtask' });
    } finally {
      setSavingEditSubtask(false);
    }
  };

  const handleUpdateSubtask = async (subtaskId, updates) => {
    try {
      const res = await api.put(`/api/project-tasks/${taskId}/subtasks/${subtaskId}`, updates);
      setTask(res.data);
      if (res.data.progressPercent !== undefined) {
        setLocalProgress(res.data.progressPercent);
      }
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to update subtask' });
      fetchTaskDetails(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const res = await api.delete(`/api/project-tasks/${taskId}/subtasks/${subtaskId}`);
      Swal.fire({ icon: 'success', title: 'Success', text: 'Subtask deleted successfully', timer: 2000, showConfirmButton: false });
      setTask(res.data);
      if (res.data.progressPercent !== undefined) {
        setLocalProgress(res.data.progressPercent);
      }
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete subtask' });
    }
  };

  const handleDeleteParentTask = async () => {
    if (window.confirm('Are you sure you want to delete this parent task? All associated subtasks will also be deleted.')) {
      try {
        await api.delete(`/api/project-tasks/${task._id}`);
        Swal.fire({ icon: 'success', title: 'Success', text: 'Task deleted successfully', timer: 2000, showConfirmButton: false });
        onHide();
        if (onTaskUpdated) onTaskUpdated(null);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete task' });
      }
    }
  };

  const handleStartEditParent = () => {
    setParentTitle(task.title || '');
    setParentDescription(task.description || '');
    setParentModule(task.module || '');
    setParentType(task.type || 'Frontend');
    setParentImpact(task.impact || 'Medium');
    setParentPriority(task.priority || 'Medium');
    setParentEta(task.eta ? new Date(task.eta).toISOString().substring(0, 10) : '');
    setParentOwner(task.owner?._id || task.owner || '');
    setIsEditingParent(true);
  };

  const handleSaveParentTask = async (e) => {
    e.preventDefault();
    setSavingParent(true);
    try {
      const res = await api.put(`/api/project-tasks/${task._id}`, {
        title: parentTitle,
        description: parentDescription,
        module: parentModule,
        type: parentType,
        impact: parentImpact,
        priority: parentPriority,
        eta: parentEta,
        owner: parentOwner
      });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Task updated successfully', timer: 2000, showConfirmButton: false });
      setTask(res.data);
      setIsEditingParent(false);
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to update task' });
    } finally {
      setSavingParent(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical': return { background: '#FEE2E2', color: '#B91C1C' };
      case 'High': return { background: '#FEF3C7', color: '#D97706' };
      case 'Medium': return { background: '#DBEAFE', color: '#2563EB' };
      default: return { background: '#F1F5F9', color: '#475569' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return { background: '#D1FAE5', color: '#065F46' };
      case 'In Progress': return { background: '#DBEAFE', color: '#1E40AF' };
      case 'Review': return { background: '#F3E8FF', color: '#5B21B6' };
      case 'Blocked': return { background: '#FEE2E2', color: '#991B1B' };
      default: return { background: '#F1F5F9', color: '#374151' };
    }
  };

  const daysLeft = task?.eta ? Math.ceil((new Date(task.eta) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const getDaysLeftColor = () => {
    if (daysLeft === null) return '#94A3B8';
    if (daysLeft < 0) return '#EF4444';
    if (daysLeft === 0) return '#D97706';
    if (daysLeft <= 3) return '#F59E0B';
    return '#10B981';
  };
  const getDaysLeftLabel = () => {
    if (daysLeft === null) return 'No ETA';
    if (daysLeft < 0) return `Overdue by ${Math.abs(daysLeft)}d`;
    if (daysLeft === 0) return 'Due today';
    return `${daysLeft} days left`;
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" className="task-details-drawer" style={{ width: '580px' }}>
      <Offcanvas.Header closeButton className="task-drawer-header">
        <Offcanvas.Title className="d-flex align-items-center gap-3 w-100">
          {task && (
            <>
              <span className="task-id-badge">{task.taskId}</span>
              <span className="task-project-pill">
                <i className="fas fa-folder-open" style={{ fontSize: '11px' }}></i>
                {task.project?.name || 'General'}
              </span>
              {isAssigner && (
                <div className="d-flex gap-2 ms-auto me-3">
                  <Button variant="outline-primary" size="sm" className="px-3" onClick={handleStartEditParent} style={{ fontSize: '12px', fontWeight: 600 }}>
                    <i className="fas fa-edit me-1"></i> Edit
                  </Button>
                  <Button variant="outline-danger" size="sm" className="px-3" onClick={handleDeleteParentTask} style={{ fontSize: '12px', fontWeight: 600 }}>
                    <i className="fas fa-trash-alt me-1"></i> Delete
                  </Button>
                </div>
              )}
            </>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="task-drawer-body d-flex flex-column h-100" style={{ overflowY: 'hidden' }}>
        {!task ? (
          <div className="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
            <div className="spinner-border" style={{ color: 'var(--tracker-primary)', width: '2.5rem', height: '2.5rem' }} role="status"></div>
            <p className="mt-3" style={{ color: 'var(--tracker-text-light)', fontSize: '13px', fontWeight: 500 }}>Loading task details...</p>
          </div>
        ) : (
          <div className="d-flex flex-column h-100" style={{ overflowY: 'auto' }}>

            {/* ── Title & Description ── */}
            <div style={{ padding: '28px 32px 20px 32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--tracker-text)', letterSpacing: '-0.3px', marginBottom: '8px', lineHeight: 1.3 }}>{task.title}</h3>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <span style={{ fontSize: '11px', fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '3px 10px', borderRadius: '20px' }}>
                  <i className="fas fa-cubes me-1" style={{ fontSize: '9px' }}></i>{task.module}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: '20px' }}>
                  <i className="fas fa-code me-1" style={{ fontSize: '9px' }}></i>{task.type}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', padding: '3px 10px', borderRadius: '20px' }}>
                  <i className="fas fa-bolt me-1" style={{ fontSize: '9px' }}></i>{task.impact} Impact
                </span>
              </div>

              {task.description && (
                <div className="task-desc-card">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{task.description}</div>
                </div>
              )}
            </div>

            {/* ── Task Attributes Grid ── */}
            <div style={{ padding: '0 32px 28px 32px' }}>
              <div className="task-section-title">
                <i className="fas fa-sliders-h me-2"></i>Task Attributes
              </div>

              <div className="attribute-card-grid">
                {/* Status */}
                <div className="attribute-card">
                  <div className="attribute-card-label"><i className="fas fa-signal"></i> Status</div>
                  <div className="attribute-card-value">
                    {isOwner ? (
                      <Form.Select
                        className="task-drawer-select"
                        value={task.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        style={{ ...getStatusStyle(task.status) }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
                        <option value="Blocked">Blocked</option>
                      </Form.Select>
                    ) : (
                      <span className="status-badge" style={{ ...getStatusStyle(task.status), display: 'inline-flex' }}>
                        {task.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="attribute-card">
                  <div className="attribute-card-label"><i className="fas fa-flag"></i> Priority</div>
                  <div className="attribute-card-value">
                    {isOwner ? (
                      <Form.Select
                        className="task-drawer-select"
                        value={task.priority}
                        onChange={(e) => handleFieldChange('priority', e.target.value)}
                        style={{ ...getPriorityStyle(task.priority) }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </Form.Select>
                    ) : (
                      <span style={{ ...getPriorityStyle(task.priority), fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', boxShadow: '0 0 4px currentColor' }}></span>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="attribute-card">
                  <div className="attribute-card-label"><i className="fas fa-chart-line"></i> Progress</div>
                  <div className="attribute-card-value">
                    {isOwner ? (
                      <div className="d-flex align-items-center gap-2 w-100">
                        <Form.Control
                          type="number"
                          className="task-drawer-input"
                          value={localProgress}
                          min="0"
                          max="100"
                          onChange={(e) => {
                            setLocalProgress(e.target.value);
                          }}
                          style={{ width: '55px', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--tracker-text-subtle)' }}>%</span>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center gap-3 w-100">
                        <div style={{ flexGrow: 1, height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                          <div style={{ width: `${task.progressPercent || 0}%`, height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #10B981, #34D399)', transition: 'width 0.4s ease' }}></div>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--tracker-text)', minWidth: '35px', textAlign: 'right' }}>{task.progressPercent || 0}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ETA & Days Left */}
                <div className="attribute-card">
                  <div className="attribute-card-label"><i className="fas fa-calendar-alt"></i> ETA</div>
                  <div className="attribute-card-value" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    {canEditETA ? (
                      <Form.Control
                        type="date"
                        className="task-drawer-input"
                        value={task.eta ? new Date(task.eta).toISOString().substring(0, 10) : ''}
                        onChange={(e) => handleFieldChange('eta', e.target.value)}
                      />
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tracker-text)' }}>
                        {task.eta ? new Date(task.eta).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    )}
                    <span style={{ fontSize: '10px', fontWeight: 700, color: getDaysLeftColor(), letterSpacing: '0.3px' }}>
                      {getDaysLeftLabel()}
                    </span>
                  </div>
                </div>

                {/* Assignee */}
                <div className="attribute-card">
                  <div className="attribute-card-label"><i className="fas fa-user"></i> Assignee</div>
                  <div className="attribute-card-value">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tracker-text)' }}>
                      {task.owner ? `${task.owner.firstName} ${task.owner.lastName}` : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Assigned By (using fixed helper) */}
                <div className="attribute-card">
                  <div className="attribute-card-label"><i className="fas fa-user-shield"></i> Assigned By</div>
                  <div className="attribute-card-value">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tracker-text)' }}>
                      {getAssignerName()}
                    </span>
                  </div>
                </div>

                {/* Dependency */}
                <div className="attribute-card attribute-card-full">
                  <div className="attribute-card-label"><i className="fas fa-link"></i> Dependency</div>
                  <div className="attribute-card-value">
                    {isOwner ? (
                      <Form.Control
                        as="textarea"
                        rows={3}
                        className="task-drawer-textarea"
                        value={localDependency}
                        placeholder="e.g. Waiting for user DB model"
                        onChange={(e) => setLocalDependency(e.target.value)}
                      />
                    ) : (
                      <span style={{ fontSize: '13px', color: task.dependency ? 'var(--tracker-text)' : 'var(--tracker-text-light)', fontWeight: task.dependency ? 500 : 400 }}>
                        {task.dependency || 'No dependencies linked.'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Blockers */}
                <div className="attribute-card attribute-card-full" style={task.blocker ? { borderLeftColor: '#EF4444', borderLeftWidth: '3px' } : {}}>
                  <div className="attribute-card-label"><i className="fas fa-exclamation-triangle"></i> Blockers</div>
                  <div className="attribute-card-value">
                    {isOwner ? (
                      <Form.Control
                        as="textarea"
                        rows={3}
                        className="task-drawer-textarea"
                        value={localBlocker}
                        placeholder="Details of blockers..."
                        onChange={(e) => setLocalBlocker(e.target.value)}
                      />
                    ) : (
                      <span style={{ fontSize: '13px', color: task.blocker ? '#EF4444' : 'var(--tracker-text-light)', fontWeight: task.blocker ? 600 : 400 }}>
                        {task.blocker || 'No active blockers reported.'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="attribute-card attribute-card-full">
                  <div className="attribute-card-label"><i className="fas fa-sticky-note"></i> Notes</div>
                  <div className="attribute-card-value">
                    {isOwner ? (
                      <Form.Control
                        as="textarea"
                        rows={3}
                        className="task-drawer-textarea"
                        value={localNotes}
                        placeholder="Add notes..."
                        onChange={(e) => setLocalNotes(e.target.value)}
                      />
                    ) : (
                      <span style={{ fontSize: '13px', color: task.notes ? 'var(--tracker-text)' : 'var(--tracker-text-light)', fontWeight: task.notes ? 500 : 400, whiteSpace: 'pre-wrap' }}>
                        {task.notes || 'No notes added.'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isOwner && (
                <div className="d-flex justify-content-end mt-3" style={{ padding: '0 4px' }}>
                  <Button
                    onClick={handleSaveFields}
                    className="btn-emerald"
                    disabled={!hasChanges || savingFields}
                    style={{ fontSize: '13px', padding: '8px 20px', borderRadius: '8px', fontWeight: 600 }}
                  >
                    {savingFields ? (
                      <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</>
                    ) : (
                      <><i className="fas fa-save me-2"></i>Save Changes</>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* ── Task Subtasks ── */}
            <div style={{ padding: '0 32px 32px 32px', borderTop: '1px solid var(--tracker-border)', paddingTop: '24px' }}>
              <div className="task-section-title d-flex justify-content-between align-items-center mb-3">
                <span><i className="fas fa-list-ul me-2"></i>Subtasks</span>
                {task.subtaskStats && (
                  <span className="badge bg-light text-secondary border px-2 py-0.5 rounded" style={{ fontSize: '11px', fontWeight: 600 }}>
                    {task.subtaskStats.completed}/{task.subtaskStats.total} Completed
                  </span>
                )}
              </div>
              <div className="subtasks-container d-flex flex-column gap-3">
                {/* Progress Bar */}
                {task.subtaskStats && task.subtaskStats.total > 0 && (
                  <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
                    <div style={{ width: `${(task.subtaskStats.completed / task.subtaskStats.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #34D399)', transition: 'width 0.5s ease-in-out' }}></div>
                  </div>
                )}

                {/* Subtask List */}
                {task.subtasks && task.subtasks.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {task.subtasks.map(sub => {
                      const isCreator = sub.assignedBy && (sub.assignedBy._id === user?.id || sub.assignedBy === user?.id);
                      const isSubOwner = isSubtaskOwner(sub);
                      const canEditSub = canAssignSubtasks || isCreator || isSubOwner;
                      const isCompleted = sub.status === 'Completed';

                      if (editingSubtaskId === sub._id) {
                        return (
                          <div key={`edit-${sub._id}`} className="p-3 mb-2 rounded shadow-sm" style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                            <Form.Control type="text" value={editSubtaskTitle} onChange={(e) => setEditSubtaskTitle(e.target.value)} className="mb-2" size="sm" placeholder="Title" />
                            <Form.Control as="textarea" value={editSubtaskDescription} onChange={(e) => setEditSubtaskDescription(e.target.value)} className="mb-2" size="sm" rows={2} placeholder="Description (optional)" style={{ resize: 'none' }} />
                            <div className="d-flex flex-wrap gap-2 mb-3">
                              <Form.Select size="sm" value={editSubtaskOwner} onChange={(e) => setEditSubtaskOwner(e.target.value)} style={{ flex: '1 1 120px' }}>
                                <option value="">Assignee (Optional)</option>
                                {employees.map(emp => (
                                  <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                                ))}
                              </Form.Select>
                              <Form.Control type="date" size="sm" value={editSubtaskEta} onChange={(e) => setEditSubtaskEta(e.target.value)} style={{ flex: '0 0 130px' }} />
                            </div>
                            <div className="d-flex justify-content-end gap-2">
                              <Button size="sm" variant="light" className="border" onClick={() => setEditingSubtaskId(null)} disabled={savingEditSubtask} style={{ fontSize: '12px' }}>Cancel</Button>
                              <Button size="sm" variant="primary" onClick={() => handleSaveEditSubtask(sub._id)} disabled={savingEditSubtask} style={{ fontSize: '12px' }}>
                                {savingEditSubtask ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={sub._id} className="subtask-card d-flex align-items-center justify-content-between p-3 rounded" style={{ backgroundColor: isCompleted ? '#F8FAFC' : '#FFFFFF', border: '1px solid #E2E8F0', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                          <div className="d-flex align-items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                            {/* Status Checkbox */}
                            {canEditSub ? (
                              <Form.Check 
                                type="checkbox"
                                checked={isCompleted}
                                onChange={(e) => handleUpdateSubtask(sub._id, { status: e.target.checked ? 'Completed' : 'Pending' })}
                                style={{ transform: 'scale(1.2)', cursor: 'pointer', margin: 0 }}
                              />
                            ) : (
                              <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid #CBD5E1', backgroundColor: isCompleted ? '#10B981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isCompleted && <i className="fas fa-check text-white" style={{ fontSize: '10px' }}></i>}
                              </div>
                            )}

                            <div className="d-flex flex-column text-truncate">
                               <span style={{ fontSize: '14px', fontWeight: 600, color: isCompleted ? '#94A3B8' : '#334155', textDecoration: isCompleted ? 'line-through' : 'none', transition: 'all 0.2s' }} className="text-truncate">
                                 {sub.title}
                               </span>
                               {sub.description && (
                                 <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }} className="text-truncate">
                                   {sub.description}
                                 </span>
                               )}
                               <div className="d-flex align-items-center gap-2 mt-1">
                                  {sub.owner ? (
                                    <div className="d-flex align-items-center gap-1" style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                                      <img src={sub.owner.profileImage || `https://ui-avatars.com/api/?name=${sub.owner.firstName}+${sub.owner.lastName}&background=E2E8F0&color=475569`} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                                      {sub.owner.firstName} {sub.owner.lastName}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}><i className="fas fa-user-slash me-1"></i>Unassigned</span>
                                  )}
                                  
                                  {sub.dueDate && (
                                    <span style={{ fontSize: '11px', color: new Date(sub.dueDate) < new Date() && !isCompleted ? '#EF4444' : '#64748B', fontWeight: 500, background: new Date(sub.dueDate) < new Date() && !isCompleted ? '#FEE2E2' : '#F1F5F9', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <i className="far fa-calendar"></i>
                                      {new Date(sub.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                               </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-3 ms-3">
                            {canEditSub ? (
                              <Form.Select 
                                size="sm" 
                                value={sub.status} 
                                onChange={(e) => handleUpdateSubtask(sub._id, { status: e.target.value })}
                                style={{ width: '110px', fontSize: '11px', padding: '4px 24px 4px 8px', height: '26px', backgroundColor: sub.status === 'Completed' ? '#D1FAE5' : sub.status === 'Blocked' ? '#FEE2E2' : sub.status === 'In Progress' ? '#DBEAFE' : sub.status === 'Review' ? '#F3E8FF' : '#F1F5F9', color: sub.status === 'Completed' ? '#065F46' : sub.status === 'Blocked' ? '#991B1B' : sub.status === 'In Progress' ? '#1E40AF' : sub.status === 'Review' ? '#5B21B6' : '#475569', border: 'none', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                              >
                                {['Pending', 'In Progress', 'Review', 'Completed', 'Blocked'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </Form.Select>
                            ) : (
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', ...getStatusStyle(sub.status) }}>
                                {sub.status}
                              </span>
                            )}
                            
                            {(canAssignSubtasks || isCreator) && (
                              <Button variant="link" className="p-0 text-muted" onClick={() => handleDeleteSubtask(sub._id)} style={{ transition: 'color 0.2s' }} title="Delete Subtask">
                                <i className="fas fa-trash-alt hover-text-danger" style={{ cursor: 'pointer' }}></i>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                      <i className="fas fa-tasks text-muted" style={{ fontSize: '16px' }}></i>
                    </div>
                    <h6 style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>No subtasks yet</h6>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: 0 }}>Break down your work into smaller, manageable pieces.</p>
                  </div>
                )}

                {/* Quick Add Form */}
                {canAssignSubtasks && (
                  <div className="mt-2 p-3 rounded shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                    <h6 style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}><i className="fas fa-plus-circle me-1"></i> Add New Subtask</h6>
                    <Form onSubmit={handleCreateSubtask}>
                      <div className="d-flex flex-column gap-3">
                        <Form.Control
                          type="text"
                          placeholder="What needs to be done?"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          style={{ fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#F8FAFC' }}
                          required
                        />
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Add a description (optional)"
                          value={newSubtaskDescription}
                          onChange={(e) => setNewSubtaskDescription(e.target.value)}
                          style={{ fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#F8FAFC', resize: 'none' }}
                        />
                        <div className="d-flex flex-wrap gap-3">
                          <Form.Select
                            value={newSubtaskOwner}
                            onChange={(e) => setNewSubtaskOwner(e.target.value)}
                            style={{ fontSize: '12px', borderRadius: '6px', flex: '1 1 140px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', cursor: 'pointer' }}
                          >
                            <option value="">Assignee (Optional)</option>
                            {employees.map(emp => (
                              <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                          </Form.Select>
                          <Form.Control
                            type="date"
                            value={newSubtaskEta}
                            onChange={(e) => setNewSubtaskEta(e.target.value)}
                            style={{ fontSize: '12px', borderRadius: '6px', flex: '0 0 130px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC' }}
                          />
                          <Button type="submit" className="btn-emerald" disabled={creatingSubtask || !newSubtaskTitle.trim()} style={{ fontSize: '12px', fontWeight: 600, padding: '0 20px', borderRadius: '6px', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
                            {creatingSubtask ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane me-1"></i> Add Subtask</>}
                          </Button>
                        </div>
                      </div>
                    </Form>
                  </div>
                )}
              </div>
            </div>

            {/* ── Task Comments ── */}
            <div style={{ padding: '0 32px 32px 32px', borderTop: '1px solid var(--tracker-border)', paddingTop: '24px' }}>
              <div className="task-section-title">
                <i className="fas fa-comments me-2"></i>Task Comments
              </div>

              <div className="comment-timeline" style={{ marginBottom: '16px' }}>
                {task.comments?.map(comm => (
                  <div key={comm._id} className="comment-card">
                    <div className="comment-avatar">
                      {comm.author?.firstName?.[0]}{comm.author?.lastName?.[0]}
                    </div>
                    <div className="comment-content-box">
                      <div className="comment-header">
                        <span className="comment-author">{comm.author?.firstName} {comm.author?.lastName}</span>
                        <span className="comment-time">{new Date(comm.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="comment-text">{comm.text}</p>
                    </div>
                  </div>
                ))}
                {(!task.comments || task.comments.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--tracker-text-light)', fontSize: '12.5px' }}>
                    <i className="fas fa-comments me-2" style={{ fontSize: '14px', opacity: 0.5 }}></i>
                    No comments yet. Start the conversation.
                  </div>
                )}
              </div>

              {/* Add Comment Form */}
              <Form onSubmit={handleAddComment}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <Form.Control
                    as="textarea"
                    rows={1}
                    className="task-drawer-textarea"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{ flexGrow: 1 }}
                  />
                  <Button type="submit" size="sm" className="btn-emerald" style={{ whiteSpace: 'nowrap', fontSize: '12px', padding: '8px 16px', borderRadius: '8px' }} disabled={submittingComment || !newComment.trim()}>
                    {submittingComment ? '...' : <><i className="fas fa-paper-plane me-1"></i>Send</>}
                  </Button>
                </div>
              </Form>
            </div>

          </div>
        )}
      </Offcanvas.Body>
      {/* ── Parent Task Edit Modal ── */}
      {isEditingParent && (
        <Modal show={isEditingParent} onHide={() => setIsEditingParent(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '16px', fontWeight: 700 }}>Edit Project Task: {task.taskId}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveParentTask}>
            <Modal.Body>
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
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Module</Form.Label>
                    <Form.Control
                      type="text"
                      value={parentModule}
                      onChange={(e) => setParentModule(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Type</Form.Label>
                    <Form.Select
                      value={parentType}
                      onChange={(e) => setParentType(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Frontend + Backend">Frontend + Backend</option>
                      <option value="Full Stack">Full Stack</option>
                      <option value="Testing">Testing</option>
                      <option value="Deployment">Deployment</option>
                      <option value="extra feature">extra feature</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Impact</Form.Label>
                    <Form.Select
                      value={parentImpact}
                      onChange={(e) => setParentImpact(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
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
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>ETA Due Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={parentEta}
                      onChange={(e) => setParentEta(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Assignee (Owner)</Form.Label>
                    <Form.Select
                      value={parentOwner}
                      onChange={(e) => setParentOwner(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    >
                      <option value="">Select Employee...</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" size="sm" onClick={() => setIsEditingParent(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={savingParent}>
                {savingParent ? 'Saving...' : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Offcanvas>
  );
}

export default ProjectTaskDrawer;
