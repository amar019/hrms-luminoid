import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../../utils/api';
import Swal from 'sweetalert2';

export default function SubmitRecruiterUpdateModal({ show, onHide, onSuccess }) {
  const [requisition, setRequisition] = useState('');
  const [profilesSourcedCount, setProfilesSourcedCount] = useState(0);
  const [callsConductedCount, setCallsConductedCount] = useState(0);
  const [interviewsScheduledCount, setInterviewsScheduledCount] = useState(0);
  const [offersExtendedCount, setOffersExtendedCount] = useState(0);
  const [notesWorkedOn, setNotesWorkedOn] = useState('');
  const [blockers, setBlockers] = useState('');
  const [highlights, setHighlights] = useState('');

  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchRequisitions();
    }
  }, [show]);

  const fetchRequisitions = async () => {
    try {
      const res = await api.get('/api/job-requisitions');
      setRequisitions(res.data || []);
    } catch (err) {
      console.error("Failed to load requisitions", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notesWorkedOn.trim()) {
      Swal.fire('Validation Error', 'Please describe the tasks worked on today', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/recruitment-daily-updates', {
        requisition: requisition || null,
        profilesSourcedCount: Number(profilesSourcedCount),
        callsConductedCount: Number(callsConductedCount),
        interviewsScheduledCount: Number(interviewsScheduledCount),
        offersExtendedCount: Number(offersExtendedCount),
        notesWorkedOn,
        blockers,
        highlights
      });

      Swal.fire({
        icon: 'success',
        title: 'Daily Log Submitted',
        text: 'Your daily recruitment activity log has been saved.',
        timer: 1800,
        showConfirmButton: false
      });

      setNotesWorkedOn('');
      setBlockers('');
      setHighlights('');
      setProfilesSourcedCount(0);
      setCallsConductedCount(0);
      setInterviewsScheduledCount(0);
      setOffersExtendedCount(0);

      onSuccess();
      onHide();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to submit log', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" className="green-modal">
      <Modal.Header closeButton className="green-modal-header">
        <Modal.Title>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-edit text-white fs-6"></i>
          </div>
          Submit Recruiter Daily Activity Log
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="green-modal-body">
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Target Job Requisition (Optional)</Form.Label>
                <Form.Select className="green-form-select" value={requisition} onChange={(e) => setRequisition(e.target.value)}>
                  <option value="">General Sourcing Across Drives</option>
                  {requisitions.map(r => (
                    <option key={r._id} value={r._id}>{r.title} ({r.code})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Sourced</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  className="green-form-control text-center fw-bold"
                  value={profilesSourcedCount}
                  onChange={(e) => setProfilesSourcedCount(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Calls Done</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  className="green-form-control text-center fw-bold"
                  value={callsConductedCount}
                  onChange={(e) => setCallsConductedCount(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Interviews Fixed</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  className="green-form-control text-center fw-bold"
                  value={interviewsScheduledCount}
                  onChange={(e) => setInterviewsScheduledCount(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Offers Rolled</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  className="green-form-control text-center fw-bold"
                  value={offersExtendedCount}
                  onChange={(e) => setOffersExtendedCount(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Daily Work Summary <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  className="green-form-control"
                  placeholder="Summarize candidate sourcing on LinkedIn/Naukri, interviews scheduled..."
                  value={notesWorkedOn}
                  onChange={(e) => setNotesWorkedOn(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-danger"><i className="fas fa-exclamation-circle me-1"></i> Bottlenecks / Blockers</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="green-form-control border-danger-subtle"
                  placeholder="Salary mismatches, notice period delays..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-success"><i className="fas fa-star me-1"></i> Key Sourcing Highlights</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="green-form-control border-success-subtle"
                  placeholder="Strong candidates identified, accepted offer letters..."
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="green-modal-footer">
          <Button variant="link" className="text-muted fw-bold text-decoration-none me-2" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button className="btn-emerald-primary" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Activity Log'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
