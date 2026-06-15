import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, Badge, Table, Alert, Tabs, Tab } from 'react-bootstrap';
import api from '../../utils/api';

import Swal from 'sweetalert2';
import SubmitDailyUpdateModal from '../../components/ProjectTracker/SubmitDailyUpdateModal';
import ProjectTaskDrawer from '../../components/ProjectTracker/ProjectTaskDrawer';
import SubtaskManager from '../../components/ProjectTracker/SubtaskManager';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myProjects: [],
    myTasks: [],
    hasSubmittedUpdateToday: false,
    pendingTasksCount: 0,
    recentUpdates: [],
    upcomingDeadlines: []
  });

  const [showDailyUpdateModal, setShowDailyUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  const fetchDashboardData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get('/api/projects/employee/dashboard');
      setStats(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load employee dashboard stats' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (task) => {
    try {
      await api.put(`/api/project-tasks/${task._id}`, { status: 'Completed', progressPercent: 100 });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Task marked as Completed!', timer: 2000, showConfirmButton: false });
      fetchDashboardData(false);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update task status' });
    }
  };

  const handleUpdateProgress = async (task) => {
    const { value: progress } = await Swal.fire({
      title: 'Update Task Progress',
      input: 'range',
      inputLabel: `Update progress % for: ${task.title}`,
      inputValue: task.progressPercent || 0,
      inputAttributes: {
        min: '0',
        max: '100',
        step: '5'
      },
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Update'
    });

    if (progress !== undefined) {
      try {
        const payload = { progressPercent: Number(progress) };
        if (Number(progress) === 100) {
          payload.status = 'Completed';
        } else if (task.status === 'Pending') {
          payload.status = 'In Progress';
        }
        await api.put(`/api/project-tasks/${task._id}`, payload);
        Swal.fire({ icon: 'success', title: 'Success', text: `Progress updated to ${progress}%`, timer: 2000, showConfirmButton: false });
        fetchDashboardData(false);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update progress' });
      }
    }
  };

  const handleReportBlocker = async (task) => {
    const { value: blockerReason } = await Swal.fire({
      title: 'Report Blocker',
      input: 'textarea',
      inputLabel: `What is blocking: ${task.title}?`,
      inputPlaceholder: 'Explain the issue blocking progress...',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Submit Blocker',
      inputValidator: (value) => {
        if (!value) {
          return 'Please write a blocker explanation';
        }
      }
    });

    if (blockerReason) {
      try {
        await api.put(`/api/project-tasks/${task._id}`, { status: 'Blocked', blocker: blockerReason });
        Swal.fire({ icon: 'success', title: 'Success', text: 'Task marked as Blocked', timer: 2000, showConfirmButton: false });
        fetchDashboardData(false);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update task' });
      }
    }
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

  return (
    <div className="d-flex flex-column h-100" style={{ overflowY: 'auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="tracker-header">
        <div className="tracker-breadcrumbs">Project Tracker / Employee Hub</div>
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="tracker-title">My Dashboard</h1>
          <Button className="btn-emerald" onClick={() => { setSelectedTask(null); setShowDailyUpdateModal(true); }}>
            <i className="fas fa-edit me-1"></i>Log Daily Work
          </Button>
        </div>
      </div>

      <div className="px-4 mt-4">
        {loading ? (
          <>
            {/* Mock Alert Skeleton */}
            <div className="skeleton-card mb-4 skeleton animate-pulse" style={{ height: '58px', borderRadius: '6px' }}></div>

            {/* Metrics cards */}
            <Row className="g-4 mb-4">
              <Col md={4}>
                <div className="tracker-metric-card border rounded p-3 h-100 d-flex align-items-center justify-content-between skeleton-card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                  <div className="w-50">
                    <div className="skeleton skeleton-text w-75" style={{ height: '10px' }}></div>
                    <div className="skeleton skeleton-text w-25 mt-2" style={{ height: '24px' }}></div>
                  </div>
                  <div className="skeleton skeleton-avatar" style={{ width: '48px', height: '48px' }}></div>
                </div>
              </Col>
              <Col md={4}>
                <div className="tracker-metric-card border rounded p-3 h-100 d-flex align-items-center justify-content-between skeleton-card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                  <div className="w-50">
                    <div className="skeleton skeleton-text w-75" style={{ height: '10px' }}></div>
                    <div className="skeleton skeleton-text w-25 mt-2" style={{ height: '24px' }}></div>
                  </div>
                  <div className="skeleton skeleton-avatar" style={{ width: '48px', height: '48px' }}></div>
                </div>
              </Col>
              <Col md={4}>
                <div className="tracker-metric-card border rounded p-3 h-100 d-flex flex-column justify-content-between skeleton-card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="skeleton skeleton-text w-50" style={{ height: '10px' }}></div>
                    <div className="skeleton skeleton-avatar" style={{ width: '30px', height: '30px' }}></div>
                  </div>
                  <div className="d-flex flex-column gap-2 mt-1">
                    <div className="skeleton skeleton-text w-100" style={{ height: '14px' }}></div>
                    <div className="skeleton skeleton-text w-75" style={{ height: '14px' }}></div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Title Skeleton */}
            <div className="skeleton skeleton-text w-25 mb-3" style={{ height: '18px' }}></div>

            {/* Table Skeleton */}
            <div className="excel-table-container mb-4">
              <Table className="excel-table mb-0">
                <thead>
                  <tr>
                    <th style={{ minWidth: '240px' }}><div className="skeleton skeleton-text w-50" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-50" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ width: '100px' }}><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ width: '120px' }}><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ width: '160px' }}><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ width: '160px', textAlign: 'center' }}><div className="skeleton skeleton-text w-75 mx-auto" style={{ height: '12px', marginBottom: 0 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map((i) => (
                    <tr key={i}>
                      <td style={{ minWidth: '240px' }}>
                        <div className="skeleton skeleton-text w-75" style={{ height: '14px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-75" style={{ height: '14px', marginBottom: '6px' }}></div>
                        <div className="skeleton skeleton-text w-50" style={{ height: '10px', marginBottom: 0 }}></div>
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
                      <td style={{ textAlign: 'center' }}>
                        <div className="skeleton mx-auto" style={{ width: '110px', height: '26px', borderRadius: '6px' }}></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        ) : (
          <>
            {/* Daily Update Alert */}
            {stats.hasSubmittedUpdateToday ? (
              <Alert variant="success" className="d-flex align-items-center gap-3 shadow-sm border-0 mb-4" style={{ borderLeft: '4px solid #10B981' }}>
                <i className="fas fa-check-circle fs-4 text-success"></i>
                <div>
                  <strong>Work logged for today!</strong> You have successfully submitted a daily work log. Great job keeping the team informed!
                </div>
              </Alert>
            ) : (
              <Alert variant="warning" className="d-flex align-items-center justify-content-between gap-3 shadow-sm border-0 mb-4" style={{ borderLeft: '4px solid #F59E0B', background: '#FFFBEB' }}>
                <div className="d-flex align-items-center gap-3">
                  <i className="fas fa-exclamation-triangle fs-4 text-warning"></i>
                  <div>
                    <strong>Daily update pending!</strong> You have not logged any work updates for today yet.
                  </div>
                </div>
                <Button variant="warning" size="sm" onClick={() => { setSelectedTask(null); setShowDailyUpdateModal(true); }} style={{ fontWeight: 700, borderRadius: '6px' }}>
                  Log Update Now
                </Button>
              </Alert>
            )}

            {/* Metrics cards */}
            <Row className="g-4 mb-4">
              <Col md={4}>
                <div className="tracker-metric-card border rounded p-3 h-100 d-flex align-items-center justify-content-between">
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tracker-text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>My Active Projects</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--tracker-text)', marginTop: '4px' }}>{stats.myProjects?.length || 0}</div>
                  </div>
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--tracker-primary)' }}>
                    <i className="fas fa-project-diagram" style={{ fontSize: '20px' }}></i>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="tracker-metric-card border rounded p-3 h-100 d-flex align-items-center justify-content-between">
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tracker-text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>My Pending Tasks</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>{stats.pendingTasksCount || 0}</div>
                  </div>
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '48px', height: '48px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                    <i className="fas fa-tasks" style={{ fontSize: '20px' }}></i>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="tracker-metric-card border rounded p-3 h-100 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div style={{ fontSize: '11px', color: 'var(--tracker-text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming Deadlines (7 Days)</div>
                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '30px', height: '30px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                      <i className="fas fa-hourglass-half" style={{ fontSize: '12px' }}></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 d-flex flex-column justify-content-center gap-2">
                    {stats.upcomingDeadlines?.length === 0 ? (
                      <div className="text-muted small text-center py-2">No upcoming deadlines!</div>
                    ) : (
                      stats.upcomingDeadlines.slice(0, 2).map(t => {
                        const daysLeft = Math.ceil((new Date(t.eta) - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={t._id} className="deadline-item">
                            <span className="text-danger fw-semibold text-truncate" style={{ maxWidth: '140px' }} title={`${t.taskId}: ${t.title}`}>
                              {t.taskId}: {t.title}
                            </span>
                            <span style={{ fontSize: '10px', color: '#991B1B', fontWeight: 700 }} className="ps-2 text-nowrap">
                              {daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            {/* Tabs for Tasks & Subtasks */}
            <Tabs defaultActiveKey="tasks" className="modern-tabs mb-4">
              <Tab eventKey="tasks" title={<><i className="fas fa-tasks me-2 text-emerald"></i>My Assigned Tasks</>}>
                <div className="pt-3">
                  {stats.myTasks?.length === 0 ? (
                    <div className="card p-5 text-center text-muted shadow-sm border rounded bg-white">
                      <i className="fas fa-clipboard-list fs-1 mb-3 text-muted" style={{ opacity: 0.5 }}></i>
                      <h5 className="fw-bold">No tasks assigned</h5>
                      <p className="small mb-0">Ask your project leader to assign you tasks to get started.</p>
                    </div>
                  ) : (
                    <div className="excel-table-container">
                      <Table hover align="middle" className="excel-table mb-0">
                        <thead>
                          <tr>
                            <th style={{ minWidth: '240px' }}>Task</th>
                            <th>Project / Module</th>
                            <th style={{ width: '100px' }}>Priority</th>
                            <th style={{ width: '120px' }}>Schedule</th>
                            <th style={{ width: '160px' }}>Progress & Status</th>
                            <th style={{ width: '160px', textAlign: 'center' }}>Quick Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.myTasks.map(t => {
                            const daysLeft = getDaysLeft(t);
                            return (
                              <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedTaskId(t._id); setShowTaskDrawer(true); }}>
                                 <td style={{ whiteSpace: 'normal', minWidth: '240px' }}>
                                  <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#1E293B' }}>
                                    {t.title}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '13.5px' }}>
                                    {t.project?.name || 'General'}
                                  </div>
                                  <div className="text-muted small mt-1 d-flex align-items-center gap-1">
                                    <i className="fas fa-cubes" style={{ fontSize: '10px', color: '#94A3B8' }}></i>
                                    <span>{t.module || 'General'}</span>
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
                                <td style={{ textAlign: 'center' }}>
                                  <Button size="sm" className="btn-emerald text-white py-1 px-3 border-0" style={{ fontSize: '11px', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={(e) => { e.stopPropagation(); setSelectedTask(t); setShowDailyUpdateModal(true); }} title="Log Daily Work">
                                    <i className="fas fa-edit" style={{ fontSize: '10px' }}></i>Log Daily Work
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </div>
              </Tab>
              
              <Tab eventKey="subtasks" title={<><i className="fas fa-list-ul me-2 text-emerald"></i>My Subtasks</>}>
                <div className="pt-3">
                  <SubtaskManager 
                    parentTaskId={null} 
                    parentType={null} 
                    projectId={null} 
                    showOnlyMy={true} 
                  />
                </div>
              </Tab>
            </Tabs>
          </>
        )}
      </div>

      {/* Log Daily Update Modal */}
      <SubmitDailyUpdateModal
        show={showDailyUpdateModal}
        onHide={() => setShowDailyUpdateModal(false)}
        preselectedProjectId={selectedTask?.project?._id || selectedTask?.project}
        preselectedTaskId={selectedTask?._id}
        onUpdateSubmitted={() => fetchDashboardData(false)}
      />

      {/* Detailed Task Details Panel */}
      <ProjectTaskDrawer
        show={showTaskDrawer}
        onHide={() => setShowTaskDrawer(false)}
        taskId={selectedTaskId}
        onTaskUpdated={() => fetchDashboardData(false)}
      />
    </div>
  );
}
