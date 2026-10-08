import React, { useState } from 'react';
import { Button, Form, Badge, Tabs, Tab, Card } from 'react-bootstrap';
import api from '../../utils/api';
import Swal from 'sweetalert2';

export default function CandidateDetailDrawer({ candidate, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('overview');

  const [roundName, setRoundName] = useState('Technical Interview');
  const [rating, setRating] = useState(4);
  const [strengths, setStrengths] = useState('');
  const [concerns, setConcerns] = useState('');
  const [decision, setDecision] = useState('Pass');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  if (!candidate) return null;

  const handleStageChange = async (newStage) => {
    try {
      await api.put(`/api/candidates/${candidate._id}/stage`, { stage: newStage });
      Swal.fire({
        icon: 'success',
        title: 'Stage Updated',
        text: `Candidate moved to ${newStage}`,
        timer: 1500,
        showConfirmButton: false
      });
      onRefresh();
    } catch (err) {
      Swal.fire('Error', 'Failed to update candidate stage', 'error');
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.post(`/api/candidates/${candidate._id}/feedback`, {
        roundName,
        rating: Number(rating),
        strengths,
        concerns,
        decision
      });
      Swal.fire({
        icon: 'success',
        title: 'Feedback Submitted',
        text: 'Interview feedback saved successfully',
        timer: 1500,
        showConfirmButton: false
      });
      setStrengths('');
      setConcerns('');
      onRefresh();
    } catch (err) {
      Swal.fire('Error', 'Failed to add feedback', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post(`/api/candidates/${candidate._id}/comments`, {
        text: commentText
      });
      setCommentText('');
      onRefresh();
    } catch (err) {
      Swal.fire('Error', 'Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStageBadgeClass = (s) => {
    switch (s) {
      case 'Sourced': return 'stage-sourced';
      case 'Screening': return 'stage-screening';
      case 'Technical Interview': return 'stage-technical';
      case 'Managerial Round': return 'stage-managerial';
      case 'HR Round': return 'stage-hr';
      case 'Offer Issued': return 'stage-offer';
      case 'Hired': return 'stage-hired';
      case 'Rejected': return 'stage-rejected';
      default: return 'bg-secondary text-white';
    }
  };

  return (
    <>
      <div className="candidate-drawer-backdrop" onClick={onClose}></div>
      <div className="candidate-drawer">
        {/* Header */}
        <div className="candidate-drawer-header d-flex align-items-center justify-content-between">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-dark text-white fw-bold">{candidate.candidateId}</span>
              <span className={`badge-stage ${getStageBadgeClass(candidate.stage)}`}>
                {candidate.stage}
              </span>
            </div>
            <h5 className="mb-0 fw-bold text-dark">{candidate.fullName}</h5>
            <small className="text-muted">{candidate.email} • {candidate.phone || 'No Phone'}</small>
          </div>
          <Button variant="link" className="text-muted p-0" onClick={onClose}>
            <i className="fas fa-times fs-4"></i>
          </Button>
        </div>

        {/* Body */}
        <div className="candidate-drawer-body">
          {/* Stage Transition Selector */}
          <div className="p-3 mb-3 bg-light rounded-3 border">
            <Form.Group className="d-flex align-items-center justify-content-between">
              <Form.Label className="mb-0 fw-bold text-secondary" style={{ fontSize: '0.85rem' }}>
                Pipeline Stage:
              </Form.Label>
              <Form.Select
                size="sm"
                className="green-form-select"
                value={candidate.stage}
                onChange={(e) => handleStageChange(e.target.value)}
                style={{ width: '220px', fontWeight: 600 }}
              >
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
          </div>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            <Tab eventKey="overview" title="Candidate Info">
              <div className="d-flex flex-column gap-3">
                <Card className="border-0 shadow-sm bg-white">
                  <Card.Body>
                    <h6 className="fw-bold mb-3" style={{ color: '#059669' }}><i className="fas fa-id-card me-2"></i>Professional Details</h6>
                    <div className="row g-2" style={{ fontSize: '0.9rem' }}>
                      <div className="col-6"><strong>Requisition:</strong> {candidate.requisition?.title || 'General Pool'}</div>
                      <div className="col-6"><strong>Code:</strong> {candidate.requisition?.code || 'N/A'}</div>
                      <div className="col-6"><strong>Current Company:</strong> {candidate.currentCompany || 'N/A'}</div>
                      <div className="col-6"><strong>Notice Period:</strong> {candidate.currentNoticePeriod}</div>
                      <div className="col-6"><strong>Expected Salary:</strong> ₹{candidate.expectedSalary ? candidate.expectedSalary.toLocaleString() : 'N/A'}</div>
                      <div className="col-6"><strong>Recruiter:</strong> {candidate.assignedRecruiter ? `${candidate.assignedRecruiter.firstName} ${candidate.assignedRecruiter.lastName}` : 'Unassigned'}</div>
                    </div>

                    {candidate.resumeUrl && (
                      <div className="mt-3 pt-3 border-top">
                        <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-emerald-outline btn-sm">
                          <i className="fas fa-file-pdf me-2"></i> View Resume / Portfolio
                        </a>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {candidate.notes && (
                  <Card className="border-0 shadow-sm bg-white">
                    <Card.Body>
                      <h6 className="fw-bold mb-2 text-dark"><i className="fas fa-sticky-note me-2 text-warning"></i>Screening Notes</h6>
                      <p className="mb-0 text-muted" style={{ fontSize: '0.9rem', whitespace: 'pre-line' }}>{candidate.notes}</p>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Tab>

            <Tab eventKey="feedback" title={`Evaluations (${candidate.feedback?.length || 0})`}>
              <div className="d-flex flex-column gap-2 mb-4">
                {candidate.feedback?.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="fas fa-comment-slash fs-2 mb-2 d-block"></i>
                    No interview feedback submitted yet.
                  </div>
                ) : (
                  candidate.feedback.map((fb, idx) => (
                    <Card key={idx} className="border-0 shadow-sm bg-light">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-dark">{fb.roundName}</span>
                          <Badge bg={fb.decision === 'Reject' ? 'danger' : 'success'}>
                            {fb.decision} ({fb.rating}/5 ★)
                          </Badge>
                        </div>
                        <small className="text-muted d-block mb-2">
                          By {fb.interviewer ? `${fb.interviewer.firstName} ${fb.interviewer.lastName}` : 'Interviewer'} on {new Date(fb.createdAt).toLocaleDateString()}
                        </small>
                        {fb.strengths && <div style={{ fontSize: '0.85rem' }}><strong>Strengths:</strong> {fb.strengths}</div>}
                        {fb.concerns && <div style={{ fontSize: '0.85rem' }} className="text-danger mt-1"><strong>Concerns:</strong> {fb.concerns}</div>}
                      </Card.Body>
                    </Card>
                  ))
                )}
              </div>

              {/* Add Feedback Form */}
              <Card className="border shadow-sm">
                <Card.Header className="bg-white fw-bold">Submit Interview Evaluation</Card.Header>
                <Card.Body>
                  <Form onSubmit={handleAddFeedback}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-bold">Round Name</Form.Label>
                      <Form.Select size="sm" className="green-form-select" value={roundName} onChange={(e) => setRoundName(e.target.value)}>
                        <option value="Phone Screening">Phone Screening</option>
                        <option value="Technical Interview">Technical Interview</option>
                        <option value="Managerial Round">Managerial Round</option>
                        <option value="HR Round">HR Round</option>
                      </Form.Select>
                    </Form.Group>

                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <Form.Label className="small fw-bold">Rating (1-5)</Form.Label>
                        <Form.Select size="sm" className="green-form-select" value={rating} onChange={(e) => setRating(e.target.value)}>
                          <option value="5">5 ★ - Exceptional</option>
                          <option value="4">4 ★ - Strong Hire</option>
                          <option value="3">3 ★ - Acceptable</option>
                          <option value="2">2 ★ - Marginal</option>
                          <option value="1">1 ★ - Reject</option>
                        </Form.Select>
                      </div>
                      <div className="col-6">
                        <Form.Label className="small fw-bold">Decision</Form.Label>
                        <Form.Select size="sm" className="green-form-select" value={decision} onChange={(e) => setDecision(e.target.value)}>
                          <option value="Strong Pass">Strong Pass</option>
                          <option value="Pass">Pass</option>
                          <option value="Neutral">Neutral</option>
                          <option value="Reject">Reject</option>
                        </Form.Select>
                      </div>
                    </div>

                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-bold">Key Strengths</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        size="sm"
                        className="green-form-control"
                        placeholder="Technical skills, communication..."
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Concerns / Red Flags</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        size="sm"
                        className="green-form-control"
                        placeholder="Salary expectation, notice period..."
                        value={concerns}
                        onChange={(e) => setConcerns(e.target.value)}
                      />
                    </Form.Group>

                    <Button className="btn-emerald-primary w-100" size="sm" type="submit" disabled={submittingFeedback}>
                      {submittingFeedback ? 'Saving...' : 'Submit Evaluation'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="comments" title={`Activity & Notes (${candidate.comments?.length || 0})`}>
              <div className="d-flex flex-column gap-2 mb-3">
                {candidate.comments?.map((c, i) => (
                  <div key={i} className="p-2.5 bg-light rounded border" style={{ fontSize: '0.85rem' }}>
                    <div className="d-flex justify-content-between">
                      <strong className="text-dark">{c.author ? `${c.author.firstName} ${c.author.lastName}` : 'User'}</strong>
                      <small className="text-muted">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <div className="mt-1">{c.text}</div>
                  </div>
                ))}
              </div>

              <Form onSubmit={handleAddComment}>
                <Form.Group className="mb-2">
                  <Form.Control
                    as="textarea"
                    rows={2}
                    size="sm"
                    className="green-form-control"
                    placeholder="Add a comment or update note..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                </Form.Group>
                <Button className="btn-emerald-primary" size="sm" type="submit" disabled={submittingComment || !commentText.trim()}>
                  Post Comment
                </Button>
              </Form>
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
}
