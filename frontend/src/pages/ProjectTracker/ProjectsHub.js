import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, Badge, Card, Tabs, Tab, Table, Form, ProgressBar, Modal } from 'react-bootstrap';
import api from '../../utils/api';

import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../../components/ProjectTracker/CreateProjectModal';
import SubmitDailyUpdateModal from '../../components/ProjectTracker/SubmitDailyUpdateModal';
import CreateTaskModal from '../../components/ProjectTracker/CreateTaskModal';
import Swal from 'sweetalert2';

export default function ProjectsHub() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  // Tabs & Performance stats states
  const [activeTab, setActiveTab] = useState('projects');
  const [performanceData, setPerformanceData] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceSearch, setPerformanceSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    delayedProjects: 0,
    projectLeaders: [],
    projectProgress: [],
    recentUpdates: []
  });

  const isElevated = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);

  const performanceStaleRef = React.useRef(true);

  const fetchPerformanceData = async () => {
    setPerformanceLoading(true);
    try {
      const res = await api.get('/api/projects/dashboard/employee-performance');
      setPerformanceData(res.data);
      performanceStaleRef.current = false;
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load employee performance stats' });
    } finally {
      setPerformanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'performance' && performanceStaleRef.current) {
      fetchPerformanceData();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get('/api/projects'),
        api.get('/api/projects/dashboard/stats')
      ]);

      if (results[0].status === 'fulfilled') {
        setProjects(results[0].value.data);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load projects list' });
      }

      if (results[1].status === 'fulfilled') {
        setStats(results[1].value.data);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load project dashboard stats' });
      }

      // Dispatch custom event to update sidebar projects list
      window.dispatchEvent(new Event('projectCreatedOrUpdated'));
      // Mark performance data as stale so it re-fetches on next tab visit
      performanceStaleRef.current = true;
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load project dashboard details' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (projId) => {
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
          await api.delete(`/api/projects/${projId}`);
          Swal.fire({ icon: 'success', title: 'Success', text: 'Project deleted successfully', timer: 2000, showConfirmButton: false });
          window.dispatchEvent(new Event('projectDeleted'));
          fetchData();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || 'Failed to delete project' });
        }
      }
    });
  };

  const getAvatarUrl = (u) => {
    if (u?.profileImage) return u.profileImage;
    const name = u ? `${u.firstName}+${u.lastName}` : 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=10B981&color=fff&size=128`;
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL': return <Badge bg="danger">Critical</Badge>;
      case 'HIGH': return <Badge bg="warning" className="text-dark">High</Badge>;
      case 'MEDIUM': return <Badge bg="primary">Medium</Badge>;
      default: return <Badge bg="secondary">Low</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <Badge bg="success">Active</Badge>;
      case 'Completed': return <Badge bg="info">Completed</Badge>;
      case 'On Hold': return <Badge bg="warning" className="text-dark">On Hold</Badge>;
      case 'Cancelled': return <Badge bg="danger">Cancelled</Badge>;
      default: return <Badge bg="secondary">Planning</Badge>;
    }
  };

  const getProgressColor = (pct) => {
    if (pct >= 90) return 'green';
    if (pct >= 70) return 'blue';
    if (pct >= 40) return 'orange';
    return 'red';
  };

  const getRankClass = (idx) => {
    if (idx === 0) return 'rank-1';
    if (idx === 1) return 'rank-2';
    if (idx === 2) return 'rank-3';
    return 'rank-default';
  };

  // Computed performance values
  const filteredPerformance = performanceData.filter(emp => {
    const term = performanceSearch.toLowerCase();
    return emp.name.toLowerCase().includes(term) || emp.designation.toLowerCase().includes(term);
  });

  const topPerformer = performanceData.length > 0 && performanceData[0].totalTasks > 0 ? performanceData[0] : null;

  const totalTasksAll = performanceData.reduce((acc, emp) => acc + (emp.totalTasks || 0), 0);
  const totalCompletedAll = performanceData.reduce((acc, emp) => acc + (emp.completedTasks || 0), 0);
  const avgCompletion = performanceData.length > 0
    ? Math.round(performanceData.reduce((acc, emp) => acc + (emp.completionPercentage || 0), 0) / performanceData.length)
    : 0;

  return (
    <div className="d-flex flex-column h-100" style={{ overflowY: 'auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="tracker-header">
        <div className="tracker-breadcrumbs">Project & Task Management</div>
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="tracker-title">Projects Tracker</h1>
          <div className="d-flex gap-2">
            <Button className="btn-emerald text-white" onClick={() => setShowUpdateModal(true)}>
              <i className="fas fa-edit me-1"></i>Submit Daily Update
            </Button>
            {isElevated && (
              <>
                <Button className="btn-emerald text-white" onClick={() => setShowCreateTaskModal(true)}>
                  <i className="fas fa-tasks me-1"></i>Assign Task
                </Button>
                <Button className="btn-emerald text-white" onClick={() => setShowCreateModal(true)}>
                  <i className="fas fa-plus me-1"></i>Create Project
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-3">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="modern-tabs mb-4">
          
          {/* TAB 1: PROJECTS DIRECTORY */}
          <Tab eventKey="projects" title={<><i className="fas fa-folder me-2"></i>Projects Directory</>}>
            {loading ? (
              <>
                {/* Project Metrics Grid Skeleton */}
                <Row className="g-4 mb-4">
                  {[1, 2, 3, 4].map(i => (
                    <Col key={i} md={3}>
                      <div className="tracker-metric-card border rounded p-3 text-center skeleton-card" style={{ height: '94px', background: '#F8FAFC', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                        <div className="skeleton skeleton-text w-50 mx-auto" style={{ height: '10px' }}></div>
                        <div className="skeleton skeleton-text w-25 mx-auto mt-2" style={{ height: '24px' }}></div>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* Title Skeleton */}
                <div className="skeleton skeleton-text w-25 mb-4" style={{ height: '20px' }}></div>

                {/* Project Cards Grid Skeleton */}
                <Row className="g-4">
                  {[1, 2, 3].map(i => (
                    <Col key={i} md={4}>
                      <div className="card border p-4 h-100 skeleton-card" style={{ height: '240px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: 'none' }}>
                        <div className="skeleton skeleton-text w-75 mb-3" style={{ height: '18px' }}></div>
                        <div className="d-flex gap-2 mb-3">
                          <div className="skeleton skeleton-text" style={{ width: '80px', height: '18px', borderRadius: '20px' }}></div>
                          <div className="skeleton skeleton-text" style={{ width: '60px', height: '18px', borderRadius: '20px' }}></div>
                        </div>
                        <div className="skeleton skeleton-text w-100 mb-2" style={{ height: '12px' }}></div>
                        <div className="skeleton skeleton-text w-100 mb-4" style={{ height: '12px' }}></div>
                        <div className="d-flex align-items-center mt-auto pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                          <div className="skeleton skeleton-avatar" style={{ width: '28px', height: '28px' }}></div>
                          <div className="skeleton skeleton-text w-50 ms-3" style={{ height: '14px' }}></div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            ) : (
              <>
                {/* Project Metrics Grid */}
                <Row className="g-4 mb-4">
                  <Col md={3}>
                    <div className="tracker-metric-card border rounded p-3 text-center">
                      <div style={{ fontSize: '11px', color: 'var(--tracker-text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Projects</div>
                      <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--tracker-text)', marginTop: '4px' }}>{stats.totalProjects}</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="tracker-metric-card border rounded p-3 text-center">
                      <div style={{ fontSize: '11px', color: 'var(--tracker-text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Projects</div>
                      <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--tracker-primary)', marginTop: '4px' }}>{stats.activeProjects}</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="tracker-metric-card border rounded p-3 text-center">
                      <div style={{ fontSize: '11px', color: 'var(--tracker-text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Projects</div>
                      <div style={{ fontSize: '32px', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>{stats.completedProjects}</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="tracker-metric-card border rounded p-3 text-center">
                      <div style={{ fontSize: '11px', color: 'var(--tracker-text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delayed Projects</div>
                      <div style={{ fontSize: '32px', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>{stats.delayedProjects || 0}</div>
                    </div>
                  </Col>
                </Row>

                {/* Project List / Grid */}
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--tracker-text)' }} className="mb-3">
                  <i className="fas fa-folder me-2 text-emerald"></i>Projects Directory
                </h4>

                {projects.length === 0 ? (
                  <div className="card p-5 text-center text-muted shadow-sm border rounded">
                    <i className="fas fa-folder-open fs-1 mb-3 text-muted" style={{ opacity: 0.5 }}></i>
                    <h5 className="fw-bold">No projects found</h5>
                    <p className="small mb-0">Create one to begin managing workflows.</p>
                  </div>
                ) : (
                  <Row className="g-4">
                    {projects.map(p => {
                      const pLeaderId = p.leader?._id || p.leader;
                      const canManage = isElevated || (pLeaderId && user?.id && pLeaderId.toString() === user.id.toString());
                      return (
                        <Col key={p._id} md={4}>
                          <Card
                            className="h-100 shadow-sm hover-lift border"
                            onClick={() => navigate(`/project-tracker/projects/${p._id}`)}
                            style={{
                              cursor: 'pointer',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            {/* Premium Top Emerald line */}
                            <div style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0,
                              height: '4px',
                              background: 'linear-gradient(90deg, var(--tracker-primary) 0%, #3B82F6 100%)'
                            }}></div>

                            <Card.Body className="p-4 d-flex flex-column h-100" style={{ paddingTop: '20px' }}>
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                                <h4 className="fw-bold text-dark text-truncate m-0" style={{ fontSize: '16px', flexGrow: 1 }} title={p.name}>
                                  {p.name}
                                </h4>
                                {canManage && (
                                <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="light"
                                    className="p-0 border d-flex align-items-center justify-content-center"
                                    style={{ width: '26px', height: '26px', borderRadius: '4px' }}
                                    onClick={() => {
                                      setProjectToEdit(p);
                                      setShowCreateModal(true);
                                    }}
                                    title="Edit Project"
                                  >
                                    <i className="fas fa-edit text-secondary" style={{ fontSize: '11px' }}></i>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="light"
                                    className="p-0 border d-flex align-items-center justify-content-center"
                                    style={{ width: '26px', height: '26px', borderRadius: '4px' }}
                                    onClick={() => handleDeleteClick(p._id)}
                                    title="Delete Project"
                                  >
                                    <i className="fas fa-trash text-danger" style={{ fontSize: '11px' }}></i>
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <Badge bg="light" className="text-secondary border">Code: {p.code}</Badge>
                              {getStatusBadge(p.status)}
                            </div>

                            <p className="text-muted mb-4 small flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '12.5px', lineHeight: '1.5' }}>
                              {p.description || 'No description provided.'}
                            </p>

                            {/* Project Leader Info */}
                            <div className="d-flex align-items-center p-2 rounded mb-3" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                              <img
                                src={getAvatarUrl(p.leader)}
                                alt=""
                                className="rounded-circle me-2 border border-2 border-white shadow-sm"
                                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${p.leader ? `${p.leader.firstName}+${p.leader.lastName}` : 'Unassigned'}&background=10B981&color=fff&size=128`;
                                }}
                              />
                              <div className="overflow-hidden" style={{ minWidth: 0 }}>
                                <div className="text-muted" style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 600 }}>Project Lead</div>
                                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '12px', lineHeight: '1.2' }}>
                                  {p.leader ? `${p.leader.firstName} ${p.leader.lastName}` : 'Unassigned'}
                                </div>
                              </div>
                            </div>

                            {/* Tasks Statistics */}
                            <div className="d-flex justify-content-between align-items-center mb-3 p-2 px-3 rounded-3" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', fontSize: '12px' }}>
                              <span className="text-muted fw-semibold">Tasks Tracker</span>
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-warning-subtle text-warning-emphasis fw-bold border" style={{ borderColor: '#FCD34D' }}>
                                  {p.openTasks || 0} Open
                                </span>
                                <span className="badge bg-success-subtle text-success-emphasis fw-bold border" style={{ borderColor: '#6EE7B7' }}>
                                  {p.completedTasks || 0} Completed
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '11px' }}>
                                <span className="text-muted">Progress</span>
                                <span className="fw-bold">{p.progressPercent || 0}%</span>
                              </div>
                              <div className="progress" style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{
                                    width: `${p.progressPercent || 0}%`,
                                    background: 'linear-gradient(90deg, var(--tracker-primary) 0%, #3B82F6 100%)',
                                    borderRadius: '3px'
                                  }}
                                  aria-valuenow={p.progressPercent || 0}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                ></div>
                              </div>
                            </div>

                            {/* Team Avatar Stack */}
                            <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                              <span className="text-muted" style={{ fontSize: '11.5px', fontWeight: 500 }}>Team Members</span>
                              <div className="avatar-group">
                                {p.members?.slice(0, 4).map((m, idx) => (
                                  <img
                                    key={m._id}
                                    src={getAvatarUrl(m)}
                                    alt=""
                                    className="avatar-stack-item"
                                    style={{ zIndex: 10 - idx }}
                                    title={`${m.firstName} ${m.lastName}`}
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${m.firstName}+${m.lastName}&background=3B82F6&color=fff&size=128`;
                                    }}
                                  />
                                ))}
                                {p.members?.length > 4 && (
                                  <div
                                    className="rounded-circle bg-light border d-flex align-items-center justify-content-center text-secondary fw-bold shadow-sm"
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      fontSize: '9px',
                                      marginLeft: '-6px',
                                      zIndex: 5
                                    }}
                                    title={`${p.members.length - 4} more team members`}
                                  >
                                    +{p.members.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      );
                    })}
                  </Row>
                )}
              </>
            )}
          </Tab>

          {/* TAB 2: EMPLOYEE PERFORMANCE */}
          <Tab eventKey="performance" title={<><i className="fas fa-chart-line me-2"></i>Employee Performance</>}>
            {performanceLoading ? (
              <>
                {/* Premium Skeleton Loaders */}
                <Row className="g-4 mb-4">
                  {[1, 2, 3, 4].map(i => (
                    <Col key={i} md={3}>
                      <div className="perf-skeleton-card"></div>
                    </Col>
                  ))}
                </Row>

                {/* Top Performer Skeleton */}
                <div className="perf-skeleton-performer mb-4"></div>

                {/* Search Skeleton */}
                <div className="skeleton mb-4" style={{ width: '320px', height: '40px', borderRadius: '8px' }}></div>

                {/* Table Skeleton */}
                <Card className="p-3 border shadow-sm rounded mb-4">
                  <div className="excel-table-container">
                    <Table className="excel-table mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: '50px' }}><div className="skeleton skeleton-text w-50" style={{ height: '12px', marginBottom: 0 }}></div></th>
                          <th style={{ minWidth: '220px' }}><div className="skeleton skeleton-text w-50" style={{ height: '12px', marginBottom: 0 }}></div></th>
                          {[1, 2, 3, 4, 5, 6].map(i => (
                            <th key={i}><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                          ))}
                          <th style={{ width: '160px' }}><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <tr key={i}>
                            <td><div className="skeleton skeleton-text" style={{ width: '26px', height: '26px', borderRadius: '50%', marginBottom: 0 }}></div></td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="skeleton skeleton-avatar" style={{ width: '34px', height: '34px' }}></div>
                                <div>
                                  <div className="skeleton skeleton-text" style={{ width: '130px', height: '14px', marginBottom: '4px' }}></div>
                                  <div className="skeleton skeleton-text" style={{ width: '90px', height: '10px', marginBottom: 0 }}></div>
                                </div>
                              </div>
                            </td>
                            {[1, 2, 3, 4, 5, 6].map(j => (
                              <td key={j}><div className="skeleton skeleton-text w-50 mx-auto" style={{ height: '14px', marginBottom: 0 }}></div></td>
                            ))}
                            <td>
                              <div className="skeleton skeleton-text w-25 mb-1" style={{ height: '12px' }}></div>
                              <div className="skeleton" style={{ width: '100px', height: '7px', borderRadius: '4px' }}></div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              </>
            ) : performanceData.length === 0 ? (
              /* Empty State */
              <div className="card p-5 text-center shadow-sm border rounded bg-white" style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.3 }}>📊</div>
                <h5 className="fw-bold" style={{ color: '#334155' }}>No task activity found for employees yet</h5>
                <p className="text-muted small mb-0" style={{ maxWidth: '400px', margin: '0 auto' }}>
                  Assign tasks to employees through the Projects module to start tracking performance and productivity metrics.
                </p>
              </div>
            ) : (
              <>
                {/* Premium Gradient Metric Cards */}
                <Row className="g-4 mb-4">
                  <Col md={3}>
                    <div className="perf-metric-card">
                      <div className="perf-metric-icon"><i className="fas fa-users"></i></div>
                      <div className="perf-metric-label">Total Employees</div>
                      <div className="perf-metric-value">{performanceData.length}</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="perf-metric-card">
                      <div className="perf-metric-icon"><i className="fas fa-clipboard-list"></i></div>
                      <div className="perf-metric-label">Total Tasks</div>
                      <div className="perf-metric-value">{totalTasksAll}</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="perf-metric-card">
                      <div className="perf-metric-icon"><i className="fas fa-check-circle"></i></div>
                      <div className="perf-metric-label">Completed Tasks</div>
                      <div className="perf-metric-value">{totalCompletedAll}</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="perf-metric-card">
                      <div className="perf-metric-icon"><i className="fas fa-chart-pie"></i></div>
                      <div className="perf-metric-label">Avg Completion</div>
                      <div className="perf-metric-value">{avgCompletion}%</div>
                    </div>
                  </Col>
                </Row>

                {/* Top Performer Card */}
                {topPerformer && (
                  <div className="top-performer-card mb-4">
                    <div className="top-performer-decor-circle"></div>
                    <div className="top-performer-decor-dots"></div>
                    <div className="top-performer-decor-wave"></div>
                    <div className="top-performer-card-content">
                      <div className="top-performer-badge-wrap">
                        <div className="top-performer-gold-badge">
                          <span className="top-performer-badge-icon">
                            <i className="fas fa-trophy"></i>
                          </span>
                          <span className="top-performer-badge-text">Top Performer</span>
                        </div>
                      </div>
                      <div className="top-performer-profile-section">
                        <div className="top-performer-avatar-container">
                          <span className="sparkle sparkle-left">✦</span>
                          <div className="top-performer-avatar-ring">
                            <img
                              src={topPerformer.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(topPerformer.name)}&background=F59E0B&color=fff&size=256`}
                              alt=""
                              className="top-performer-avatar"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topPerformer.name)}&background=F59E0B&color=fff&size=256`;
                              }}
                            />
                          </div>
                          <span className="sparkle sparkle-right">✦</span>
                        </div>
                        <div className="top-performer-info">
                          <h3 className="top-performer-name-text">{topPerformer.name}</h3>
                          <div className="top-performer-name-underline"></div>
                          <p className="top-performer-designation-text">{topPerformer.designation}</p>
                        </div>
                      </div>
                      <div className="top-performer-stats-row">
                        <div className="top-performer-stat-box">
                          <div className="top-performer-stat-icon-box">
                            <i className="fas fa-clipboard-check"></i>
                          </div>
                          <div className="top-performer-stat-info">
                            <div className="top-performer-stat-num">{topPerformer.completedTasks}</div>
                            <div className="top-performer-stat-lbl">Completed</div>
                          </div>
                        </div>
                        <div className="top-performer-stat-box">
                          <div className="top-performer-stat-icon-box bg-list">
                            <i className="fas fa-list-ul"></i>
                          </div>
                          <div className="top-performer-stat-info">
                            <div className="top-performer-stat-num">{topPerformer.totalTasks}</div>
                            <div className="top-performer-stat-lbl">Total Tasks</div>
                          </div>
                        </div>
                        <div className="top-performer-stat-box">
                          <div className="top-performer-circle-progress">
                            <svg viewBox="0 0 36 36" className="circular-chart-gold">
                              <path className="circle-bg"
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path className="circle"
                                strokeDasharray={`${topPerformer.completionPercentage || 0}, 100`}
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <text x="18" y="20.35" className="percentage-text">{Math.round(topPerformer.completionPercentage || 0)}%</text>
                            </svg>
                          </div>
                          <div className="top-performer-stat-info">
                            <div className="top-performer-stat-num">{Math.round(topPerformer.completionPercentage || 0)}%</div>
                            <div className="top-performer-stat-lbl">Completion</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Box */}
                <div className="search-input-wrapper mb-3" style={{ maxWidth: '340px' }}>
                  <i className="fas fa-search search-icon"></i>
                  <Form.Control
                    placeholder="Search by name or designation..."
                    value={performanceSearch}
                    onChange={(e) => setPerformanceSearch(e.target.value)}
                    className="filter-search-input"
                  />
                </div>

                {/* Performance Table */}
                {filteredPerformance.length === 0 ? (
                  <div className="card p-5 text-center text-muted shadow-sm border rounded bg-white">
                    <i className="fas fa-user-slash fs-1 mb-3" style={{ opacity: 0.4 }}></i>
                    <h5 className="fw-bold" style={{ color: '#475569' }}>No matching employees found</h5>
                    <p className="small mb-0">Try adjusting your search criteria.</p>
                  </div>
                ) : (
                  <Card className="p-0 border shadow-sm rounded mb-4" style={{ overflow: 'hidden' }}>
                    <div className="excel-table-container">
                      <Table className="excel-table mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                            <th style={{ minWidth: '240px' }}>Employee</th>
                            <th style={{ textAlign: 'center' }}>Total Tasks</th>
                            <th style={{ textAlign: 'center' }}>Completed</th>
                            <th style={{ textAlign: 'center' }}>In Progress</th>
                            <th style={{ textAlign: 'center' }}>Pending</th>
                            <th style={{ textAlign: 'center' }}>Review</th>
                            <th style={{ textAlign: 'center' }}>Blocked</th>
                            <th style={{ width: '160px' }}>Completion %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPerformance.map((emp, idx) => {
                            const originalIdx = performanceData.findIndex(e => e.employeeId === emp.employeeId);
                            const colorClass = getProgressColor(emp.completionPercentage);
                            return (
                              <tr key={emp.employeeId} className="perf-table-row" onClick={() => setSelectedEmployee(emp)}>
                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                  <span className={`perf-rank-badge ${getRankClass(originalIdx)}`}>
                                    {originalIdx + 1}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <img
                                      src={emp.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=10B981&color=fff&size=256`}
                                      alt=""
                                      className="rounded-circle border"
                                      style={{ width: '34px', height: '34px', objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=10B981&color=fff&size=256`;
                                      }}
                                    />
                                    <div>
                                      <div className="fw-semibold text-dark" style={{ fontSize: '13.5px' }}>{emp.name}</div>
                                      <div className="text-muted" style={{ fontSize: '11px' }}>{emp.designation}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>{emp.totalTasks}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="badge bg-success-subtle text-success-emphasis fw-bold border" style={{ borderColor: '#6EE7B7', minWidth: '32px' }}>{emp.completedTasks}</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="badge bg-primary-subtle text-primary-emphasis fw-bold border" style={{ borderColor: '#93C5FD', minWidth: '32px' }}>{emp.inProgressTasks}</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="badge bg-light text-secondary fw-semibold border" style={{ minWidth: '32px' }}>{emp.pendingTasks}</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="badge bg-warning-subtle text-warning-emphasis fw-bold border" style={{ borderColor: '#FCD34D', minWidth: '32px' }}>{emp.reviewTasks}</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="badge bg-danger-subtle text-danger-emphasis fw-bold border" style={{ borderColor: '#FCA5A5', minWidth: '32px' }}>{emp.blockedTasks}</span>
                                </td>
                                <td>
                                  <div className="perf-progress-wrap">
                                    <span className={`perf-progress-value ${colorClass}`}>{emp.completionPercentage}%</span>
                                    <div className="perf-progress-bar">
                                      <div className={`perf-progress-fill ${colorClass}`} style={{ width: `${emp.completionPercentage}%` }}></div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  </Card>
                )}
              </>
            )}
          </Tab>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateProjectModal
        show={showCreateModal}
        onHide={() => {
          setShowCreateModal(false);
          setProjectToEdit(null);
        }}
        onProjectCreated={fetchData}
        projectToEdit={projectToEdit}
        onProjectUpdated={fetchData}
      />

      <SubmitDailyUpdateModal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        onUpdateSubmitted={fetchData}
      />

      <CreateTaskModal
        show={showCreateTaskModal}
        onHide={() => setShowCreateTaskModal(false)}
        projectId=""
        onTaskCreated={fetchData}
      />

      {/* Employee Performance Detail Modal */}
      <Modal
        show={!!selectedEmployee}
        onHide={() => setSelectedEmployee(null)}
        centered
        className="perf-detail-modal"
        size="md"
      >
        {selectedEmployee && (() => {
          const emp = selectedEmployee;
          const colorClass = getProgressColor(emp.completionPercentage);
          return (
            <>
              <div className="perf-detail-header">
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={emp.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=10B981&color=fff&size=256`}
                    alt=""
                    className="perf-detail-avatar"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=10B981&color=fff&size=256`;
                    }}
                  />
                  <div>
                    <div className="perf-detail-name">{emp.name}</div>
                    <div className="perf-detail-designation">
                      <i className="fas fa-briefcase me-1" style={{ fontSize: '11px' }}></i>{emp.designation}
                    </div>
                    {emp.email && (
                      <div className="perf-detail-email">
                        <i className="fas fa-envelope me-1" style={{ fontSize: '10px' }}></i>{emp.email}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedEmployee(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px' }}
                ></button>
              </div>
              <div className="perf-detail-body">
                <h6 className="fw-bold mb-3" style={{ fontSize: '14px', color: '#334155' }}>
                  <i className="fas fa-tasks me-2 text-emerald"></i>Task Summary
                </h6>
                <div className="perf-detail-stat-grid">
                  <div className="perf-detail-stat">
                    <div className="perf-detail-stat-val text-dark">{emp.totalTasks}</div>
                    <div className="perf-detail-stat-lbl">Total Tasks</div>
                  </div>
                  <div className="perf-detail-stat">
                    <div className="perf-detail-stat-val text-emerald">{emp.completedTasks}</div>
                    <div className="perf-detail-stat-lbl">Completed</div>
                  </div>
                  <div className="perf-detail-stat">
                    <div className="perf-detail-stat-val text-blue">{emp.inProgressTasks}</div>
                    <div className="perf-detail-stat-lbl">In Progress</div>
                  </div>
                  <div className="perf-detail-stat">
                    <div className="perf-detail-stat-val text-slate">{emp.pendingTasks}</div>
                    <div className="perf-detail-stat-lbl">Pending</div>
                  </div>
                  <div className="perf-detail-stat">
                    <div className="perf-detail-stat-val text-amber">{emp.reviewTasks}</div>
                    <div className="perf-detail-stat-lbl">Review</div>
                  </div>
                  <div className="perf-detail-stat">
                    <div className="perf-detail-stat-val text-red">{emp.blockedTasks}</div>
                    <div className="perf-detail-stat-lbl">Blocked</div>
                  </div>
                </div>

                <div className="perf-detail-completion">
                  <div className="perf-detail-completion-value">{emp.completionPercentage}%</div>
                  <div className="perf-detail-completion-label">Overall Completion Rate</div>
                  <div className="perf-detail-completion-bar">
                    <div className={`perf-progress-fill ${colorClass}`} style={{ width: `${emp.completionPercentage}%`, height: '100%' }}></div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}
