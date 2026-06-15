import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Form, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

import Swal from 'sweetalert2';
import TaskDetailsPanel from '../components/work/TaskDetailsPanel';
import TaskCreationForm from '../components/work/TaskCreationForm';
import '../styles/work-management.css';

export default function TaskManagement() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/api/tasks');
      setTasks(response.data);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load tasks' });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'HIGH': return <span className="wm-badge wm-badge-danger">High</span>;
      case 'MEDIUM': return <span className="wm-badge wm-badge-warning">Medium</span>;
      case 'LOW': return <span className="wm-badge wm-badge-info">Low</span>;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'COMPLETED': return <span className="wm-badge wm-badge-success">Completed</span>;
      case 'IN_PROGRESS': return <span className="wm-badge wm-badge-primary">In Progress</span>;
      case 'REVIEW': return <span className="wm-badge wm-badge-warning">Review</span>;
      default: return <span className="wm-badge wm-badge-info" style={{background: '#f3f4f6', color: '#4b5563'}}>{status.replace('_', ' ')}</span>;
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowPanel(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
    if (selectedTask?._id === updatedTask._id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskCreated = (newTask) => {
    // If it's an edit
    if (editTask) {
      setTasks(tasks.map(t => t._id === newTask._id ? newTask : t));
    } else {
      setTasks([newTask, ...tasks]);
    }
    setEditTask(null);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'Delete Task?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/tasks/${id}`);
        setTasks(tasks.filter(t => t._id !== id));
        Swal.fire({ icon: 'success', title: 'Success', text: 'Task deleted successfully', timer: 2000, showConfirmButton: false });
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete task' });
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus, e) => {
    e.stopPropagation();
    try {
      const response = await api.put(`/api/tasks/${taskId}/status`, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? response.data : t));
      Swal.fire({ icon: 'success', title: 'Success', text: 'Status updated', timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status' });
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.assignedTo?.some(emp => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter ? t.status === statusFilter : true;
    const matchPriority = priorityFilter ? t.priority === priorityFilter : true;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="modern-task-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex gap-3">
          <Form.Control 
            type="text" 
            placeholder="Search tasks, assignees, projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '300px', borderRadius: '8px' }}
          />
          <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px', borderRadius: '8px' }}>
            <option value="">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="COMPLETED">Completed</option>
          </Form.Select>
          <Form.Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ width: '150px', borderRadius: '8px' }}>
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Form.Select>
        </div>
        <Button variant="primary" style={{ borderRadius: '8px', background: 'var(--wm-primary)', border: 'none', fontWeight: 600 }} onClick={() => setShowCreationForm(true)}>
          <i className="fas fa-plus me-2"></i>Create Task
        </Button>
      </div>

      <div className="wm-card" style={{ padding: 0, overflow: 'hidden' }}>
        <Table className="wm-table" responsive hover style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Task Details</th>
              <th>Project</th>
              <th>Assignees</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                </td>
              </tr>
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <tr key={task._id} onClick={() => handleTaskClick(task)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--wm-text-primary)' }}>{task.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--wm-text-secondary)' }}>Created: {new Date(task.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{task.project || '-'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--wm-text-secondary)' }}>{task.department}</div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {task.assignedTo?.slice(0, 3).map((emp, i) => (
                        <div key={emp._id} title={`${emp.firstName} ${emp.lastName}`} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--wm-primary-light)', color: 'var(--wm-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, border: '2px solid #fff', marginLeft: i > 0 ? '-10px' : '0' }}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                      ))}
                      {task.assignedTo?.length > 3 && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f3f4f6', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, border: '2px solid #fff', marginLeft: '-10px' }}>
                          +{task.assignedTo.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ color: new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'var(--wm-danger)' : 'var(--wm-text-primary)', fontWeight: new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 600 : 400 }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td>{getPriorityBadge(task.priority)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Dropdown size="sm">
                      <Dropdown.Toggle as="div" style={{ cursor: 'pointer', display: 'inline-block' }}>
                        {getStatusBadge(task.status)}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={(e) => handleStatusChange(task._id, 'ASSIGNED', e)}>Assigned</Dropdown.Item>
                        <Dropdown.Item onClick={(e) => handleStatusChange(task._id, 'IN_PROGRESS', e)}>In Progress</Dropdown.Item>
                        <Dropdown.Item onClick={(e) => handleStatusChange(task._id, 'REVIEW', e)}>Review</Dropdown.Item>
                        <Dropdown.Item onClick={(e) => handleStatusChange(task._id, 'COMPLETED', e)}>Completed</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                  <td className="text-end">
                    <Button variant="light" size="sm" className="me-2" style={{ borderRadius: '6px' }} onClick={(e) => { e.stopPropagation(); setEditTask(task); setShowCreationForm(true); }}>
                      <i className="fas fa-edit text-secondary"></i>
                    </Button>
                    <Button variant="light" size="sm" style={{ borderRadius: '6px' }} onClick={(e) => handleDelete(task._id, e)}>
                      <i className="fas fa-trash text-danger"></i>
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  <div style={{ color: 'var(--wm-text-secondary)' }}>
                    <i className="fas fa-search fs-2 mb-3 d-block"></i>
                    <p>No tasks match your criteria</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <TaskDetailsPanel 
        show={showPanel} 
        onHide={() => setShowPanel(false)} 
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
      />

      <TaskCreationForm 
        show={showCreationForm}
        onHide={() => { setShowCreationForm(false); setEditTask(null); }}
        onTaskCreated={handleTaskCreated}
        editTask={editTask}
      />
    </div>
  );
};

