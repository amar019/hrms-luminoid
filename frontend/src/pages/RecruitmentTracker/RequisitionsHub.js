import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Form, Dropdown } from 'react-bootstrap';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import CreateRequisitionModal from '../../components/RecruitmentTracker/CreateRequisitionModal';
import AddCandidateModal from '../../components/RecruitmentTracker/AddCandidateModal';
import GlobalSpinner from '../../components/GlobalSpinner';
import Swal from 'sweetalert2';

export default function RequisitionsHub() {
  const navigate = useNavigate();
  const { fetchRequisitions } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [requisitions, setRequisitions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedReqForCandidate, setSelectedReqForCandidate] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [statusFilter, searchQuery]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, reqsRes] = await Promise.all([
        api.get('/api/job-requisitions/dashboard/stats'),
        api.get(`/api/job-requisitions?status=${statusFilter}&search=${searchQuery}`)
      ]);
      setStats(statsRes.data);
      setRequisitions(reqsRes.data);
    } catch (err) {
      console.error("Failed to fetch recruitment hub data", err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityPill = (p) => {
    const priority = (p || 'MEDIUM').toUpperCase();
    switch (priority) {
      case 'CRITICAL': return <span className="priority-pill priority-critical">Critical</span>;
      case 'HIGH': return <span className="priority-pill priority-high">High</span>;
      case 'MEDIUM': return <span className="priority-pill priority-medium">Medium</span>;
      default: return <span className="priority-pill priority-low">Low</span>;
    }
  };

  const handleDeleteRequisition = async (reqId, reqTitle) => {
    const result = await Swal.fire({
      title: 'Delete Requisition?',
      text: `Are you sure you want to remove "${reqTitle}" and its candidates?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/job-requisitions/${reqId}`);
        Swal.fire({ icon: 'success', title: 'Deleted', text: 'Requisition removed', timer: 1500, showConfirmButton: false });
        loadDashboardData();
        fetchRequisitions();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete requisition' });
      }
    }
  };

  if (loading && !stats) return <GlobalSpinner />;

  return (
    <div className="container-fluid p-0">
      {/* Hero Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            Job Requisitions Hub
          </h3>
          <p className="text-muted mb-0 small">Enterprise Talent Acquisition & Candidate Pipeline Management</p>
        </div>
        <div className="d-flex gap-2">
          <Button className="btn-emerald-outline" onClick={() => setShowCandidateModal(true)}>
            <i className="fas fa-user-plus me-1.5"></i> Add Candidate
          </Button>
          <Button className="btn-emerald-primary" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus me-1.5"></i> New Requisition
          </Button>
        </div>
      </div>

      {/* KPI Hero Stat Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <div className="kpi-hero-card d-flex align-items-center gap-3">
            <div className="kpi-icon-box" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <i className="fas fa-briefcase"></i>
            </div>
            <div>
              <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.8rem' }}>{stats?.totalRequisitions || 0}</h2>
              <small className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Total Requisitions</small>
            </div>
          </div>
        </Col>

        <Col md={3}>
          <div className="kpi-hero-card d-flex align-items-center gap-3">
            <div className="kpi-icon-box" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              <i className="fas fa-bolt"></i>
            </div>
            <div>
              <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.8rem' }}>{stats?.activeRequisitions || 0}</h2>
              <small className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Active Hiring Drives</small>
            </div>
          </div>
        </Col>

        <Col md={3}>
          <div className="kpi-hero-card d-flex align-items-center gap-3">
            <div className="kpi-icon-box" style={{ background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)' }}>
              <i className="fas fa-users"></i>
            </div>
            <div>
              <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.8rem' }}>{stats?.inInterviewProcess || 0}</h2>
              <small className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>In Interview Rounds</small>
            </div>
          </div>
        </Col>

        <Col md={3}>
          <div className="kpi-hero-card d-flex align-items-center gap-3">
            <div className="kpi-icon-box" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' }}>
              <i className="fas fa-award"></i>
            </div>
            <div>
              <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.8rem' }}>{stats?.hiredCandidates || 0}</h2>
              <small className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Completed Hires</small>
            </div>
          </div>
        </Col>
      </Row>

      {/* Search & Filter Toolbar */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <Card.Body className="p-2.5">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <div className="position-relative">
                <i className="fas fa-search position-absolute text-muted" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}></i>
                <Form.Control
                  type="text"
                  className="green-form-control ps-4.5"
                  placeholder="Search by job title or requisition code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </Col>

            <Col md={5}>
              <div className="status-filter-pills">
                {['All', 'Active', 'Planning', 'Approved', 'On Hold', 'Filled'].map(st => (
                  <button
                    key={st}
                    className={`status-filter-btn ${statusFilter === st ? 'active' : ''}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </Col>

            <Col md={2} className="text-end">
              <span className="badge bg-light text-dark border px-3 py-2 font-monospace" style={{ borderRadius: '10px' }}>
                {requisitions.length} Drives Listed
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Enterprise Requisition Cards Grid */}
      <Row className="g-3.5">
        {requisitions.length === 0 ? (
          <Col md={12}>
            <div className="text-center py-5 bg-white rounded-4 border">
              <i className="fas fa-folder-open text-emerald fs-1 mb-2 d-block"></i>
              <h5 className="fw-bold text-dark">No Job Requisitions Found</h5>
              <p className="text-muted small">Start sourcing by creating your first job requisition drive.</p>
              <Button className="btn-emerald-primary" size="sm" onClick={() => setShowCreateModal(true)}>
                <i className="fas fa-plus me-1"></i> Create Requisition
              </Button>
            </div>
          </Col>
        ) : (
          requisitions.map(req => {
            const managerName = req.hiringManager
              ? `${req.hiringManager.firstName} ${req.hiringManager.lastName}`
              : (req.hiringManagerName || 'Unassigned');
            const managerInitials = managerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const fulfilled = req.fulfilledHires || 0;
            const target = req.targetHires || 1;
            const percentage = Math.min(100, Math.round((fulfilled / target) * 100));

            return (
              <Col md={6} lg={4} key={req._id}>
                <div className="req-card-premium h-100">
                  <div className="req-card-header">
                    {/* Top Row: Requisition Code, Priority Pill & Action Dropdown */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <span className="req-code-pill">{req.code}</span>
                        {getPriorityPill(req.priority)}
                      </div>

                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 border-0 shadow-none">
                          <i className="fas fa-ellipsis-v"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                          <Dropdown.Item onClick={() => navigate(`/recruitment-tracker/board/${req._id}`)}>
                            <i className="fas fa-columns text-emerald me-2"></i> Open Pipeline Board
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => {
                            setSelectedReqForCandidate(req._id);
                            setShowCandidateModal(true);
                          }}>
                            <i className="fas fa-user-plus text-primary me-2"></i> Add Candidate
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="text-danger" onClick={() => handleDeleteRequisition(req._id, req.title)}>
                            <i className="fas fa-trash-alt me-2"></i> Delete Requisition
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    {/* Job Title */}
                    <h5 className="req-title text-truncate" title={req.title}>{req.title}</h5>

                    {/* Metadata Tags */}
                    <div className="req-meta-group">
                      <span className="req-chip">
                        <i className="fas fa-building text-emerald"></i> {req.department?.name || 'Talent Acquisition'}
                      </span>
                      <span className="req-chip">
                        <i className="fas fa-location-dot text-secondary"></i> {req.location || 'On-site'}
                      </span>
                      <span className="req-chip">
                        <i className="fas fa-briefcase text-info"></i> {req.employmentType || 'Full-Time'}
                      </span>
                      {req.experienceYears && (
                        <span className="req-chip">
                          <i className="fas fa-clock text-warning"></i> {req.experienceYears}
                        </span>
                      )}
                    </div>

                    {/* Visual Progress Bar Section */}
                    <div className="req-progress-box">
                      <div className="req-progress-label">
                        <span className="text-muted fw-semibold">Hiring Goal:</span>
                        <strong className="text-dark">{fulfilled} / {target} Hired ({percentage}%)</strong>
                      </div>
                      <div className="req-progress-bar-bg">
                        <div className="req-progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Manager Info & Open Pipeline Button */}
                  <div className="req-card-footer">
                    <div className="d-flex align-items-center gap-2" title={`Hiring Manager: ${managerName}`}>
                      <div className="manager-avatar-sm">{managerInitials}</div>
                      <div className="text-truncate" style={{ maxWidth: '120px', fontSize: '0.8rem' }}>
                        <span className="text-muted d-block" style={{ fontSize: '0.68rem', lineHeight: 1 }}>Manager</span>
                        <strong className="text-dark text-truncate">{managerName}</strong>
                      </div>
                    </div>

                    <button
                      className="btn-open-pipeline"
                      onClick={() => navigate(`/recruitment-tracker/board/${req._id}`)}
                    >
                      Pipeline <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </Col>
            );
          })
        )}
      </Row>

      {/* Modals */}
      <CreateRequisitionModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadDashboardData();
          fetchRequisitions();
        }}
      />

      <AddCandidateModal
        show={showCandidateModal}
        onHide={() => {
          setShowCandidateModal(false);
          setSelectedReqForCandidate(null);
        }}
        defaultRequisitionId={selectedReqForCandidate}
        onSuccess={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
}
