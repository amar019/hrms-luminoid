import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { Button, Form, Badge, Dropdown } from 'react-bootstrap';
import api from '../../utils/api';
import AddCandidateModal from '../../components/RecruitmentTracker/AddCandidateModal';
import CandidateDetailDrawer from '../../components/RecruitmentTracker/CandidateDetailDrawer';
import GlobalSpinner from '../../components/GlobalSpinner';

const STAGES = [
  'Sourced',
  'Screening',
  'Technical Interview',
  'Managerial Round',
  'HR Round',
  'Offer Issued',
  'Hired',
  'Rejected'
];

export default function CandidateBoard() {
  const { id } = useParams();
  const { currentRequisition, requisitions = [], handleReqChange } = useOutletContext() || {};
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    fetchCandidates();
  }, [id, search]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const reqId = id || 'all';
      const res = await api.get(`/api/candidates?requisitionId=${reqId}&search=${search}`);
      setCandidates(res.data || []);
    } catch (err) {
      console.error("Failed to fetch candidates", err);
    } finally {
      setLoading(false);
    }
  };

  const getCandidatesByStage = (stageName) => {
    return candidates.filter(c => c.stage === stageName);
  };

  if (loading && candidates.length === 0) return <GlobalSpinner />;

  return (
    <div className="container-fluid p-0">
      {/* Board Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">
            Candidate Pipeline: <span style={{ color: '#059669' }}>{currentRequisition ? currentRequisition.title : 'All Drives'}</span>
          </h4>
          <small className="text-muted">View and manage candidate stages across active hiring drives.</small>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {/* Requisition / Drive Filter Dropdown */}
          {requisitions.length > 0 && handleReqChange && (
            <Dropdown>
              <Dropdown.Toggle variant="light" className="border shadow-sm text-dark fw-semibold btn-sm d-flex align-items-center gap-2">
                <i className="fas fa-briefcase text-emerald"></i>
                <span>{currentRequisition ? currentRequisition.title : 'Select Hiring Drive'}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="shadow-sm border-0" style={{ borderRadius: '12px', minWidth: '240px' }}>
                <Dropdown.Item onClick={() => handleReqChange('all')}>
                  <div className="fw-bold"><i className="fas fa-layer-group text-primary me-2"></i> All Candidates</div>
                  <small className="text-muted">Global candidate pool across all drives</small>
                </Dropdown.Item>
                <Dropdown.Divider />
                {requisitions.map(r => (
                  <Dropdown.Item key={r._id} onClick={() => handleReqChange(r._id)}>
                    <div className="fw-bold"><i className="fas fa-briefcase text-secondary me-2"></i> {r.title}</div>
                    <small className="text-muted">Code: {r.code}</small>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}

          <Form.Control
            type="text"
            className="green-form-control"
            placeholder="Search candidates..."
            size="sm"
            style={{ width: '200px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button className="btn-emerald-primary" size="sm" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-user-plus me-1"></i> Add Candidate
          </Button>
        </div>
      </div>


      {/* Kanban Board Grid */}
      <div className="kanban-board-container">
        {STAGES.map(stage => {
          const stageCandidates = getCandidatesByStage(stage);
          return (
            <div key={stage} className="kanban-column">
              <div className="kanban-column-header">
                <span>{stage}</span>
                <Badge bg={stageCandidates.length > 0 ? 'success' : 'light'} text={stageCandidates.length > 0 ? 'white' : 'dark'} style={{ borderRadius: '12px' }}>
                  {stageCandidates.length}
                </Badge>
              </div>

              <div className="kanban-cards-wrapper">
                {stageCandidates.length === 0 ? (
                  <div className="text-center py-4 text-muted small" style={{ border: '2px dashed #e2e8f0', borderRadius: '10px' }}>
                    No candidates
                  </div>
                ) : (
                  stageCandidates.map(c => (
                    <div
                      key={c._id}
                      className="candidate-kanban-card"
                      onClick={() => setSelectedCandidate(c)}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1.5">
                        <Badge bg="dark" style={{ fontSize: '0.65rem' }}>{c.candidateId}</Badge>
                        {c.expectedSalary > 0 && (
                          <small className="fw-bold" style={{ fontSize: '0.75rem', color: '#059669' }}>
                            ₹{(c.expectedSalary / 100000).toFixed(1)}L
                          </small>
                        )}
                      </div>

                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>{c.fullName}</h6>
                      <small className="text-muted d-block text-truncate mb-2" style={{ fontSize: '0.78rem' }}>
                        {c.currentCompany || 'Fresh Applicant'} • {c.currentNoticePeriod}
                      </small>

                      <div className="d-flex align-items-center justify-content-between border-top pt-2" style={{ fontSize: '0.75rem' }}>
                        <span className="text-muted">
                          <i className="fas fa-comments text-emerald me-1"></i> {c.feedback?.length || 0} reviews
                        </span>
                        <span className="fw-bold" style={{ color: '#059669' }}>View Details &rarr;</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals & Drawer */}
      <AddCandidateModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        defaultRequisitionId={id !== 'all' ? id : null}
        onSuccess={fetchCandidates}
      />

      <CandidateDetailDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onRefresh={() => {
          fetchCandidates();
          if (selectedCandidate) {
            api.get(`/api/candidates/${selectedCandidate._id}`).then(res => setSelectedCandidate(res.data));
          }
        }}
      />
    </div>
  );
}
