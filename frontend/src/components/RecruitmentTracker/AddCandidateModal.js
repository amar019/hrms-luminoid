import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../../utils/api';
import Swal from 'sweetalert2';

export default function AddCandidateModal({ show, onHide, defaultRequisitionId, onSuccess }) {
  const [requisition, setRequisition] = useState(defaultRequisitionId || '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentNoticePeriod, setCurrentNoticePeriod] = useState('30 Days');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [assignedRecruiter, setAssignedRecruiter] = useState('');
  const [assignedInterviewer, setAssignedInterviewer] = useState('');
  const [stage, setStage] = useState('Sourced');
  const [priority, setPriority] = useState('Medium');
  const [notes, setNotes] = useState('');

  const [requisitions, setRequisitions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      if (defaultRequisitionId) {
        setRequisition(defaultRequisitionId);
      }
      fetchReferenceData();
    }
  }, [show, defaultRequisitionId]);

  const fetchReferenceData = async () => {
    try {
      const [reqsRes, usersRes] = await Promise.all([
        api.get('/api/job-requisitions'),
        api.get('/api/users')
      ]);
      const fetchedReqs = Array.isArray(reqsRes.data) ? reqsRes.data : (reqsRes.data?.data || []);
      const fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);

      setRequisitions(fetchedReqs);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Failed to load reference data", err);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email) {
      Swal.fire('Validation Error', 'Full Name and Email are required', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/candidates', {
        requisition: requisition || null,
        fullName,
        email,
        phone,
        resumeUrl,
        portfolioUrl,
        currentCompany,
        currentNoticePeriod,
        expectedSalary: Number(expectedSalary) || 0,
        assignedRecruiter: assignedRecruiter || null,
        assignedInterviewer: assignedInterviewer || null,
        stage,
        priority,
        notes
      });

      Swal.fire({
        icon: 'success',
        title: 'Candidate Added',
        text: `${fullName} has been added to the recruitment pipeline.`,
        timer: 1800,
        showConfirmButton: false
      });

      setFullName('');
      setEmail('');
      setPhone('');
      setResumeUrl('');
      setPortfolioUrl('');
      setCurrentCompany('');
      setExpectedSalary('');
      setNotes('');

      onSuccess();
      onHide();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to add candidate', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" className="green-modal">
      <Modal.Header closeButton className="green-modal-header">
        <Modal.Title>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-user-plus text-white fs-6"></i>
          </div>
          Add Candidate to Pipeline
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="green-modal-body">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Job Requisition</Form.Label>
                <Form.Select
                  className="green-form-select"
                  value={requisition}
                  onChange={(e) => setRequisition(e.target.value)}
                >
                  <option value="">General Candidate Pool (Unlinked)</option>
                  {requisitions.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.title} ({r.code})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Pipeline Stage</Form.Label>
                <Form.Select className="green-form-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                  <option value="Sourced">1. Sourced</option>
                  <option value="Screening">2. Screening</option>
                  <option value="Technical Interview">3. Technical Interview</option>
                  <option value="Managerial Round">4. Managerial Round</option>
                  <option value="HR Round">5. HR Round</option>
                  <option value="Offer Issued">6. Offer Issued</option>
                  <option value="Hired">7. Hired</option>
                  <option value="Rejected">8. Rejected</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Full Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  className="green-form-control"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Email Address <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="email"
                  className="green-form-control"
                  placeholder="e.g. rahul.sharma@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  className="green-form-control"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Current Company</Form.Label>
                <Form.Control
                  type="text"
                  className="green-form-control"
                  placeholder="e.g. Infosys"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Notice Period</Form.Label>
                <Form.Select className="green-form-select" value={currentNoticePeriod} onChange={(e) => setCurrentNoticePeriod(e.target.value)}>
                  <option value="Immediate">Immediate / Serving</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="60 Days">60 Days</option>
                  <option value="90 Days">90 Days</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Resume Link (Google Drive / Cloud)</Form.Label>
                <Form.Control
                  type="url"
                  className="green-form-control"
                  placeholder="https://drive.google.com/..."
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Expected Salary (INR)</Form.Label>
                <Form.Control
                  type="number"
                  className="green-form-control"
                  placeholder="e.g. 1500000"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Assigned Recruiter</Form.Label>
                <Form.Select
                  className="green-form-select"
                  value={assignedRecruiter}
                  onChange={(e) => setAssignedRecruiter(e.target.value)}
                >
                  <option value="">Select Recruiter</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Assigned Interviewer</Form.Label>
                <Form.Select
                  className="green-form-select"
                  value={assignedInterviewer}
                  onChange={(e) => setAssignedInterviewer(e.target.value)}
                >
                  <option value="">Select Interviewer</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Initial Screening Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="green-form-control"
                  placeholder="Key candidate strengths, background notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
            {loading ? 'Adding...' : 'Add Candidate'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
