import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../utils/api';

const Approvals = () => {
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [action, setAction] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get('/api/leave-requests/pending');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const handleAction = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setShowModal(true);
  };

  const submitAction = async () => {
    setLoading(true);
    try {
      await api.put(`/api/leave-requests/${selectedRequest._id}/approve-reject`, {
        action,
        comments
      });
      
      toast.success(`Leave request ${action}d successfully`);
      setShowModal(false);
      setComments('');
      fetchPendingApprovals();
    } catch (error) {
      toast.error(error.response?.data?.message || `Error ${action}ing leave request`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      MANAGER_APPROVED: 'info',
      HR_APPROVED: 'success',
      REJECTED: 'danger',
      CANCELLED: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-tasks me-3"></i>
          Pending Approvals
        </h1>
        <p className="text-muted mb-0">Review and approve team leave requests</p>
      </div>
      
      {requests.length === 0 ? (
        <div className="modern-table-wrapper">
          <div className="table-empty">
            <i className="fas fa-check-circle"></i>
            <p className="mb-0">No pending approvals</p>
          </div>
        </div>
      ) : (
        <div className="modern-table-wrapper">
          <div className="p-0">
            <div className="table-responsive">
              <Table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(request => (
                    <tr key={request._id}>
                      <td>
                        <div>
                          <div className="fw-semibold">{request.userId?.firstName} {request.userId?.lastName}</div>
                          <small className="text-muted">
                            {request.employeeId ? `ID: ${request.employeeId}` : request.userId?.email}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted">{request.userId?.department || 'N/A'}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div 
                            className="table-color-indicator"
                            style={{ backgroundColor: request.leaveTypeId?.color }}
                          ></div>
                          <span className="fw-semibold">{request.leaveTypeId?.name}</span>
                        </div>
                      </td>
                      <td>{new Date(request.startDate).toLocaleDateString()}</td>
                      <td>{new Date(request.endDate).toLocaleDateString()}</td>
                      <td>
                        <span className="fw-semibold">{request.days}</span>
                        {request.isLOP && <Badge bg="warning" className="ms-2">LOP</Badge>}
                      </td>
                      <td>{getStatusBadge(request.status)}</td>
                      <td>
                        <span className="text-muted" title={request.reason}>
                          {request.reason?.length > 30 ? request.reason.substring(0, 30) + '...' : request.reason}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleAction(request, 'approve')}
                          >
                            <i className="fas fa-check me-1"></i>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleAction(request, 'reject')}
                          >
                            <i className="fas fa-times me-1"></i>
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {action === 'approve' ? 'Approve' : 'Reject'} Leave Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <p><strong>Employee:</strong> {selectedRequest.userId?.firstName} {selectedRequest.userId?.lastName}</p>
              <p><strong>Leave Type:</strong> {selectedRequest.leaveTypeId?.name}</p>
              <p><strong>Duration:</strong> {new Date(selectedRequest.startDate).toLocaleDateString()} to {new Date(selectedRequest.endDate).toLocaleDateString()}</p>
              <p><strong>Days:</strong> {selectedRequest.days}</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              
              <Form.Group className="mt-3">
                <Form.Label>Comments {action === 'reject' && <span className="text-danger">*</span>}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={`Add comments for ${action}al...`}
                  required={action === 'reject'}
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant={action === 'approve' ? 'success' : 'danger'}
            onClick={submitAction}
            disabled={loading || (action === 'reject' && !comments.trim())}
          >
            {loading ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Approvals;