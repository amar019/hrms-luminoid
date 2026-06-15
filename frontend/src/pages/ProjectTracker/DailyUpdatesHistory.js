import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Pagination } from 'react-bootstrap';
import api from '../../utils/api';

import { useAuth } from '../../context/AuthContext';
import SubmitDailyUpdateModal from '../../components/ProjectTracker/SubmitDailyUpdateModal';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

export default function DailyUpdatesHistory() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Filter States
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateToEdit, setUpdateToEdit] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isManagerOrAdmin = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchFiltersData();
    fetchDailyUpdates();
  }, []);

  const fetchFiltersData = async () => {
    try {
      if (isManagerOrAdmin) {
        const [projRes, empRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/employees')
        ]);
        setProjects(projRes.data);
        setEmployees(empRes.data);
      } else {
        const projRes = await api.get('/api/projects');
        setProjects(projRes.data);
      }
    } catch (e) {
      console.error('Failed to load filter directories');
    }
  };

  const fetchDailyUpdates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProjectId) params.projectId = selectedProjectId;
      if (selectedEmployeeId) params.userId = selectedEmployeeId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/api/projects/daily-updates', { params });
      setUpdates(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load daily updates' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUpdate = (update) => {
    setUpdateToEdit(update);
    setShowUpdateModal(true);
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
          fetchDailyUpdates();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || 'Failed to delete update log' });
        }
      }
    });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDailyUpdates();
  };

  const handleClearFilters = () => {
    setSelectedProjectId('');
    setSelectedEmployeeId('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setLoading(true);
    api.get('/api/projects/daily-updates')
      .then(res => setUpdates(res.data))
      .catch(() => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to reload updates' }))
      .finally(() => setLoading(false));
  };

  const exportToExcel = () => {
    if (updates.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'No data to export' });
      return;
    }

    const exportData = updates.map(u => ({
      'Date': new Date(u.date).toLocaleDateString(),
      'Project': u.projectId ? `${u.projectId.code}: ${u.projectId.name}` : 'General',
      'Employee': u.userId ? `${u.userId.firstName} ${u.userId.lastName}` : 'Unknown',
      'Task ID': u.taskId ? u.taskId.taskId : '-',
      'Task Title': u.taskId ? u.taskId.title : '-',
      'Module': u.module || 'General',
      'Type': u.taskType || '-',
      'Work Done Today': u.workDone,
      'Hours': u.hoursWorked,
      'Progress %': u.progressPercent || 0,
      'Tomorrow Plan': u.tomorrowPlan || '-',
      'Blockers': u.blockers || '-',
      'Notes/Remark': u.remarks || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Updates');
    
    // Auto size columns roughly
    const maxWidths = [12, 25, 20, 15, 30, 15, 10, 40, 8, 12, 30, 20, 30];
    worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `Team_Daily_Updates_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUpdates = updates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(updates.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="d-flex flex-column h-100" style={{ overflowY: 'auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="tracker-header">
        <div className="tracker-breadcrumbs">Project Tracker / Time Logs</div>
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="tracker-title">Team Daily Updates</h1>
          <Button className="btn-emerald" onClick={() => setShowUpdateModal(true)}>
            <i className="fas fa-edit me-1"></i>Submit Daily Update
          </Button>
        </div>
      </div>

      <div className="px-4 mt-4">
        {/* Filters Panel */}
        <Card className="p-3 border shadow-sm rounded mb-4">
          <Form onSubmit={handleFilterSubmit}>
            <Row className="g-3 align-items-end">
              <Col md={isManagerOrAdmin ? 2 : 3}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Project</Form.Label>
                  <Form.Select size="sm" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                    <option value="">-- All Projects --</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {isManagerOrAdmin && (
                <Col md={2}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Employee</Form.Label>
                    <Form.Select size="sm" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                      <option value="">-- All Employees --</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              <Col md={2}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>Start Date</Form.Label>
                  <Form.Control size="sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tracker-text-subtle)' }}>End Date</Form.Label>
                  <Form.Control size="sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Form.Group>
              </Col>

              <Col md={isManagerOrAdmin ? 4 : 5} className="d-flex gap-2">
                <Button type="submit" size="sm" className="btn-emerald flex-grow-1">
                  <i className="fas fa-filter me-1"></i> Filter
                </Button>
                <Button variant="light" size="sm" className="border text-muted" onClick={handleClearFilters}>
                  Clear
                </Button>
                <Button variant="outline-success" size="sm" onClick={exportToExcel} disabled={updates.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-file-excel"></i> Export Excel
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Updates Table Sheet */}
        {loading ? (
          <Card className="p-3 border shadow-sm rounded mb-4">
            <div className="excel-table-container">
              <Table className="excel-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '100px', textAlign: 'center' }}><div className="skeleton skeleton-text w-75 mx-auto" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ textAlign: 'center' }}><div className="skeleton skeleton-text w-50 mx-auto" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ textAlign: 'center' }}><div className="skeleton skeleton-text w-75 mx-auto" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th><div className="skeleton skeleton-text w-75" style={{ height: '12px', marginBottom: 0 }}></div></th>
                    <th style={{ width: '80px', textAlign: 'center' }}><div className="skeleton skeleton-text w-75 mx-auto" style={{ height: '12px', marginBottom: 0 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>
                        <div className="skeleton skeleton-text w-75 mx-auto" style={{ height: '14px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-75" style={{ height: '18px', borderRadius: '4px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="skeleton skeleton-avatar" style={{ width: '22px', height: '22px' }}></div>
                          <div className="skeleton skeleton-text w-50" style={{ height: '12px', marginBottom: 0 }}></div>
                        </div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-50" style={{ height: '14px', marginBottom: '4px' }}></div>
                        <div className="skeleton skeleton-text w-75" style={{ height: '10px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-50" style={{ height: '14px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-50" style={{ height: '18px', borderRadius: '4px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-100" style={{ height: '14px', marginBottom: 0 }}></div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="skeleton skeleton-text w-25 mx-auto" style={{ height: '14px', marginBottom: 0 }}></div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <div className="skeleton" style={{ width: '50px', height: '4px', borderRadius: '2px' }}></div>
                          <div className="skeleton skeleton-text w-25" style={{ height: '10px', marginBottom: 0 }}></div>
                        </div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-75" style={{ height: '14px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-50" style={{ height: '14px', marginBottom: 0 }}></div>
                      </td>
                      <td>
                        <div className="skeleton skeleton-text w-75" style={{ height: '14px', marginBottom: 0 }}></div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="d-flex gap-1 justify-content-center">
                          <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                          <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        ) : updates.length === 0 ? (
          <div className="card p-5 text-center text-muted shadow-sm border rounded bg-white">
            <i className="fas fa-history fs-1 mb-3 text-muted" style={{ opacity: 0.5 }}></i>
            <h5 className="fw-bold">No daily updates found</h5>
            <p className="small mb-0">Adjust filters or check back later.</p>
          </div>
        ) : (
          <Card className="p-3 border shadow-sm rounded mb-4">
            <div className="excel-table-container">
              <Table className="excel-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '100px', textAlign: 'center' }}>Date</th>
                    <th>Project</th>
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
                  {currentUpdates.map(u => (
                    <tr key={u._id}>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>
                        {new Date(u.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border">
                          {u.projectId ? `${u.projectId.code}: ${u.projectId.name}` : 'General'}
                        </span>
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
                        {user && (user.id === u.userId?._id || user.id === u.userId || isManagerOrAdmin) && (
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
            {updates.length > itemsPerPage && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted" style={{ fontSize: '12px' }}>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, updates.length)} of {updates.length} entries
                </span>
                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1} 
                  />
                  {[...Array(totalPages)].map((_, i) => (
                    <Pagination.Item 
                      key={i + 1} 
                      active={i + 1 === currentPage} 
                      onClick={() => paginate(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages} 
                  />
                </Pagination>
              </div>
            )}
          </Card>
        )}
      </div>

      <SubmitDailyUpdateModal
        show={showUpdateModal}
        onHide={() => { setShowUpdateModal(false); setUpdateToEdit(null); }}
        updateToEdit={updateToEdit}
        onUpdateSubmitted={fetchDailyUpdates}
      />
    </div>
  );
}
