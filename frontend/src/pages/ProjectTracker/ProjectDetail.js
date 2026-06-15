import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Table, Button, Badge, Row, Col, Form, Card } from 'react-bootstrap';
import api from '../../utils/api';

import { useAuth } from '../../context/AuthContext';

import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

import CreateProjectModal from '../../components/ProjectTracker/CreateProjectModal';
import CreateTaskModal from '../../components/ProjectTracker/CreateTaskModal';
import ProjectTaskDrawer from '../../components/ProjectTracker/ProjectTaskDrawer';
import SubmitDailyUpdateModal from '../../components/ProjectTracker/SubmitDailyUpdateModal';
import Swal from 'sweetalert2';
import SubtaskManager from '../../components/ProjectTracker/SubtaskManager';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  
  // Dashboard / Analytics KPIs
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    blockedTasks: 0,
    delayedTasks: 0,
    averageProgress: 0,
    totalHours: 0,
    submissionRateToday: 0,
    employeeContributions: []
  });

  // Filters for the Excel-like Task Tracker
  const [moduleFilter, setModuleFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Drawer States
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showDailyUpdateModal, setShowDailyUpdateModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [updateToEdit, setUpdateToEdit] = useState(null);

  const [error, setError] = useState(null);

  const isLeaderOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER' || (project && project.leader?._id === user?.id);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDaysLeft = (t) => {
    if (t.status === 'Completed') return 0;
    if (!t.eta) return '-';
    const diff = Math.ceil((new Date(t.eta) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getTypeBadge = (type) => {
    return (
      <span className="badge bg-light text-secondary border px-2 py-0.5 rounded" style={{ fontSize: '10px', fontWeight: 600 }}>
        {type}
      </span>
    );
  };

  const getImpactBadge = (impact) => {
    let bg = '#F1F5F9';
    let color = '#475569';
    let border = '#E2E8F0';
    if (impact === 'High') {
      bg = '#FFF5F5';
      color = '#E53E3E';
      border = '#FED7D7';
    } else if (impact === 'Medium') {
      bg = '#FFFDF5';
      color = '#D69E2E';
      border = '#FEFCBF';
    }
    return (
      <span className="badge px-2 py-0.5 rounded" style={{ backgroundColor: bg, color: color, border: `1px solid ${border}`, fontSize: '10px', fontWeight: 600 }}>
        {impact} Impact
      </span>
    );
  };

  const handleEditTask = (taskId) => {
    // We reuse the create task modal logic, prepopulated
    // For simplicity, typically you'd trigger a modal.
    console.log("Edit task", taskId);
  };

  const handleDeleteTask = (taskId) => {
    Swal.fire({
      title: 'Delete Task?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/project-tasks/${taskId}`);
          Swal.fire({ icon: 'success', title: 'Success', text: 'Task deleted successfully', timer: 2000, showConfirmButton: false });
          fetchProjectData(false);
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete task' });
        }
      }
    });
  };

  const getScheduleCell = (t, daysLeft) => {
    if (t.status === 'Completed') {
      return (
        <div className="d-flex flex-column gap-1">
          <span className="fw-medium text-secondary" style={{ fontSize: '13px' }}>{formatDate(t.eta)}</span>
          <span className="badge bg-light text-success border px-2 py-0.5 rounded" style={{ fontSize: '9.5px', alignSelf: 'start', fontWeight: 600 }}>
            Completed
          </span>
        </div>
      );
    }
    let badgeBg = '#E6FFFA';
    let badgeColor = '#319795';
    let badgeBorder = '#B2F5EA';
    let label = `${daysLeft} days left`;

    if (daysLeft < 0) {
      badgeBg = '#FFF5F5';
      badgeColor = '#E53E3E';
      badgeBorder = '#FED7D7';
      label = `Delayed by ${Math.abs(daysLeft)}d`;
    } else if (daysLeft === 0) {
      badgeBg = '#FFFDF5';
      badgeColor = '#D69E2E';
      badgeBorder = '#FEFCBF';
      label = `Due Today`;
    } else if (daysLeft === 1) {
      label = `1 day left`;
    }

    return (
      <div className="d-flex flex-column gap-1">
        <span className="fw-semibold" style={{ fontSize: '13px', color: '#1E293B' }}>{formatDate(t.eta)}</span>
        <span className="badge px-2 py-0.5 rounded text-truncate" style={{ backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`, fontSize: '9.5px', alignSelf: 'start', fontWeight: 700 }}>
          {label}
        </span>
      </div>
    );
  };

  useEffect(() => {
    if (id) {
      setProject(null);
      setTasks([]);
      setError(null);
      fetchProjectData(true);
    }
  }, [id]);

  const fetchProjectData = async (showSpinner = false) => {
    if (!id || id === 'undefined') return;
    
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      if (id === 'general') {
        setProject({
          _id: 'general',
          name: 'General Tasks',
          code: 'GEN',
          description: 'General tasks that are not associated with any specific project.'
        });
        const tasksRes = await api.get('/api/project-tasks?project=general');
        setTasks(tasksRes.data);
        setTimeline([]);
        setAnalytics({
          totalTasks: tasksRes.data.length,
          completedTasks: tasksRes.data.filter(t => t.status === 'Completed').length,
          inProgressTasks: tasksRes.data.filter(t => t.status === 'In Progress').length,
          blockedTasks: tasksRes.data.filter(t => t.status === 'Blocked').length,
          delayedTasks: 0,
          averageProgress: tasksRes.data.length > 0 ? Math.round(tasksRes.data.reduce((sum, t) => sum + (t.progressPercent || 0), 0) / tasksRes.data.length) : 0,
          totalHours: 0,
          submissionRateToday: 0,
          employeeContributions: []
        });
      } else {
        const results = await Promise.allSettled([
          api.get(`/api/projects/${id}`),
          api.get(`/api/projects/${id}/tasks`),
          api.get(`/api/projects/${id}/timeline`),
          api.get(`/api/projects/${id}/analytics`)
        ]);

        let hasFetchError = false;

        if (results[0].status === 'fulfilled') {
          setProject(results[0].value.data);
          window.dispatchEvent(new Event('projectCreatedOrUpdated'));
        } else {
          hasFetchError = true;
          setError(results[0].reason?.response?.data?.error || 'Failed to load project details');
          // Only show Swal if it's an unexpected error, not an access denied that we handle gracefully
          if (results[0].reason?.response?.status !== 403) {
            Swal.fire({ icon: 'error', title: 'Error', text: results[0].reason?.response?.data?.error || 'Failed to load project metadata' });
          }
        }

        if (results[1].status === 'fulfilled') {
          setTasks(results[1].value.data);
        } else {
          if (!hasFetchError) Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load project tasks' });
        }

        if (results[2].status === 'fulfilled') {
          setTimeline(results[2].value.data);
        } else {
          if (!hasFetchError) Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load project timeline updates' });
        }

        if (results[3].status === 'fulfilled') {
          setAnalytics(results[3].value.data);
        } else {
          console.error('Failed to load project analytics data');
        }
      }
    } catch (e) {
      setError('Failed to load project details');
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load project details' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const token = localStorage.getItem('token');
    const url = `${api.defaults.baseURL || ''}/api/project-tasks/export/excel?projectId=${id}&token=${token || ''}`;
    window.open(url, '_blank');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleDeleteProject = () => {
    Swal.fire({
      title: 'Delete Project?',
      text: "All associated tasks, timeline entries, and daily logs will be deleted permanently.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/projects/${id}`);
          Swal.fire({ icon: 'success', title: 'Success', text: 'Project deleted successfully', timer: 2000, showConfirmButton: false });
          window.dispatchEvent(new Event('projectDeleted'));
          navigate('/project-tracker/projects');
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || 'Failed to delete project' });
        }
      }
    });
  };

  const handleEditUpdate = (update) => {
    setUpdateToEdit(update);
    setShowDailyUpdateModal(true);
  };

  const handleDeleteUpdate = (updateId) => {
    Swal.fire({
      title: 'Delete Work Log?',
      text: "Are you sure you want to delete this daily update log? This will revert any task progress changes.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/projects/daily-updates/${updateId}`);
          Swal.fire({ icon: 'success', title: 'Success', text: 'Daily update log deleted successfully', timer: 2000, showConfirmButton: false });
          fetchProjectData(false);
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || 'Failed to delete update log' });
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return <span className="status-badge completed">Completed</span>;
      case 'In Progress': return <span className="status-badge in-progress">In Progress</span>;
      case 'Review': return <span className="status-badge review">Review</span>;
      case 'Blocked': return <span className="status-badge blocked">Blocked</span>;
      default: return <span className="status-badge pending">Pending</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical': return <span className="priority-badge critical"><span className="priority-dot critical"></span>Critical</span>;
      case 'High': return <span className="priority-badge high"><span className="priority-dot high"></span>High</span>;
      case 'Medium': return <span className="priority-badge medium"><span className="priority-dot medium"></span>Medium</span>;
      default: return <span className="priority-badge low"><span className="priority-dot low"></span>Low</span>;
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.taskId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = !moduleFilter || t.module === moduleFilter;
    const matchesOwner = !ownerFilter || t.owner?._id === ownerFilter;
    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesPriority = !priorityFilter || t.priority === priorityFilter;
    
    return matchesSearch && matchesModule && matchesOwner && matchesStatus && matchesPriority;
  });

  const modulesList = Array.from(new Set(tasks.map(t => t.module).filter(Boolean)));
  const ownersList = Array.from(new Set(tasks.map(t => t.owner).filter(Boolean)));

  const filteredTimeline = timeline.filter(u => {
    if (isLeaderOrAdmin) return true;
    const logUserId = u.userId?._id || u.userId;
    return logUserId && user && logUserId.toString() === user.id.toString();
  });

  const handleRowClick = (taskId) => {
    setSelectedTaskId(taskId);
    setShowDrawer(true);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column h-100" style={{ overflowY: 'auto', paddingBottom: '40px' }}>
        {/* Detail Header Skeleton */}
        <div className="tracker-header">
          <div className="tracker-breadcrumbs">
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/project-tracker/projects')}>Projects</span> / <span className="skeleton skeleton-text d-inline-block" style={{ width: '100px', height: '14px', marginBottom: 0, verticalAlign: 'middle' }}></span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="tracker-title d-flex align-items-center gap-2">
                <span className="skeleton skeleton-text d-inline-block" style={{ width: '220px', height: '32px', marginBottom: 0 }}></span>
                <span className="skeleton skeleton-text d-inline-block" style={{ width: '70px', height: '24px', borderRadius: '12px', marginBottom: 0 }}></span>
              </h1>
              <p className="text-muted small mb-0 mt-1 d-flex align-items-center gap-1">
                Project Code: <span className="skeleton skeleton-text d-inline-block" style={{ width: '50px', height: '14px', marginBottom: 0 }}></span>
              </p>
            </div>
            <div className="skeleton" style={{ width: '120px', height: '38px', borderRadius: '6px' }}></div>
          </div>
        </div>

        <div className="px-4 mt-3">
          {/* Tabs header template (mock tabs) */}
          <div className="modern-tabs nav nav-tabs mb-4 d-flex gap-3 border-bottom" style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
            <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: '6px' }}></div>
            <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: '6px' }}></div>
            <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '6px' }}></div>
            <div className="skeleton" style={{ width: '130px', height: '36px', borderRadius: '6px' }}></div>
            <div className="skeleton" style={{ width: '90px', height: '36px', borderRadius: '6px' }}></div>
          </div>

          <Card className="p-3 border shadow-sm rounded mb-4">
            {/* Filter controls skeleton */}
            <Row className="g-3 mb-4">
              <Col md={3}>
                <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '6px' }}></div>
              </Col>
              <Col md={2}>
                <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '6px' }}></div>
              </Col>
              <Col md={2}>
                <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '6px' }}></div>
              </Col>
              <Col md={2}>
                <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '6px' }}></div>
              </Col>
              <Col md={2}>
                <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '6px' }}></div>
              </Col>
              <Col md={1}>
                <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '6px' }}></div>
              </Col>
            </Row>

            {/* Table/List Skeleton */}
            <div className="excel-table-container">
              <Table className="excel-table mb-0">
                <thead>
                  <tr>
                    <th style={{ minWidth: '240px' }}><div className="skeleton skeleton-text w-50" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-50" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-50" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ width: '100px' }}><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ width: '120px' }}><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ width: '160px' }}><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td style={{ minWidth: '240px' }}>
                        <div className="skeleton skeleton-text w-75" style={{ height: '14px', marginBottom: '6px' }}></div>
                        <div className="skeleton skeleton-text w-25" style={{ height: '10px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-75" style={{ height: '14px', marginBottom: '6px' }}></div>
                        <div className="skeleton skeleton-text w-50" style={{ height: '10px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="skeleton skeleton-avatar" style={{ width: '22px', height: '22px' }}></div>
                          <div className="skeleton skeleton-text w-50" style={{ height: '12px', marginBottom: 0 }}></div>
                        </div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-50" style={{ height: '18px', borderRadius: '12px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-75" style={{ height: '14px', marginBottom: '6px' }}></div>
                        <div className="skeleton skeleton-text w-50" style={{ height: '10px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-50 mb-2" style={{ height: '18px', borderRadius: '4px' }}></div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="skeleton" style={{ width: '80px', height: '6px', borderRadius: '3px' }}></div>
                          <div className="skeleton skeleton-text w-25" style={{ height: '10px', marginBottom: 0 }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5 text-center">
        <i className="fas fa-lock text-muted mb-3" style={{ fontSize: '48px' }}></i>
        <h4 className="fw-bold">{error || 'Access Denied'}</h4>
        <p className="text-muted">You do not have permission to view this project's details or it does not exist.</p>
        <Button variant="primary" onClick={() => navigate('/project-tracker/projects')} className="mt-2">
          Return to Projects
        </Button>
      </div>
    );
  }

  const taskStatusData = [
    { name: 'Pending', value: analytics.totalTasks - analytics.completedTasks - analytics.inProgressTasks - analytics.blockedTasks, color: '#94A3B8' },
    { name: 'In Progress', value: analytics.inProgressTasks, color: '#3B82F6' },
    { name: 'Blocked', value: analytics.blockedTasks, color: '#EF4444' },
    { name: 'Completed', value: analytics.completedTasks, color: '#10B981' }
  ].filter(d => d.value > 0);

  const teamProductivityData = analytics.employeeContributions || [];

  return (
    <div className="d-flex flex-column h-100" style={{ overflowY: 'auto', paddingBottom: '40px' }}>
      {/* Detail Header */}
      <div className="tracker-header">
        <div className="tracker-breadcrumbs">
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/project-tracker/projects')}>Projects</span> / {project.name}
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="tracker-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {project.name}
              {project.status && <Badge bg="success" style={{ fontSize: '11px', padding: '6px 12px' }}>{project.status}</Badge>}
            </h1>
            <p className="text-muted small mb-0 mt-1">Project Code: <strong>{project.code}</strong></p>
          </div>
          <Button className="btn-emerald" onClick={() => setShowCreateTaskModal(true)}>
            <i className="fas fa-user-plus me-1"></i>Assign Task
          </Button>
        </div>
      </div>

      <div className="px-4 mt-3">
        <Tabs defaultActiveKey="tasks" className="modern-tabs mb-4">
          
          {/* TAB 1: TASK TRACKER (Excel-like Grid) - MAIN SCREEN */}
          <Tab eventKey="tasks" title={<><i className="fas fa-th-large me-2"></i>Task Tracker</>}>
            <Card className="p-3 border shadow-sm rounded mb-4">
              
              {/* Advanced Filters */}
              <Row className="g-3 mb-3">
                <Col md={3}>
                  <div className="search-input-wrapper">
                    <i className="fas fa-search search-icon"></i>
                    <Form.Control
                      placeholder="Search task title or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="filter-search-input"
                    />
                  </div>
                </Col>
                <Col md={2}>
                  <Form.Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="filter-select">
                    <option value="">All Modules</option>
                    {modulesList.map(mod => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="filter-select">
                    <option value="">All Owners</option>
                    {ownersList.map(owner => (
                      <option key={owner._id} value={owner._id}>{owner.firstName} {owner.lastName}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="filter-select">
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </Form.Select>
                </Col>
                <Col md={1} className="d-flex align-items-end">
                  <Button className="btn-filter-clear" onClick={() => { setSearchTerm(''); setModuleFilter(''); setOwnerFilter(''); setStatusFilter(''); setPriorityFilter(''); }}>
                    <i className="fas fa-filter me-1"></i>Clear
                  </Button>
                </Col>
              </Row>

              {/* Excel Task Table */}
              {filteredTasks.length === 0 ? (
                <div className="no-tasks-state">
                  <div className="no-tasks-icon-circle">
                    <i className="fas fa-clipboard-list"></i>
                  </div>
                  <h4 className="no-tasks-heading">No matching tasks found</h4>
                  <p className="no-tasks-text">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="excel-table-container">
                  <Table className="excel-table mb-0">
                    <thead>
                      <tr>
                        <th style={{ minWidth: '240px' }}>Task</th>
                        <th>Project / Module</th>
                        <th>Owner</th>
                        <th style={{ width: '100px' }}>Priority</th>
                        <th style={{ width: '120px' }}>Schedule</th>
                        <th style={{ width: '160px' }}>Progress & Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(t => {
                        const daysLeft = getDaysLeft(t);
                        return (
                          <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(t._id)}>
                            <td style={{ whiteSpace: 'normal', minWidth: '240px' }}>
                              <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#1E293B' }}>
                                {t.title}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '13.5px' }}>
                                {project.name}
                              </div>
                              <div className="text-muted small mt-1 d-flex align-items-center gap-1">
                                <i className="fas fa-cubes" style={{ fontSize: '10px', color: '#94A3B8' }}></i>
                                <span>{t.module}</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <img
                                  src={t.owner?.profileImage || `https://ui-avatars.com/api/?name=${t.owner ? `${t.owner.firstName}+${t.owner.lastName}` : 'Unassigned'}&background=10B981&color=fff&size=48`}
                                  alt=""
                                  className="rounded-circle border"
                                  style={{ width: '22px', height: '22px', objectFit: 'cover' }}
                                />
                                <span className="text-truncate" style={{ fontWeight: '500', color: '#1E293B', fontSize: '13px' }}>
                                  {t.owner ? `${t.owner.firstName} ${t.owner.lastName}` : 'Unassigned'}
                                </span>
                              </div>
                            </td>
                            <td>{getPriorityBadge(t.priority)}</td>
                            <td>{getScheduleCell(t, daysLeft)}</td>
                            <td>
                              <div className="mb-1.5">
                                {getStatusBadge(t.status)}
                              </div>
                              <div className="d-flex align-items-center gap-2" style={{ width: '120px' }}>
                                <div className="progress flex-grow-1" style={{ height: '5px', borderRadius: '3px', backgroundColor: '#E2E8F0' }}>
                                  <div className="progress-bar bg-emerald" style={{ width: `${t.progressPercent || 0}%`, borderRadius: '3px' }}></div>
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>{t.progressPercent || 0}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card>
          </Tab>

          {/* TAB 2: SUBTASKS */}
          <Tab eventKey="subtasks" title={<><i className="fas fa-list-ul me-2"></i>Subtasks</>}>
            <Card className="p-3 border shadow-sm rounded mb-4">
              <SubtaskManager 
                projectId={id === 'general' ? 'general' : id} 
                parentType="PROJECT_TASK" 
                canCreate={isLeaderOrAdmin}
                onSubtaskChange={() => fetchProjectData(false)} 
              />
            </Card>
          </Tab>



          {/* TAB 3: DAILY UPDATES (Excel-style Grid) */}
          <Tab eventKey="daily-updates" title={<><i className="fas fa-history me-2"></i>Daily Updates</>}>
            <Card className="p-3 border shadow-sm rounded mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Daily Work Updates Sheet</h5>
              </div>

              {filteredTimeline.length === 0 ? (
                <div className="text-center py-5 text-muted border border-dashed rounded bg-light">
                  <i className="fas fa-history fs-2 mb-3"></i>
                  <p className="mb-0">No daily updates logged for this project yet.</p>
                </div>
              ) : (
                <div className="excel-table-container">
                  <Table className="excel-table mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: '100px', textAlign: 'center' }}>Date</th>
                        <th>Employee</th>
                        <th>Task</th>
                        <th>Module</th>
                        <th>Type</th>
                        <th>Work Done Today</th>
                        <th style={{ textAlign: 'center' }}>Hours</th>
                        <th style={{ textAlign: 'center' }}>Progress %</th>
                        <th>Tomorrow's Plan</th>
                        <th>Blockers</th>
                        <th>Notes/Remark</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTimeline.map(u => (
                        <tr key={u._id}>
                          <td style={{ textAlign: 'center', fontWeight: '500' }}>
                            {new Date(u.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={u.userId?.profileImage || `https://ui-avatars.com/api/?name=${u.userId ? `${u.userId.firstName}+${u.userId.lastName}` : 'User'}&background=10B981&color=fff&size=48`}
                                alt=""
                                className="rounded-circle border"
                                style={{ width: '22px', height: '22px', objectFit: 'cover' }}
                              />
                              <span className="text-truncate" style={{ fontWeight: '500' }}>
                                {u.userId ? `${u.userId.firstName} ${u.userId.lastName}` : 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td style={{ minWidth: '150px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {u.taskId ? (
                              <>
                                <strong className="text-secondary me-1">{u.taskId.taskId}:</strong>
                                {u.taskId.title}
                              </>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{u.module || 'General'}</td>
                          <td>
                            {u.taskType ? (
                              <span className="badge bg-light text-dark border" style={{ fontSize: '11px' }}>{u.taskType}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td style={{ minWidth: '220px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '12.5px', color: '#334155' }}>
                            {u.workDone}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--tracker-primary)' }}>
                            {u.hoursWorked}h
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <div className="progress" style={{ width: '50px', height: '4px', borderRadius: '2px' }}>
                                <div className="progress-bar bg-emerald" style={{ width: `${u.progressPercent || 0}%` }}></div>
                              </div>
                              <span style={{ fontSize: '10.5px', fontWeight: 600 }}>{u.progressPercent || 0}%</span>
                            </div>
                          </td>
                          <td style={{ minWidth: '180px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '12px' }}>
                            {u.tomorrowPlan || '-'}
                          </td>
                          <td className={u.blockers ? 'text-danger fw-semibold' : ''} style={{ minWidth: '150px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {u.blockers ? (
                              <><i className="fas fa-exclamation-triangle me-1"></i>{u.blockers}</>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className={u.remarks ? 'text-warning-emphasis' : 'text-muted'} style={{ minWidth: '180px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '12px', fontStyle: u.remarks ? 'italic' : 'normal' }}>
                            {u.remarks || 'No remarks'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {user && (user.id === u.userId?._id || user.id === u.userId || isLeaderOrAdmin) && (
                              <div className="d-flex gap-1 justify-content-center">
                                <Button
                                  size="sm"
                                  variant="light"
                                  className="p-0 border d-flex align-items-center justify-content-center"
                                  style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                                  onClick={(e) => { e.stopPropagation(); handleEditUpdate(u); }}
                                  title="Edit Update"
                                >
                                  <i className="fas fa-edit text-secondary" style={{ fontSize: '10px' }}></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="light"
                                  className="p-0 border d-flex align-items-center justify-content-center"
                                  style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                                  onClick={(e) => { e.stopPropagation(); handleDeleteUpdate(u._id); }}
                                  title="Delete Update"
                                >
                                  <i className="fas fa-trash text-danger" style={{ fontSize: '10px' }}></i>
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card>
          </Tab>

          {/* TAB 4: TEAM MEMBERS */}
          <Tab eventKey="team-members" title={<><i className="fas fa-users me-2"></i>Team Members</>}>
            <Card className="p-4 border shadow-sm">
              <h5 className="fw-bold mb-4">Project Leader & Team Members</h5>
              <Row className="g-4">
                {project.leader && (
                  <Col md={4}>
                    <div className="p-3 border rounded shadow-sm d-flex gap-3 align-items-center" style={{ background: 'var(--tracker-primary-light)', borderLeft: '4px solid var(--tracker-primary)' }}>
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white bg-success" style={{ width: '44px', height: '44px', fontSize: '15px' }}>
                        {project.leader.firstName[0]}{project.leader.lastName[0]}
                      </div>
                      <div>
                        <div className="fw-bold">{project.leader.firstName} {project.leader.lastName}</div>
                        <div className="small text-muted">{project.leader.designation || 'Project Leader'}</div>
                        <div className="badge bg-success mt-1" style={{ fontSize: '10px' }}>Leader</div>
                      </div>
                    </div>
                  </Col>
                )}

                {project.members?.map(m => (
                  <Col key={m._id} md={4}>
                    <div className="p-3 border rounded shadow-sm d-flex gap-3 align-items-center" style={{ background: '#FFFFFF' }}>
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark bg-light" style={{ width: '44px', height: '44px', fontSize: '15px' }}>
                        {m.firstName[0]}{m.lastName[0]}
                      </div>
                      <div>
                        <div className="fw-bold">{m.firstName} {m.lastName}</div>
                        <div className="small text-muted">{m.designation || 'Team Member'}</div>
                        <div className="badge bg-secondary mt-1" style={{ fontSize: '10px' }}>Member</div>
                      </div>
                    </div>
                  </Col>
                ))}

                {(!project.leader && (!project.members || project.members.length === 0)) && (
                  <Col xs={12} className="text-center text-muted py-4">No team members assigned.</Col>
                )}
              </Row>
            </Card>
          </Tab>

          {/* TAB 5: REPORTS & EXPORTS */}
          <Tab eventKey="reports" title={<><i className="fas fa-chart-pie me-2"></i>Reports</>}>
            <Card className="p-4 border shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Project Performance Reports</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-success" size="sm" onClick={handleExportExcel} className="d-flex align-items-center gap-1">
                    <i className="far fa-file-excel fs-6"></i> Export to Excel
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={handleExportPDF} className="d-flex align-items-center gap-1">
                    <i className="far fa-file-pdf fs-6"></i> Export as PDF
                  </Button>
                </div>
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <Card className="p-3 border">
                    <h6 className="fw-bold text-center mb-3">Tasks Status Distribution</h6>
                    {taskStatusData.length === 0 ? (
                      <div className="text-center py-5 text-muted small">No task analytics to display.</div>
                    ) : (
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={taskStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {taskStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="p-3 border">
                    <h6 className="fw-bold text-center mb-3">Team Productivity (Hours worked)</h6>
                    {teamProductivityData.length === 0 ? (
                      <div className="text-center py-5 text-muted small">No work logs to display.</div>
                    ) : (
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <BarChart data={teamProductivityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value} hrs`, 'Hours Worked']} />
                            <Legend />
                            <Bar dataKey="hours" name="Total Hours Logged" fill="#10B981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </Card>
          </Tab>

        </Tabs>
      </div>

      {/* Modals */}
      <CreateProjectModal
        show={showEditProjectModal}
        onHide={() => setShowEditProjectModal(false)}
        projectToEdit={project}
        onProjectUpdated={() => fetchProjectData(true)}
      />

      <CreateTaskModal
        show={showCreateTaskModal}
        onHide={() => setShowCreateTaskModal(false)}
        projectId={id === 'general' ? '' : id}
        onTaskCreated={() => fetchProjectData(true)}
      />

      <SubmitDailyUpdateModal
        show={showDailyUpdateModal}
        onHide={() => { setShowDailyUpdateModal(false); setUpdateToEdit(null); }}
        preselectedProjectId={id === 'general' ? '' : id}
        updateToEdit={updateToEdit}
        onUpdateSubmitted={() => fetchProjectData(false)}
      />

      <ProjectTaskDrawer
        show={showDrawer}
        onHide={() => setShowDrawer(false)}
        taskId={selectedTaskId}
        onTaskUpdated={() => fetchProjectData(false)}
      />
    </div>
  );
}
