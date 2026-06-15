import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Badge, Button, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

import TaskDetailsPanel from '../components/work/TaskDetailsPanel';
import '../styles/work-management.css';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/api/tasks');
      // Filter for 'My Tasks' only
      const myTasks = response.data.filter(t => t.assignedTo?.some(emp => emp._id === user?.id));
      setTasks(myTasks);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load tasks' });
    } finally {
      setLoading(false);
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

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.project?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modern-tasks-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--wm-text-primary)' }}>My Assigned Tasks</h3>
        <Form.Control 
          type="text" 
          placeholder="Search tasks..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '300px', borderRadius: '8px' }}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : (
        <div className="task-list-clean">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div 
                key={task._id} 
                className="clean-list-item d-flex justify-content-between align-items-center p-3 mb-2" 
                style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--wm-border)', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => handleTaskClick(task)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: '4px', height: '40px', background: getPriorityColor(task.priority), borderRadius: '4px' }}></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--wm-text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.1rem' }}>
                      {task.project || task.department}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--wm-text-primary)' }}>{task.title}</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-4">
                  <div style={{ width: '150px' }}>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem', color: 'var(--wm-text-secondary)' }}>
                      <span>Progress</span>
                      <span>{task.progressPercent || 0}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#eef0f4', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${task.progressPercent}%`, background: 'var(--wm-primary)' }}></div>
                    </div>
                  </div>

                  <div style={{ width: '120px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--wm-text-secondary)', marginBottom: '0.1rem' }}>Due Date</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'var(--wm-danger)' : 'var(--wm-text-primary)' }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  <Badge bg={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'primary' : 'secondary'} style={{ width: '100px', textAlign: 'center', padding: '0.5rem', borderRadius: '6px' }}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5" style={{ background: '#fff', borderRadius: '12px', border: '1px dashed var(--wm-border)' }}>
              <i className="fas fa-check-circle fs-2 mb-3 d-block" style={{ color: 'var(--wm-success)' }}></i>
              <h5 style={{ color: 'var(--wm-text-primary)' }}>You're all caught up!</h5>
              <p style={{ color: 'var(--wm-text-secondary)' }}>No tasks currently assigned to you.</p>
            </div>
          )}
        </div>
      )}

      <TaskDetailsPanel 
        show={showPanel} 
        onHide={() => setShowPanel(false)} 
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

