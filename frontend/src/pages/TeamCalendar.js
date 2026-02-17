import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge, Table, Spinner, Alert, Pagination } from 'react-bootstrap';
import api from '../utils/api';
import { toast } from 'react-toastify';

const TeamCalendar = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 6;

  useEffect(() => {
    fetchTeamCalendar();
  }, []);

  const fetchTeamCalendar = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/leave-requests/team-calendar');
      setTeamMembers(response.data.teamMembers || []);
      setLeaves(response.data.leaves || []);
      setError('');
    } catch (err) {
      console.error('Error fetching team calendar:', err);
      setError('Failed to load team calendar');
      toast.error('Failed to load team calendar');
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
    return (
      <Badge bg={variants[status] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group leaves by employee
  const leavesByEmployee = leaves.reduce((acc, leave) => {
    const employeeId = leave.userId._id;
    if (!acc[employeeId]) {
      acc[employeeId] = [];
    }
    acc[employeeId].push(leave);
    return acc;
  }, {});

  // Pagination logic
  const totalPages = Math.ceil(teamMembers.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const currentMembers = teamMembers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Loading team calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in-up">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="page-header d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title mb-1">
            <i className="fas fa-calendar-alt me-3 text-primary"></i>
            Team Calendar
          </h1>
          <p className="text-muted mb-0">View upcoming leaves for your team members</p>
        </div>
        <Badge bg="info" className="fs-6 px-3 py-2">
          {teamMembers.length} Team {teamMembers.length === 1 ? 'Member' : 'Members'}
        </Badge>
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <i className="fas fa-users text-muted fs-1 mb-3"></i>
            <p className="text-muted mb-0">No team members found</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Summary Card */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <i className="fas fa-users text-primary fs-1 mb-2"></i>
                  <div className="fs-3 fw-bold">{teamMembers.length}</div>
                  <p className="text-muted mb-0">Team Members</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <i className="fas fa-calendar-check text-success fs-1 mb-2"></i>
                  <div className="fs-3 fw-bold">{leaves.length}</div>
                  <p className="text-muted mb-0">Upcoming Leaves</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <i className="fas fa-clock text-warning fs-1 mb-2"></i>
                  <div className="fs-3 fw-bold">
                    {leaves.filter(l => new Date(l.startDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                  </div>
                  <p className="text-muted mb-0">Leaves This Week</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Upcoming Leaves Table */}
          <Card className="modern-table-wrapper mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Upcoming Leaves (Next 90 Days)
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {leaves.length === 0 ? (
                <div className="table-empty">
                  <i className="fas fa-calendar-times"></i>
                  <p className="mb-0">No upcoming leaves scheduled</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table className="table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map(leave => (
                        <tr key={leave._id}>
                          <td>
                            <div>
                              <div className="fw-semibold">
                                {leave.userId.firstName} {leave.userId.lastName}
                              </div>
                              {leave.userId.department && (
                                <small className="text-muted">{leave.userId.department}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div 
                                className="table-color-indicator"
                                style={{ backgroundColor: leave.leaveTypeId?.color || '#6c757d' }}
                              ></div>
                              <span className="fw-semibold">{leave.leaveTypeId?.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted">{formatDate(leave.startDate)}</span>
                          </td>
                          <td>
                            <span className="text-muted">{formatDate(leave.endDate)}</span>
                          </td>
                          <td>
                            <div>
                              <strong className="text-primary">{leave.days}</strong> {leave.days === 1 ? 'day' : 'days'}
                              {leave.isHalfDay && (
                                <Badge bg="secondary" className="ms-2">Half Day</Badge>
                              )}
                            </div>
                          </td>
                          <td>{getStatusBadge(leave.status)}</td>
                          <td>
                            <small className="text-muted" title={leave.reason}>
                              {leave.reason ? (leave.reason.length > 50 ? leave.reason.substring(0, 50) + '...' : leave.reason) : 'N/A'}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Team Members with Leaves */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>
                Team Members Overview
              </h5>
              {teamMembers.length > membersPerPage && (
                <small className="text-muted">
                  Showing {startIndex + 1}-{Math.min(endIndex, teamMembers.length)} of {teamMembers.length} members
                </small>
              )}
            </Card.Header>
            <Card.Body>
              {teamMembers.length === 0 ? (
                <p className="text-muted text-center py-3">No team members found</p>
              ) : (
                <Row>
                  {currentMembers.map(member => {
                    const memberLeaves = leavesByEmployee[member._id] || [];
                    return (
                      <Col md={6} lg={4} key={member._id} className="mb-3">
                        <Card className="h-100">
                          <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  backgroundColor: '#0d6efd',
                                  color: 'white',
                                  fontSize: '20px'
                                }}
                              >
                                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                              </div>
                              <div>
                                <div className="fw-semibold">
                                  {member.firstName} {member.lastName}
                                </div>
                                {member.department && (
                                  <small className="text-muted">{member.department}</small>
                                )}
                              </div>
                            </div>
                            {memberLeaves.length > 0 ? (
                              <div>
                                <small className="text-muted d-block mb-2">
                                  {memberLeaves.length} upcoming {memberLeaves.length === 1 ? 'leave' : 'leaves'}
                                </small>
                                {memberLeaves.slice(0, 3).map(leave => (
                                  <div key={leave._id} className="mb-2 p-2 bg-light rounded">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <small className="fw-semibold">
                                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                        </small>
                                        <br />
                                        <Badge
                                          bg="light"
                                          text="dark"
                                          style={{
                                            backgroundColor: leave.leaveTypeId?.color || '#6c757d',
                                            color: 'white',
                                            fontSize: '10px'
                                          }}
                                        >
                                          {leave.leaveTypeId?.name}
                                        </Badge>
                                      </div>
                                      <small className="text-muted">{leave.days}d</small>
                                    </div>
                                  </div>
                                ))}
                                {memberLeaves.length > 3 && (
                                  <small className="text-muted">
                                    +{memberLeaves.length - 3} more leave{memberLeaves.length - 3 > 1 ? 's' : ''}
                                  </small>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <small className="text-muted">No upcoming leaves</small>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.First 
                      onClick={() => handlePageChange(1)} 
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage === 1}
                    />
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last 
                      onClick={() => handlePageChange(totalPages)} 
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default TeamCalendar;
