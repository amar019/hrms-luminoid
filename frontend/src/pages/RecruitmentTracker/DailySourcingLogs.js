import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Badge, Modal, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import GlobalSpinner from '../../components/GlobalSpinner';
import '../../styles/daily-sourcing-logs.css';

// Helper to sanitize duplicate leading emojis if present in stored string values
const sanitizeText = (text) => {
  if (!text) return '';
  return text.replace(/^[^\w\s.,&()\-–—'"]+/g, '').trim();
};

// Helper to check if current logged in user is the submitter/owner of the log
const isLogOwner = (log, user) => {
  if (!log || !user) return false;

  const currentUserId = String(user._id || user.id || '').trim();
  const currentUserEmpId = String(user.employeeId || user.customId || '').trim();
  const currentUserName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();

  // 1. Direct ID comparison on populated employee object
  if (log.employee && typeof log.employee === 'object' && log.employee._id) {
    if (String(log.employee._id).trim() === currentUserId) return true;
  }

  // 2. Direct string ID comparison on employee field
  if (log.employee && typeof log.employee === 'string') {
    if (String(log.employee).trim() === currentUserId) return true;
  }

  // 3. Comparison with createdBy field
  if (log.createdBy) {
    const creatorId = typeof log.createdBy === 'object' ? log.createdBy._id : log.createdBy;
    if (String(creatorId).trim() === currentUserId) return true;
  }

  // 4. Employee ID match (e.g. "EMP001")
  if (log.employeeId && currentUserEmpId && String(log.employeeId).trim() === currentUserEmpId) {
    return true;
  }

  // 5. Full Name match fallback
  const logEmpName = (log.employeeName || (log.employee && typeof log.employee === 'object' ? `${log.employee.firstName || ''} ${log.employee.lastName || ''}` : '')).trim().toLowerCase();
  if (currentUserName && logEmpName && currentUserName === logEmpName) {
    return true;
  }

  return false;
};

export default function DailySourcingLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalInterviews: 0,
    totalLogs: 0,
    uniqueClients: 0
  });
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [viewScope, setViewScope] = useState('all'); // 'all' or 'mine'

  // Modal Form "+ Add Daily Task" state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLogData, setNewLogData] = useState({
    clientName: '',
    position: '',
    location: '',
    submission: '',
    interview: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // View More Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Inline "Edit Existing Log" state
  const [editingId, setEditingId] = useState(null);
  const [editLogData, setEditLogData] = useState({
    clientName: '',
    position: '',
    location: '',
    submission: 0,
    interview: 0,
    description: ''
  });

  const fetchLogsAndStats = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery,
        filterScope: viewScope
      };

      // Handle date filters
      const now = new Date();
      if (dateFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        params.startDate = todayStr;
        params.endDate = todayStr;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        params.startDate = weekAgo.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        params.startDate = firstDayMonth.toISOString().split('T')[0];
      }

      const [logsRes, statsRes] = await Promise.all([
        api.get('/api/daily-sourcing-logs', { params }),
        api.get('/api/daily-sourcing-logs/stats', { params: { filterScope: viewScope } })
      ]);

      setLogs(logsRes.data || []);
      setStats(statsRes.data || {
        totalSubmissions: 0,
        totalInterviews: 0,
        totalLogs: 0,
        uniqueClients: 0
      });
    } catch (err) {
      console.error('Failed to fetch sourcing logs:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dateFilter, viewScope]);

  useEffect(() => {
    fetchLogsAndStats();
  }, [fetchLogsAndStats]);

  // Open "+ Add Daily Task" Modal
  const handleOpenAddModal = () => {
    setNewLogData({
      clientName: '',
      position: '',
      location: '',
      submission: '',
      interview: '',
      description: ''
    });
    setShowAddModal(true);
  };

  // Submit New Task Form
  const handleCreateSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!newLogData.clientName.trim()) {
      Swal.fire('Required Field', 'Please enter Client Name', 'warning');
      return;
    }
    if (!newLogData.position.trim()) {
      Swal.fire('Required Field', 'Please enter Position', 'warning');
      return;
    }
    if (!newLogData.location.trim()) {
      Swal.fire('Required Field', 'Please enter Location', 'warning');
      return;
    }
    if (!newLogData.description.trim()) {
      Swal.fire('Required Field', 'Please enter Detailed Work Description', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/daily-sourcing-logs', {
        clientName: newLogData.clientName,
        position: newLogData.position,
        location: newLogData.location,
        submission: Number(newLogData.submission) || 0,
        interview: Number(newLogData.interview) || 0,
        description: newLogData.description
      });

      Swal.fire({
        icon: 'success',
        title: 'Daily Task Submitted',
        text: 'Your daily task update has been recorded in the Excel sheet.',
        timer: 1600,
        showConfirmButton: false
      });

      setShowAddModal(false);
      setNewLogData({
        clientName: '',
        position: '',
        location: '',
        submission: '',
        interview: '',
        description: ''
      });

      fetchLogsAndStats();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to submit daily task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open "View More" Detail View
  const handleViewMore = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Start Editing an existing row inline
  const handleStartEdit = (log) => {
    setEditingId(log._id);
    setEditLogData({
      clientName: log.clientName || '',
      position: log.position || '',
      location: log.location || '',
      submission: log.submission || 0,
      interview: log.interview || 0,
      description: log.description || ''
    });
  };

  // Save Inline Edit
  const handleSaveEdit = async (logId) => {
    if (!editLogData.clientName.trim() || !editLogData.position.trim() || !editLogData.location.trim() || !editLogData.description.trim()) {
      Swal.fire('Required Fields', 'Client Name, Position, Location, and Description are required', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/api/daily-sourcing-logs/${logId}`, {
        clientName: editLogData.clientName,
        position: editLogData.position,
        location: editLogData.location,
        submission: Number(editLogData.submission) || 0,
        interview: Number(editLogData.interview) || 0,
        description: editLogData.description
      });

      Swal.fire({
        icon: 'success',
        title: 'Task Updated',
        text: 'Task log updated successfully.',
        timer: 1200,
        showConfirmButton: false
      });

      setEditingId(null);
      fetchLogsAndStats();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Log
  const handleDeleteLog = async (logId) => {
    const result = await Swal.fire({
      title: 'Delete Task Entry?',
      text: 'Are you sure you want to remove this daily task entry?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/daily-sourcing-logs/${logId}`);
        Swal.fire('Deleted!', 'Daily task entry removed.', 'success');
        fetchLogsAndStats();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to delete task', 'error');
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      Swal.fire('No Data', 'No task logs available to export.', 'info');
      return;
    }

    const headers = ['Submitted Date', 'Submitted Time', 'Employee Name', 'Employee ID', 'Client Name', 'Position', 'Location', 'Submission', 'Interview', 'Description'];
    const rows = logs.map(l => {
      const dt = new Date(l.createdAt);
      return [
        `"${dt.toLocaleDateString()}"`,
        `"${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"`,
        `"${l.employeeName || ''}"`,
        `"${l.employeeId || ''}"`,
        `"${(l.clientName || '').replace(/"/g, '""')}"`,
        `"${(l.position || '').replace(/"/g, '""')}"`,
        `"${(l.location || '').replace(/"/g, '""')}"`,
        l.submission || 0,
        l.interview || 0,
        `"${(l.description || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Task_Updates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sourcing-log-container">
      {/* 1. Page Header */}
      <div className="sourcing-header">
        <div>
          <h1 className="sourcing-header-title">
            <div className="sourcing-header-icon">
              <i className="fas fa-file-excel"></i>
            </div>
            Daily Task Update
          </h1>
          <p className="sourcing-header-subtitle">Track and submit your daily work activity in Excel spreadsheet view.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button className="btn-add-log" onClick={handleOpenAddModal}>
            <i className="fas fa-plus"></i> + Add Daily Task
          </Button>
        </div>
      </div>

      {/* 2. KPI Spreadsheet Stat Bar */}
      <div className="sourcing-stats-bar">
        <div className="stat-cell-card">
          <div className="stat-icon-wrapper stat-icon-submissions">
            <i className="fas fa-paper-plane"></i>
          </div>
          <div>
            <div className="stat-info-title">Total Submissions</div>
            <div className="stat-info-value">{stats.totalSubmissions || 0}</div>
          </div>
        </div>

        <div className="stat-cell-card">
          <div className="stat-icon-wrapper stat-icon-interviews">
            <i className="fas fa-user-tie"></i>
          </div>
          <div>
            <div className="stat-info-title">Total Interviews</div>
            <div className="stat-info-value">{stats.totalInterviews || 0}</div>
          </div>
        </div>

        <div className="stat-cell-card">
          <div className="stat-icon-wrapper stat-icon-logs">
            <i className="fas fa-list-ol"></i>
          </div>
          <div>
            <div className="stat-info-title">Total Tasks Logged</div>
            <div className="stat-info-value">{stats.totalLogs || 0}</div>
          </div>
        </div>

        <div className="stat-cell-card">
          <div className="stat-icon-wrapper stat-icon-clients">
            <i className="fas fa-building"></i>
          </div>
          <div>
            <div className="stat-info-title">Clients Sourced</div>
            <div className="stat-info-value">{stats.uniqueClients || 0}</div>
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="sourcing-toolbar">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <i className="fas fa-search"></i>
            <input
              type="text"
              className="sourcing-search-input"
              placeholder="Search client, position, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Filter Pills */}
          <div className="status-filter-pills">
            <button
              className={`status-filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDateFilter('all')}
            >
              All Time
            </button>
            <button
              className={`status-filter-btn ${dateFilter === 'today' ? 'active' : ''}`}
              onClick={() => setDateFilter('today')}
            >
              Today
            </button>
            <button
              className={`status-filter-btn ${dateFilter === 'week' ? 'active' : ''}`}
              onClick={() => setDateFilter('week')}
            >
              Last 7 Days
            </button>
            <button
              className={`status-filter-btn ${dateFilter === 'month' ? 'active' : ''}`}
              onClick={() => setDateFilter('month')}
            >
              This Month
            </button>
          </div>

          {/* View Scope Filter */}
          <div className="status-filter-pills">
            <button
              className={`status-filter-btn ${viewScope === 'all' ? 'active' : ''}`}
              onClick={() => setViewScope('all')}
            >
              All Team Tasks
            </button>
            <button
              className={`status-filter-btn ${viewScope === 'mine' ? 'active' : ''}`}
              onClick={() => setViewScope('mine')}
            >
              My Tasks
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button variant="light" size="sm" className="border shadow-sm text-dark fw-bold" onClick={handleExportCSV}>
            <i className="fas fa-download me-1 text-success"></i> Export CSV
          </Button>
        </div>
      </div>

      {/* 4. Excel / Google Sheets Style Table */}
      <div className="excel-table-container">
        {loading ? (
          <div className="py-5 text-center">
            <GlobalSpinner />
          </div>
        ) : (
          <table className="excel-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}><span className="col-letter-pill">A</span> Date & Time</th>
                <th style={{ width: '170px' }}><span className="col-letter-pill">B</span> Employee</th>
                <th style={{ width: '150px' }}><span className="col-letter-pill">C</span> Client Name</th>
                <th style={{ width: '150px' }}><span className="col-letter-pill">D</span> Position</th>
                <th style={{ width: '120px' }}><span className="col-letter-pill">E</span> Location</th>
                <th style={{ width: '100px', textAlign: 'center' }}><span className="col-letter-pill">F</span> Submission</th>
                <th style={{ width: '100px', textAlign: 'center' }}><span className="col-letter-pill">G</span> Interview</th>
                <th><span className="col-letter-pill">H</span> Description</th>
                <th style={{ width: '160px', textAlign: 'center' }}><span className="col-letter-pill">I</span> Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="excel-empty-state">
                      <div className="excel-empty-icon">
                        <i className="fas fa-folder-open"></i>
                      </div>
                      <h5 className="fw-bold text-dark mb-1">No Daily Tasks Recorded</h5>
                      <p className="text-muted small mb-3">Click "+ Add Daily Task" to submit your daily work log form.</p>
                      <Button className="btn-add-log" size="sm" onClick={handleOpenAddModal}>
                        + Add Daily Task
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isEditing = editingId === log._id;
                  const logDate = new Date(log.createdAt || log.submittedAt || Date.now());
                  const canModify = isLogOwner(log, user);

                  if (isEditing) {
                    return (
                      <tr key={log._id} className="inline-edit-row">
                        <td>
                          <div className="date-cell-main">{logDate.toLocaleDateString()}</div>
                          <div className="date-cell-time">{logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td>
                          <div className="emp-pill">
                            <div className="emp-avatar">
                              {log.employeeName ? log.employeeName.charAt(0).toUpperCase() : 'E'}
                            </div>
                            <div>
                              <div className="emp-name">{log.employeeName}</div>
                              <div className="emp-id-sub">{log.employeeId || log.employee?.employeeId || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="excel-cell-input"
                            value={editLogData.clientName}
                            onChange={(e) => setEditLogData({ ...editLogData, clientName: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="excel-cell-input"
                            value={editLogData.position}
                            onChange={(e) => setEditLogData({ ...editLogData, position: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="excel-cell-input"
                            value={editLogData.location}
                            onChange={(e) => setEditLogData({ ...editLogData, location: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="excel-cell-input excel-cell-input-num"
                            value={editLogData.submission}
                            onChange={(e) => setEditLogData({ ...editLogData, submission: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="excel-cell-input excel-cell-input-num"
                            value={editLogData.interview}
                            onChange={(e) => setEditLogData({ ...editLogData, interview: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="excel-cell-input"
                            value={editLogData.description}
                            onChange={(e) => setEditLogData({ ...editLogData, description: e.target.value })}
                          />
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            <button
                              className="btn-excel-submit"
                              onClick={() => handleSaveEdit(log._id)}
                              disabled={submitting}
                              title="Save Changes"
                            >
                              Save
                            </button>
                            <button
                              className="btn-excel-cancel"
                              onClick={() => setEditingId(null)}
                              disabled={submitting}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={log._id}>
                      {/* Date & Time */}
                      <td>
                        <div className="date-cell-main">{logDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="date-cell-time">{logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* Employee Name & ID */}
                      <td>
                        <div className="emp-pill">
                          <div className="emp-avatar">
                            {log.employeeName ? log.employeeName.charAt(0).toUpperCase() : 'E'}
                          </div>
                          <div>
                            <div className="emp-name">{log.employeeName || (log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : 'Employee')}</div>
                            <div className="emp-id-sub">{log.employeeId || log.employee?.employeeId || ''}</div>
                          </div>
                        </div>
                      </td>

                      {/* Client Name */}
                      <td className="fw-semibold text-dark">{log.clientName}</td>

                      {/* Position */}
                      <td>
                        <Badge bg="light" className="text-dark border px-2 py-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {log.position}
                        </Badge>
                      </td>

                      {/* Location */}
                      <td className="text-secondary"><i className="fas fa-map-marker-alt text-muted me-1 small"></i>{log.location}</td>

                      {/* Submission */}
                      <td className="text-center">
                        <span className="badge-count-sub">{log.submission || 0}</span>
                      </td>

                      {/* Interview */}
                      <td className="text-center">
                        <span className="badge-count-int">{log.interview || 0}</span>
                      </td>

                      {/* Description Preview & View More */}
                      <td>
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <span className="text-truncate" style={{ maxWidth: '220px' }} title={log.description}>
                            {log.description}
                          </span>
                          <button
                            className="btn btn-xs btn-outline-success rounded-pill fw-bold text-nowrap px-2 py-0.5"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => handleViewMore(log)}
                          >
                            <i className="fas fa-eye me-1"></i> View More
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <button
                            className="action-icon-btn edit me-1"
                            onClick={() => handleViewMore(log)}
                            title="View Detailed Work Report"
                          >
                            <i className="fas fa-eye text-emerald"></i>
                          </button>
                          {canModify && (
                            <>
                              <button
                                className="action-icon-btn edit"
                                onClick={() => handleStartEdit(log)}
                                title="Edit Task"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="action-icon-btn danger"
                                onClick={() => handleDeleteLog(log._id)}
                                title="Delete Task"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. Modal Form: "+ Add Daily Task Update" */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered backdrop="static" className="green-modal">
        <Modal.Header closeButton className="green-modal-header">
          <Modal.Title className="d-flex align-items-center gap-2 text-white">
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-plus-circle text-white fs-5"></i>
            </div>
            <div>
              <span className="d-block fw-bold" style={{ fontSize: '1.1rem' }}>Add Daily Task Update</span>
              <small className="fw-normal text-white-50" style={{ fontSize: '0.78rem' }}>Record your daily work activity into the Excel log sheet</small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body className="green-modal-body p-4">
            {/* System Maintained Info Card */}
            <div className="p-3 bg-light rounded-3 border mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reporting Employee</small>
                <strong className="text-dark" style={{ fontSize: '0.92rem' }}>
                  <i className="fas fa-user-circle text-emerald me-1.5"></i>
                  {user?.firstName} {user?.lastName} {user?.employeeId ? `(${user.employeeId})` : ''}
                </strong>
              </div>
              <div className="text-end">
                <small className="text-muted d-block fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date & Time</small>
                <strong className="text-success" style={{ fontSize: '0.88rem' }}>
                  <i className="fas fa-clock me-1"></i>
                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Auto)
                </strong>
              </div>
            </div>

            <Row className="g-3">
              {/* Client Name */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark">Client Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    className="green-form-control"
                    placeholder="e.g. ABC Pvt Ltd"
                    value={newLogData.clientName}
                    onChange={(e) => setNewLogData({ ...newLogData, clientName: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              {/* Position */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark">Position <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    className="green-form-control"
                    placeholder="e.g. React Developer"
                    value={newLogData.position}
                    onChange={(e) => setNewLogData({ ...newLogData, position: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              {/* Location */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark">Location <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    className="green-form-control"
                    placeholder="e.g. Pune / Hybrid"
                    value={newLogData.location}
                    onChange={(e) => setNewLogData({ ...newLogData, location: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              {/* Submission */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark">Submissions Count</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    className="green-form-control fw-bold"
                    placeholder="0"
                    value={newLogData.submission}
                    onChange={(e) => setNewLogData({ ...newLogData, submission: e.target.value })}
                  />
                </Form.Group>
              </Col>

              {/* Interview */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark">Interviews Fixed</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    className="green-form-control fw-bold"
                    placeholder="0"
                    value={newLogData.interview}
                    onChange={(e) => setNewLogData({ ...newLogData, interview: e.target.value })}
                  />
                </Form.Group>
              </Col>

              {/* Description */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark">Detailed Work Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    className="green-form-control"
                    placeholder="Describe daily sourcing activity, candidates submitted, interviews scheduled, feedback received..."
                    value={newLogData.description}
                    onChange={(e) => setNewLogData({ ...newLogData, description: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer className="green-modal-footer">
            <Button variant="link" className="text-muted fw-bold text-decoration-none me-2" onClick={() => setShowAddModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button className="btn-emerald-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Daily Task'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 6. Modal View: "View More Detailed Work Report" */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered className="green-modal">
        <Modal.Header closeButton className="green-modal-header">
          <Modal.Title className="d-flex align-items-center gap-3 text-white">
            <div className="modal-header-icon-badge">
              <i className="fas fa-file-alt"></i>
            </div>
            <div>
              <span className="d-block fw-bold" style={{ fontSize: '1.15rem' }}>Detailed Work Report</span>
              <small className="fw-normal text-white-50" style={{ fontSize: '0.8rem' }}>Full activity details & metrics breakdown</small>
            </div>
          </Modal.Title>
        </Modal.Header>

        {selectedLog && (
          <Modal.Body className="green-modal-body">
            {/* Employee Banner Card */}
            <div className="employee-report-banner mb-4">
              <div className="d-flex align-items-center gap-3">
                <div className="emp-report-avatar">
                  {selectedLog.employeeName ? selectedLog.employeeName.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <h6 className="emp-report-name">{selectedLog.employeeName}</h6>
                  <span className="emp-report-id">
                    <i className="fas fa-id-badge me-1 text-muted"></i>
                    {selectedLog.employeeId ? `ID: ${selectedLog.employeeId}` : 'ID: System Recruiter'}
                  </span>
                </div>
              </div>
              <div className="text-end">
                <div className="emp-report-date-badge">
                  <i className="far fa-calendar-alt me-1.5"></i>
                  {new Date(selectedLog.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <span className="emp-report-time">
                  <i className="far fa-clock me-1"></i>
                  {new Date(selectedLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Key Information Cards */}
            <Row className="g-3 mb-4">
              <Col md={4}>
                <div className="report-info-card">
                  <div className="report-info-header">
                    <div className="report-info-icon-wrapper icon-building-wrapper">
                      <i className="fas fa-building"></i>
                    </div>
                    <span className="report-info-label">Client Name</span>
                  </div>
                  <div className="report-info-value">{sanitizeText(selectedLog.clientName)}</div>
                </div>
              </Col>

              <Col md={4}>
                <div className="report-info-card">
                  <div className="report-info-header">
                    <div className="report-info-icon-wrapper icon-position-wrapper">
                      <i className="fas fa-briefcase"></i>
                    </div>
                    <span className="report-info-label">Position</span>
                  </div>
                  <div className="report-info-value">{sanitizeText(selectedLog.position)}</div>
                </div>
              </Col>

              <Col md={4}>
                <div className="report-info-card">
                  <div className="report-info-header">
                    <div className="report-info-icon-wrapper icon-location-wrapper">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <span className="report-info-label">Location</span>
                  </div>
                  <div className="report-info-value">{sanitizeText(selectedLog.location)}</div>
                </div>
              </Col>

              {/* Stat Highlight Cards */}
              <Col md={6}>
                <div className="report-metric-card report-metric-sub">
                  <div>
                    <div className="metric-card-label">Submissions Count</div>
                    <div className="metric-card-value">{selectedLog.submission || 0}</div>
                    <div className="metric-badge-tag">
                      <i className="fas fa-paper-plane me-1"></i>
                      <span>Candidates Submitted</span>
                    </div>
                  </div>
                  <div className="metric-card-icon-lg sub">
                    <i className="fas fa-user-check"></i>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className="report-metric-card report-metric-int">
                  <div>
                    <div className="metric-card-label">Interviews Fixed</div>
                    <div className="metric-card-value">{selectedLog.interview || 0}</div>
                    <div className="metric-badge-tag">
                      <i className="fas fa-calendar-check me-1"></i>
                      <span>Candidates Shortlisted</span>
                    </div>
                  </div>
                  <div className="metric-card-icon-lg int">
                    <i className="fas fa-user-clock"></i>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Detailed Activity Summary */}
            <div className="report-activity-container">
              <div className="report-activity-header">
                <h6 className="report-activity-title">
                  <i className="fas fa-clipboard-list text-emerald"></i>
                  Detailed Work Activity & Summary
                </h6>
                {selectedLog.description && (
                  <Badge bg="light" className="text-secondary border fw-normal">
                    {selectedLog.description.trim().split(/\s+/).filter(Boolean).length} words
                  </Badge>
                )}
              </div>
              <div className="report-activity-body">
                {selectedLog.description || 'No detailed description provided.'}
              </div>
            </div>
          </Modal.Body>
        )}

        <Modal.Footer className="green-modal-footer">
          <div className="d-flex align-items-center gap-2">
            {selectedLog && isLogOwner(selectedLog, user) && (
              <Button
                variant="outline-success"
                className="px-3 py-2 fw-semibold"
                onClick={() => {
                  setShowDetailModal(false);
                  handleStartEdit(selectedLog);
                }}
              >
                <i className="fas fa-edit me-1.5"></i> Edit Task
              </Button>
            )}
            <Button variant="outline-secondary" className="px-3 py-2 fw-semibold" onClick={() => window.print()}>
              <i className="fas fa-print me-2"></i> Print Report
            </Button>
          </div>
          <Button className="btn-add-log px-4 py-2" onClick={() => setShowDetailModal(false)}>
            Close Report
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
