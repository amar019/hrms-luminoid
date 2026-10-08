import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Row, Col } from 'react-bootstrap';
import api from '../../utils/api';
import CandidateDetailDrawer from '../../components/RecruitmentTracker/CandidateDetailDrawer';
import SubmitRecruiterUpdateModal from '../../components/RecruitmentTracker/SubmitRecruiterUpdateModal';
import GlobalSpinner from '../../components/GlobalSpinner';

export default function MyCandidatesDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    fetchMyDashboardData();
  }, []);

  const fetchMyDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/job-requisitions/employee/dashboard');
      setData(res.data);
    } catch (err) {
      console.error("Failed to load recruiter personal dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) return <GlobalSpinner />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">My Assigned Candidates & Sourcing Tasks</h4>
          <p className="text-muted mb-0 small">Personal recruiter workspace for candidate management and daily sourcing logs.</p>
        </div>
        <Button className="btn-emerald-primary" onClick={() => setShowLogModal(true)}>
          <i className="fas fa-edit me-2"></i> Submit Daily Log
        </Button>
      </div>

      <Row className="g-3 mb-4">
        <Col md={6}>
          <div className="stat-card-emerald d-flex align-items-center gap-3">
            <div className="stat-icon-wrapper">
              <i className="fas fa-user-check"></i>
            </div>
            <div>
              <h3 className="fw-bold mb-0 text-dark">{data?.totalAssigned || 0}</h3>
              <small className="text-muted fw-semibold">Candidates Assigned to Me</small>
            </div>
          </div>
        </Col>

        <Col md={6}>
          <div className="stat-card-emerald d-flex align-items-center gap-3">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div>
              <h3 className="fw-bold mb-0 text-dark">{data?.pendingInterviews || 0}</h3>
              <small className="text-muted fw-semibold">Pending Interview Rounds</small>
            </div>
          </div>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <Card.Header className="bg-white py-3 fw-bold text-dark border-bottom">
          <i className="fas fa-list me-2" style={{ color: '#10b981' }}></i> My Candidate Applications
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th>Candidate ID</th>
                <th>Full Name</th>
                <th>Requisition</th>
                <th>Stage</th>
                <th>Notice Period</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.candidates?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No candidates currently assigned to you.
                  </td>
                </tr>
              ) : (
                data?.candidates?.map(c => (
                  <tr key={c._id}>
                    <td><Badge bg="dark">{c.candidateId}</Badge></td>
                    <td>
                      <div className="fw-bold">{c.fullName}</div>
                      <small className="text-muted">{c.email}</small>
                    </td>
                    <td>{c.requisition?.title || 'General Pool'}</td>
                    <td><Badge bg="success">{c.stage}</Badge></td>
                    <td>{c.currentNoticePeriod}</td>
                    <td>
                      <Button size="sm" className="btn-emerald-outline" onClick={() => setSelectedCandidate(c)}>
                        Open Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <CandidateDetailDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onRefresh={fetchMyDashboardData}
      />

      <SubmitRecruiterUpdateModal
        show={showLogModal}
        onHide={() => setShowLogModal(false)}
        onSuccess={fetchMyDashboardData}
      />
    </div>
  );
}
