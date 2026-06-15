import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Form, Button, ProgressBar, Badge, Table, Card, Row, Col, Modal } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../../utils/api';

import { useAuth } from '../../context/AuthContext';

import moment from 'moment';

const STATUSES = ['Pending', 'In Progress', 'Review', 'Completed', 'Blocked'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const COLORS = {
  Pending: '#94A3B8',
  'In Progress': '#2563EB',
  Review: '#8B5CF6',
  Completed: '#10B981',
  Blocked: '#EF4444'
};

// Pie colors removed

export default function SubtaskManager({ parentTaskId, parentType, projectId, showOnlyMy: initialShowOnlyMy = false, canCreate = true, onSubtaskChange }) {
  const { user } = useAuth();
  const [subtasks, setSubtasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Views and Filters
  const [currentView, setCurrentView] = useState('list'); // 'list', 'kanban', 'timeline', 'calendar', 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showOnlyMy, setShowOnlyMy] = useState(initialShowOnlyMy);

  // Quick Add Form
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickParentTaskId, setQuickParentTaskId] = useState('');
  const [quickOwner, setQuickOwner] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickPriority, setQuickPriority] = useState('Medium');
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Subtask Edit Modal State
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [savingEdit, setSavingEdit] = useState(false);



  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    blocked: 0,
    overdue: 0,
    completionRate: 0
  });

  useEffect(() => {
    fetchSubtasks();
    fetchEmployees();
    if (projectId) {
      fetchProjectTasks();
    }
  }, [parentTaskId, projectId]);

  const fetchSubtasks = async () => {
    setLoading(true);
    try {
      let url = '/api/subtasks';
      if (parentTaskId) {
        url = `/api/subtasks?parentTask=${parentTaskId}&parentType=${parentType}`;
      } else if (projectId) {
        url = `/api/subtasks?projectId=${projectId}`;
      } else {
        url = `/api/subtasks/my`;
      }
      const res = await api.get(url);
      setSubtasks(res.data.subtasks || []);
      calculateStats(res.data.subtasks || []);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load subtasks' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTasks = async () => {
    try {
      const res = await api.get(`/api/project-tasks?project=${projectId}`);
      setProjectTasks(res.data || []);
      if (res.data && res.data.length > 0) {
        setQuickParentTaskId(res.data[0]._id);
      }
    } catch (e) {
      console.error('Failed to load project tasks', e);
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

  const calculateStats = (list) => {
    const total = list.length;
    const completed = list.filter(s => s.status === 'Completed').length;
    const pending = list.filter(s => ['Pending', 'In Progress', 'Review'].includes(s.status)).length;
    const blocked = list.filter(s => s.status === 'Blocked').length;
    
    const now = new Date();
    const overdue = list.filter(s => s.dueDate && new Date(s.dueDate) < now && s.status !== 'Completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats({ total, completed, pending, blocked, overdue, completionRate });
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const finalParentTaskId = parentTaskId || quickParentTaskId;
    if (!quickTitle.trim() || !finalParentTaskId || !quickDueDate) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please enter Title, Parent Task and Due Date' });
      return;
    }

    setAddingSubtask(true);
    try {
      const payload = {
        title: quickTitle,
        description: quickDescription || undefined,
        parentTask: finalParentTaskId,
        parentType: parentType || 'PROJECT_TASK',
        dueDate: quickDueDate,
        priority: quickPriority
      };

      await api.post('/api/subtasks', payload);
      Swal.fire({ icon: 'success', title: 'Success', text: 'Subtask added', timer: 2000, showConfirmButton: false });
      setQuickTitle('');
      setQuickDescription('');
      setQuickDueDate('');
      setQuickPriority('Medium');
      fetchSubtasks();
      if (onSubtaskChange) onSubtaskChange();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to create subtask' });
      fetchSubtasks();
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (currentView === 'kanban') {
      // Handle moving cards across columns
      if (destination.droppableId === source.droppableId) return;

      // Subtask move validation
      const draggedSub = subtasks.find(s => s._id === draggableId);
      
      const updated = subtasks.map(s => {
        if (s._id === draggableId) {
          return { ...s, status: destination.droppableId };
        }
        return s;
      });
      setSubtasks(updated);
      calculateStats(updated);

      try {
        await api.put(`/api/subtasks/${draggableId}`, { status: destination.droppableId });
        Swal.fire({ icon: 'success', title: 'Success', text: `Subtask status updated to ${destination.droppableId}`, timer: 2000, showConfirmButton: false });
        if (onSubtaskChange) onSubtaskChange();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status' });
        fetchSubtasks();
      }
    } else if (currentView === 'list') {
      // Reorder items locally
      if (destination.index === source.index) return;
      const items = Array.from(subtasks);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setSubtasks(items);
      
      // In a production app, save reorder index. For now we update local state representation.
      Swal.fire({ icon: 'success', title: 'Success', text: 'Subtask order updated', timer: 2000, showConfirmButton: false });
    }
  };

  const handleStatusChange = async (subtaskId, newStatus) => {
    try {
      const res = await api.put(`/api/subtasks/${subtaskId}`, { status: newStatus });
      fetchSubtasks();
      if (onSubtaskChange) onSubtaskChange();
      Swal.fire({ icon: 'success', title: 'Success', text: `Status updated to ${newStatus}`, timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status' });
    }
  };

  const handlePriorityChange = async (subtaskId, newPriority) => {
    try {
      await api.put(`/api/subtasks/${subtaskId}`, { priority: newPriority });
      fetchSubtasks();
      Swal.fire({ icon: 'success', title: 'Success', text: `Priority updated to ${newPriority}`, timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update priority' });
    }
  };

  const handleDeleteSubtaskClick = async (subtaskId) => {
    if (window.confirm('Are you sure you want to delete this subtask?')) {
      try {
        await api.delete(`/api/subtasks/${subtaskId}`);
        Swal.fire({ icon: 'success', title: 'Success', text: 'Subtask deleted successfully', timer: 2000, showConfirmButton: false });
        fetchSubtasks();
        if (onSubtaskChange) onSubtaskChange();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete subtask' });
      }
    }
  };

  const handleEditSubtaskClick = (sub) => {
    setEditingSubtask(sub);
    setEditTitle(sub.title || '');
    setEditDescription(sub.description || '');
    setEditDueDate(sub.dueDate ? new Date(sub.dueDate).toISOString().substring(0, 10) : '');
    setEditPriority(sub.priority || 'Medium');
  };

  const handleSaveSubtaskEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await api.put(`/api/subtasks/${editingSubtask._id}`, {
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate,
        priority: editPriority
      });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Subtask updated successfully', timer: 2000, showConfirmButton: false });
      setEditingSubtask(null);
      fetchSubtasks();
      if (onSubtaskChange) onSubtaskChange();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to update subtask' });
    } finally {
      setSavingEdit(false);
    }
  };


  // Filters application
  const filteredSubtasks = subtasks.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.taskId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    const matchesPriority = !priorityFilter || s.priority === priorityFilter;
    const matchesMy = !showOnlyMy || s.owner?._id === user?.id;

    return matchesSearch && matchesStatus && matchesPriority && matchesMy;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical': return <Badge bg="danger">Critical</Badge>;
      case 'High': return <Badge bg="warning" className="text-dark">High</Badge>;
      case 'Medium': return <Badge bg="primary">Medium</Badge>;
      default: return <Badge bg="secondary">Low</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return <Badge bg="success">Completed</Badge>;
      case 'In Progress': return <Badge bg="primary">In Progress</Badge>;
      case 'Review': return <Badge bg="info">Review</Badge>;
      case 'Blocked': return <Badge bg="danger">Blocked</Badge>;
      default: return <Badge bg="secondary">Pending</Badge>;
    }
  };

  // Analytics data helper removed

  return (
    <div className="subtask-manager">
      
      {/* ── Subtask Stats Header ── */}
      <div className="mb-4 bg-white p-3 rounded border shadow-sm">
        <Row className="g-3 align-items-center mb-3">
          <Col md={12}>
            <div className="d-flex justify-content-start gap-3 flex-wrap">
              <div className="text-center bg-light px-2.5 py-1 rounded" style={{ minWidth: '70px', border: '1px solid #E2E8F0' }}>
                <div className="text-muted" style={{ fontSize: '10px', fontWeight: 700 }}>TOTAL</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155' }}>{stats.total}</div>
              </div>
              <div className="text-center bg-light px-2.5 py-1 rounded" style={{ minWidth: '70px', border: '1px solid #E2E8F0' }}>
                <div className="text-muted" style={{ fontSize: '10px', fontWeight: 700 }}>COMPLETED</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>{stats.completed}</div>
              </div>
              <div className="text-center bg-light px-2.5 py-1 rounded" style={{ minWidth: '70px', border: '1px solid #E2E8F0' }}>
                <div className="text-muted" style={{ fontSize: '10px', fontWeight: 700 }}>PENDING</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2563EB' }}>{stats.pending}</div>
              </div>
              <div className="text-center bg-light px-2.5 py-1 rounded" style={{ minWidth: '70px', border: '1px solid #E2E8F0' }}>
                <div className="text-muted" style={{ fontSize: '10px', fontWeight: 700 }}>BLOCKED</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>{stats.blocked}</div>
              </div>
              {stats.overdue > 0 && (
                <div className="text-center px-2.5 py-1 rounded bg-red-100 border border-red-200" style={{ minWidth: '70px' }}>
                  <div className="text-red-700" style={{ fontSize: '10px', fontWeight: 700 }}>OVERDUE</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#B91C1C' }}>{stats.overdue}</div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>

      {/* ── Subtask Filters and View Toggle ── */}
      <div className="mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3 p-2.5 bg-light rounded border">
        <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
          <Form.Control
            type="text"
            placeholder="Search subtasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '200px', borderRadius: '6px', fontSize: '13px' }}
          />
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '130px', borderRadius: '6px', fontSize: '13px' }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Form.Select>
          <Form.Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: '130px', borderRadius: '6px', fontSize: '13px' }}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </Form.Select>
          <Form.Check
            type="switch"
            label="My Subtasks"
            checked={showOnlyMy}
            onChange={(e) => setShowOnlyMy(e.target.checked)}
            style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginLeft: '8px' }}
          />
        </div>

        <div className="d-flex border rounded bg-white overflow-hidden p-0.5">
          <Button variant={currentView === 'list' ? 'primary' : 'link'} size="sm" className="px-3" title="List View" onClick={() => setCurrentView('list')}>
            <i className="fas fa-list"></i>
          </Button>
          <Button variant={currentView === 'kanban' ? 'primary' : 'link'} size="sm" className="px-3" title="Kanban Board" onClick={() => setCurrentView('kanban')}>
            <i className="fas fa-columns"></i>
          </Button>
          <Button variant={currentView === 'calendar' ? 'primary' : 'link'} size="sm" className="px-3" title="Calendar Agenda" onClick={() => setCurrentView('calendar')}>
            <i className="fas fa-calendar-alt"></i>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          
          {/* ── 1. LIST VIEW ── */}
          {currentView === 'list' && (
            <Droppable droppableId="subtasks-list">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <Table hover responsive className="bg-white border rounded shadow-sm align-middle" style={{ fontSize: '13.5px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th style={{ minWidth: '150px' }}>Subtask ID / Title</th>
                        <th>Assignee</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th style={{ width: '80px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubtasks.map((sub, index) => {
                        const isSubtaskCreator = sub.assignedBy && (sub.assignedBy._id === user?.id || sub.assignedBy === user?.id);
                        const canEditSubtask = canCreate || isSubtaskCreator || (sub.owner && (sub.owner._id === user?.id || sub.owner === user?.id));
                        return (
                          <Draggable key={sub._id} draggableId={sub._id} index={index} isDragDisabled={!canEditSubtask}>
                            {(dragProvided) => (
                              <tr
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                style={{ 
                                  opacity: canEditSubtask ? 1 : 0.85,
                                  ...dragProvided.draggableProps.style 
                                }}
                              >
                                <td {...dragProvided.dragHandleProps} onClick={(e) => e.stopPropagation()}>
                                  {canEditSubtask ? (
                                    <i className="fas fa-grip-vertical text-muted"></i>
                                  ) : (
                                    <i className="fas fa-lock text-muted" style={{ fontSize: '12px' }}></i>
                                  )}
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <Badge bg="secondary" style={{ fontSize: '10px' }}>{sub.taskId}</Badge>
                                    <div className="d-flex flex-column">
                                      <span className="fw-semibold text-slate">{sub.title}</span>
                                      {sub.description && <span className="text-muted text-truncate" style={{ fontSize: '11px', maxWidth: '250px' }}>{sub.description}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  {sub.owner ? (
                                    <div className="d-flex align-items-center gap-2">
                                      <img
                                        src={sub.owner.profileImage || `https://ui-avatars.com/api/?name=${sub.owner.firstName}+${sub.owner.lastName}&background=3B82F6&color=fff&size=24`}
                                        alt=""
                                        className="rounded-circle border"
                                        style={{ width: '22px', height: '22px', objectFit: 'cover' }}
                                      />
                                      <span>{sub.owner.firstName} {sub.owner.lastName}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted italic">Unassigned</span>
                                  )}
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <Form.Select
                                    size="sm"
                                    value={sub.priority}
                                    disabled={!(canCreate || isSubtaskCreator)}
                                    onChange={(e) => handlePriorityChange(sub._id, e.target.value)}
                                    style={{ width: '95px', height: '28px', padding: '0 8px', fontSize: '12px' }}
                                  >
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                  </Form.Select>
                                </td>
                                <td>
                                  <span className={moment(sub.dueDate).isBefore(moment(), 'day') && sub.status !== 'Completed' ? 'text-danger fw-bold' : ''}>
                                    {moment(sub.dueDate).format('DD/MM/YYYY')}
                                  </span>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <Form.Select
                                    size="sm"
                                    value={sub.status}
                                    disabled={!canEditSubtask}
                                    onChange={(e) => handleStatusChange(sub._id, e.target.value)}
                                    style={{ width: '120px', height: '28px', padding: '0 8px', fontSize: '12px' }}
                                  >
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </Form.Select>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  {isSubtaskCreator && (
                                    <div className="d-flex gap-2">
                                      <i
                                        className="fas fa-edit text-primary cursor-pointer"
                                        title="Edit Subtask"
                                        onClick={() => handleEditSubtaskClick(sub)}
                                      ></i>
                                      <i
                                        className="fas fa-trash-alt text-danger cursor-pointer"
                                        title="Delete Subtask"
                                        onClick={() => handleDeleteSubtaskClick(sub._id)}
                                      ></i>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        );
                      })}
                      {filteredSubtasks.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-4">No matching subtasks found.</td>
                        </tr>
                      )}
                      {provided.placeholder}
                    </tbody>
                  </Table>
                </div>
              )}
            </Droppable>
          )}

          {/* ── 2. KANBAN VIEW ── */}
          {currentView === 'kanban' && (
            <Row className="g-3 flex-nowrap" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
              {STATUSES.map(status => (
                <Col key={status} style={{ minWidth: '220px', width: '20%' }}>
                  <Card className="bg-light h-100 border" style={{ minHeight: '350px' }}>
                    <Card.Header className="d-flex align-items-center justify-content-between py-2 border-bottom-0" style={{ borderTop: `3px solid ${COLORS[status]}`, background: '#F8FAFC' }}>
                      <span className="fw-bold small text-slate" style={{ fontSize: '12.5px' }}>{status}</span>
                      <Badge bg="light" className="text-secondary border">{filteredSubtasks.filter(s => s.status === status).length}</Badge>
                    </Card.Header>
                    <Droppable droppableId={status}>
                      {(provided) => (
                        <Card.Body
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="p-2 d-flex flex-column gap-2"
                        >
                          {filteredSubtasks.filter(s => s.status === status).map((sub, idx) => {
                             const isSubtaskCreator = sub.assignedBy && (sub.assignedBy._id === user?.id || sub.assignedBy === user?.id);
                             const canEditSubtask = canCreate || isSubtaskCreator || (sub.owner && (sub.owner._id === user?.id || sub.owner === user?.id));
                             return (
                               <Draggable key={sub._id} draggableId={sub._id} index={idx} isDragDisabled={!canEditSubtask}>
                                 {(dragProvided) => (
                                   <Card
                                     ref={dragProvided.innerRef}
                                     {...dragProvided.draggableProps}
                                     {...dragProvided.dragHandleProps}
                                     className="shadow-sm border-0 bg-white p-2.5 rounded"
                                     style={{
                                       opacity: canEditSubtask ? 1 : 0.8,
                                       cursor: canEditSubtask ? 'grab' : 'not-allowed',
                                       ...dragProvided.draggableProps.style
                                     }}
                                   >
                                     <div className="d-flex align-items-center justify-content-between mb-1.5">
                                       <div className="d-flex align-items-center gap-1.5">
                                         {!canEditSubtask && <i className="fas fa-lock text-muted" style={{ fontSize: '10px' }}></i>}
                                         <Badge bg="secondary" style={{ fontSize: '9px' }}>{sub.taskId}</Badge>
                                       </div>
                                       <div className="d-flex align-items-center gap-2">
                                         {isSubtaskCreator && (
                                           <div className="d-flex gap-1.5">
                                             <i 
                                               className="fas fa-edit text-primary cursor-pointer" 
                                               style={{ fontSize: '11px' }}
                                               onClick={(e) => { e.stopPropagation(); handleEditSubtaskClick(sub); }}
                                               title="Edit Subtask"
                                             ></i>
                                             <i 
                                               className="fas fa-trash-alt text-danger cursor-pointer" 
                                               style={{ fontSize: '11px' }}
                                               onClick={(e) => { e.stopPropagation(); handleDeleteSubtaskClick(sub._id); }}
                                               title="Delete Subtask"
                                             ></i>
                                           </div>
                                         )}
                                         {getPriorityBadge(sub.priority)}
                                       </div>
                                     </div>
                                     <div className="d-flex flex-column mb-3">
                                       <span className="fw-bold text-slate-dark text-truncate-2" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                         {sub.title}
                                       </span>
                                       {sub.description && (
                                         <span className="text-muted mt-1 text-truncate-2" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                                           {sub.description}
                                         </span>
                                       )}
                                     </div>
                                     <div className="d-flex align-items-center justify-content-between mt-auto">
                                       <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '10.5px' }}>
                                         <i className="far fa-calendar"></i>
                                         <span>{moment(sub.dueDate).format('DD MMM')}</span>
                                       </div>
                                       {sub.owner && (
                                         <img
                                           src={sub.owner.profileImage || `https://ui-avatars.com/api/?name=${sub.owner.firstName}+${sub.owner.lastName}&background=3B82F6&color=fff&size=20`}
                                           alt=""
                                           className="rounded-circle border"
                                           style={{ width: '20px', height: '20px', objectFit: 'cover' }}
                                           title={`${sub.owner.firstName} ${sub.owner.lastName}`}
                                         />
                                       )}
                                     </div>
                                   </Card>
                                 )}
                               </Draggable>
                             );
                           })}
                          {provided.placeholder}
                        </Card.Body>
                      )}
                    </Droppable>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Timeline View Removed */}

          {/* ── 4. CALENDAR VIEW ── */}
          {currentView === 'calendar' && (
            <div className="calendar-view bg-white p-3 rounded border shadow-sm">
              <h5 className="fw-bold mb-3" style={{ fontSize: '14px', color: '#475569' }}>Agenda View</h5>
              <div className="d-flex flex-column gap-2">
                {['Today', 'Tomorrow', 'This Week', 'Next Week', 'Later'].map(period => {
                  let list = [];
                  const today = moment().startOf('day');
                  const tomorrow = moment().add(1, 'day').startOf('day');
                  const endOfWeek = moment().endOf('week');
                  const endOfNextWeek = moment().add(1, 'week').endOf('week');

                  if (period === 'Today') {
                    list = filteredSubtasks.filter(s => moment(s.dueDate).isSame(today, 'day'));
                  } else if (period === 'Tomorrow') {
                    list = filteredSubtasks.filter(s => moment(s.dueDate).isSame(tomorrow, 'day'));
                  } else if (period === 'This Week') {
                    list = filteredSubtasks.filter(s => moment(s.dueDate).isAfter(tomorrow) && moment(s.dueDate).isSameOrBefore(endOfWeek));
                  } else if (period === 'Next Week') {
                    list = filteredSubtasks.filter(s => moment(s.dueDate).isAfter(endOfWeek) && moment(s.dueDate).isSameOrBefore(endOfNextWeek));
                  } else {
                    list = filteredSubtasks.filter(s => moment(s.dueDate).isAfter(endOfNextWeek));
                  }

                  if (list.length === 0) return null;

                  return (
                    <div key={period} className="mb-3">
                      <div className="fw-bold text-muted small uppercase mb-2 border-bottom pb-1" style={{ letterSpacing: '0.5px' }}>{period}</div>
                      <div className="d-flex flex-column gap-2">
                        {list.map(sub => (
                          <div
                            key={sub._id}
                            className="p-2 border rounded bg-white d-flex justify-content-between align-items-center"
                          >
                            <div className="d-flex align-items-center gap-2">
                              <Badge bg="secondary" style={{ fontSize: '9px' }}>{sub.taskId}</Badge>
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>{sub.title}</span>
                              <span className="text-muted small" style={{ fontSize: '11px' }}>({moment(sub.dueDate).format('ll')})</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              {sub.owner && (
                                <img
                                  src={sub.owner.profileImage || `https://ui-avatars.com/api/?name=${sub.owner.firstName}+${sub.owner.lastName}&background=3B82F6&color=fff&size=20`}
                                  alt=""
                                  className="rounded-circle border"
                                  style={{ width: '20px', height: '20px', objectFit: 'cover' }}
                                />
                              )}
                              {getStatusBadge(sub.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {filteredSubtasks.length === 0 && (
                  <div className="text-center py-5 text-muted small">No scheduled subtasks found.</div>
                )}
              </div>
            </div>
          )}

          {/* Analytics View Removed */}

        </DragDropContext>
      )}

      {/* ── Quick Add Subtask Input Form ── */}
      {(parentTaskId || projectId) && canCreate && (
        <Form onSubmit={handleQuickAdd} className="mt-4 p-3 bg-white rounded border shadow-sm d-flex flex-wrap align-items-end gap-3">
          <Form.Group className="flex-grow-1" style={{ minWidth: '200px', width: '100%' }}>
            <Form.Label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>Quick Add Subtask</Form.Label>
            <Form.Control
              type="text"
              placeholder="What needs to be done?"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              style={{ fontSize: '13px', borderRadius: '6px' }}
              required
            />
          </Form.Group>
          <Form.Group style={{ width: '100%' }}>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Add a description (optional)"
              value={quickDescription}
              onChange={(e) => setQuickDescription(e.target.value)}
              style={{ fontSize: '13px', borderRadius: '6px', resize: 'none' }}
            />
          </Form.Group>

          {projectId && (
            <Form.Group style={{ width: '180px' }}>
              <Form.Label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>Parent Task</Form.Label>
              <Form.Select
                value={quickParentTaskId}
                onChange={(e) => setQuickParentTaskId(e.target.value)}
                style={{ fontSize: '13px', borderRadius: '6px' }}
                required
              >
                <option value="">Select Parent Task...</option>
                {projectTasks.map(t => (
                  <option key={t._id} value={t._id}>
                    [{t.taskId}] {t.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}



          <Form.Group style={{ width: '140px' }}>
            <Form.Label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>Due Date</Form.Label>
            <Form.Control
              type="date"
              value={quickDueDate}
              onChange={(e) => setQuickDueDate(e.target.value)}
              style={{ fontSize: '13px', borderRadius: '6px' }}
              required
            />
          </Form.Group>

          <Form.Group style={{ width: '100px' }}>
            <Form.Label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>Priority</Form.Label>
            <Form.Select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value)}
              style={{ fontSize: '13px', borderRadius: '6px' }}
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </Form.Select>
          </Form.Group>

          <Button type="submit" className="btn-emerald text-white px-3.5" style={{ height: '38px', borderRadius: '6px', fontWeight: 600 }} disabled={addingSubtask}>
            {addingSubtask ? 'Adding...' : 'Add'}
          </Button>
        </Form>
      )}

      {/* ── Subtask Edit Modal ── */}
      {editingSubtask && (
        <Modal show={!!editingSubtask} onHide={() => setEditingSubtask(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '16px', fontWeight: 700 }}>Edit Subtask: {editingSubtask.taskId}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveSubtaskEdit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  style={{ fontSize: '13px' }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ fontSize: '13px' }}
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Due Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Priority</Form.Label>
                    <Form.Select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" size="sm" onClick={() => setEditingSubtask(null)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

    </div>
  );
}
