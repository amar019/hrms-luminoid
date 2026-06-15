import React, { useState, useEffect } from 'react';
import { Container, Nav, Badge, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import TaskDashboard from '../components/work/TaskDashboard';
import TaskBoard from '../components/work/TaskBoard';
import Timesheet from '../components/work/Timesheet';
import Tasks from './Tasks';
import TaskManagement from './TaskManagement';
import '../styles/work-management.css';

export default function WorkManagementHub() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check query params for tab selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tasksRes, workLogsRes] = await Promise.all([
          api.get('/api/tasks'),
          api.get('/api/work-logs')
        ]);
        setTasks(tasksRes.data);
        setWorkLogs(workLogsRes.data.logs || []);
      } catch (error) {
        console.error("Error fetching work data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/work-management?tab=${tab}`, { replace: true });
  };

  const isManagerOrAdmin = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);

  return (
    <div className="work-management-hub">
      <div className="hub-header">
        <div>
          <h1 className="hub-title">Work Management</h1>
          <p className="hub-subtitle">Manage projects, tasks, and track team productivity</p>
        </div>
        <div className="hub-actions">
          {/* Global actions could go here */}
        </div>
      </div>

      <div className="hub-navigation">
        <Nav variant="pills" activeKey={activeTab} onSelect={handleTabChange} className="modern-nav-pills">
          <Nav.Item>
            <Nav.Link eventKey="dashboard">
              <i className="fas fa-chart-pie me-2"></i>Dashboard
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link eventKey="board">
              <i className="fas fa-columns me-2"></i>Board
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link eventKey="my-tasks">
              <i className="fas fa-list-check me-2"></i>My Tasks
              <Badge bg="primary" className="ms-2 rounded-pill">
                {tasks.filter(t => t.assignedTo?.some(emp => emp._id === user?.id) && t.status !== 'COMPLETED').length}
              </Badge>
            </Nav.Link>
          </Nav.Item>
          
          {isManagerOrAdmin && (
            <Nav.Item>
              <Nav.Link eventKey="all-tasks">
                <i className="fas fa-layer-group me-2"></i>All Tasks
              </Nav.Link>
            </Nav.Item>
          )}

          <Nav.Item>
            <Nav.Link eventKey="timesheet">
              <i className="fas fa-clock me-2"></i>Timesheet
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      <div className="hub-content">
        {loading ? (
          <div className="hub-loading">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted">Loading your workspace...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <TaskDashboard tasks={tasks} workLogs={workLogs} isManager={isManagerOrAdmin} />}
            {activeTab === 'board' && <TaskBoard tasks={tasks} onTasksChange={setTasks} />}
            {activeTab === 'my-tasks' && <Tasks />} {/* Embed existing Tasks component or a refactored version */}
            {activeTab === 'all-tasks' && isManagerOrAdmin && <TaskManagement />} {/* Embed existing TaskManagement */}
            {activeTab === 'timesheet' && <Timesheet workLogs={workLogs} onWorkLogsChange={setWorkLogs} />}
          </>
        )}
      </div>
    </div>
  );
};

