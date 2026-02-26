import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Modal, Form, Table, Badge, Container, Row, Col, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import api from '../utils/api';
import { toast } from 'react-toastify';

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState({ title: '', description: '', targetDate: '', owner: '' });
  const [goalFilter, setGoalFilter] = useState('ALL');
  const [goalSort, setGoalSort] = useState('targetDate');

  useEffect(() => {
    fetchDepartmentDetails();
  }, [id]);

  useEffect(() => {
    if (department) {
      document.title = `${department.name} - Department Details`;
    }
    return () => {
      document.title = 'HRMS Pro';
    };
  }, [department]);

  const fetchDepartmentDetails = async () => {
    try {
      console.log('Fetching department with ID:', id);
      const res = await api.get(`/api/departments/${id}`);
      console.log('Department response:', res.data);
      setDepartment(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching department:', error);
      toast.error(error.response?.data?.message || 'Failed to load department details');
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/departments/${id}/goals`, goalData);
      toast.success('Goal added successfully');
      setShowGoalModal(false);
      setGoalData({ title: '', description: '', targetDate: '', owner: '' });
      fetchDepartmentDetails();
    } catch (error) {
      toast.error('Failed to add goal');
    }
  };

  const handleUpdateGoal = async (goalId, progress, status, owner) => {
    try {
      await api.put(`/api/departments/${id}/goals/${goalId}`, { progress, status, owner });
      toast.success('Goal updated');
      fetchDepartmentDetails();
    } catch (error) {
      toast.error('Failed to update goal');
    }
  };

  const getDaysUntilDeadline = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineAlert = (targetDate, status) => {
    if (status === 'COMPLETED' || status === 'ARCHIVED') return null;
    const days = getDaysUntilDeadline(targetDate);
    if (days < 0) return { color: 'danger', text: `${Math.abs(days)} days overdue`, icon: 'exclamation-circle' };
    if (days <= 7) return { color: 'warning', text: `${days} days left`, icon: 'clock' };
    return null;
  };

  const getFilteredAndSortedGoals = () => {
    let filtered = department.goals.filter(g => {
      if (goalFilter === 'ALL') return g.status !== 'ARCHIVED';
      if (goalFilter === 'ARCHIVED') return g.status === 'ARCHIVED';
      return g.status === goalFilter;
    });

    return filtered.sort((a, b) => {
      if (goalSort === 'targetDate') return new Date(a.targetDate) - new Date(b.targetDate);
      if (goalSort === 'progress') return b.progress - a.progress;
      if (goalSort === 'status') return a.status.localeCompare(b.status);
      return 0;
    });
  };

  if (loading) return (
    <div className="text-center p-5">
      <div className="spinner-border" style={{color: '#667eea'}}></div>
      <p className="mt-3" style={{color: '#667eea'}}>Loading department details...</p>
    </div>
  );
  if (!department) return <div className="text-center p-5">Department not found</div>;

  return (
    <Container fluid className="p-4" style={{background: '#f8f9fa', minHeight: '100vh'}}>
      <style>{`
        .dept-detail-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          color: white;
        }
        .stat-card {
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }
        .stat-card-1 { border-top: 4px solid #667eea; }
        .stat-card-2 { border-top: 4px solid #11998e; }
        .stat-card-3 { border-top: 4px solid #4facfe; }
        .stat-card-4 { border-top: 4px solid #fa709a; }
        .stat-icon-1 { color: #667eea; }
        .stat-icon-2 { color: #11998e; }
        .stat-icon-3 { color: #4facfe; }
        .stat-icon-4 { color: #fa709a; }
        .content-card {
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .nav-tabs .nav-link {
          border: none;
          color: #6c757d;
          font-weight: 600;
          padding: 12px 24px;
          transition: all 0.3s ease;
        }
        .nav-tabs .nav-link:hover {
          color: #667eea;
          background: #f8f9ff;
        }
        .nav-tabs .nav-link.active {
          color: #667eea;
          background: white;
          border-bottom: 3px solid #667eea;
        }
        .table thead {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .table thead th {
          border: none;
          padding: 16px;
          font-weight: 600;
        }
        .table tbody tr {
          transition: all 0.3s ease;
        }
        .table tbody tr:hover {
          background: #f8f9ff;
          transform: translateX(4px);
        }
        .btn-add-custom {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          border: none;
          color: white;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .btn-add-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(17, 153, 142, 0.4);
        }
        .goal-card {
          border-left: 4px solid #667eea;
          transition: all 0.3s ease;
        }
        .goal-card:hover {
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transform: translateX(4px);
        }
      `}</style>

      <div className="dept-detail-header">
        <Button variant="link" onClick={() => navigate('/departments')} className="text-white p-0 mb-3" style={{textDecoration: 'none'}}>
          <i className="fas fa-arrow-left me-2"></i>Back to Departments
        </Button>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-2 fw-bold">
              <i className="fas fa-building me-3"></i>{department.name}
            </h2>
            <p className="mb-0 opacity-90">
              <i className="fas fa-tag me-2"></i>Code: {department.code}
            </p>
          </div>
          <Badge bg={department.status === 'ACTIVE' ? 'success' : 'danger'} style={{fontSize: '1rem', padding: '10px 20px'}}>
            {department.status}
          </Badge>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card stat-card-1 text-center">
            <Card.Body>
              <i className="fas fa-users fa-3x stat-icon-1 mb-3"></i>
              <h3 className="fw-bold">{department.stats.totalEmployees}</h3>
              <p className="text-muted mb-0">Total Employees</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card stat-card-2 text-center">
            <Card.Body>
              <i className="fas fa-bullseye fa-3x stat-icon-2 mb-3"></i>
              <h3 className="fw-bold">{department.stats.activeGoals}</h3>
              <p className="text-muted mb-0">Active Goals</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card stat-card-3 text-center">
            <Card.Body>
              <i className="fas fa-file-alt fa-3x stat-icon-3 mb-3"></i>
              <h3 className="fw-bold">{department.stats.totalDocuments}</h3>
              <p className="text-muted mb-0">Documents</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card stat-card-4 text-center">
            <Card.Body>
              <i className="fas fa-sitemap fa-3x stat-icon-4 mb-3"></i>
              <h3 className="fw-bold">{department.stats.subDepartments}</h3>
              <p className="text-muted mb-0">Sub-Departments</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="employees" className="mb-3">
        <Tab eventKey="employees" title={<span><i className="fas fa-users me-2"></i>Employees ({department.employees.length})</span>}>
          <Card className="content-card">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Designation</th>
                    <th>Role</th>
                    <th>Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {department.employees.map(emp => (
                    <tr key={emp._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt="" className="rounded-circle me-2" style={{width: '32px', height: '32px'}} />
                          ) : (
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '32px', height: '32px'}}>
                              <span className="text-white">{emp.firstName[0]}</span>
                            </div>
                          )}
                          {emp.firstName} {emp.lastName}
                        </div>
                      </td>
                      <td>{emp.email}</td>
                      <td>{emp.designation || '-'}</td>
                      <td><Badge bg="secondary">{emp.role}</Badge></td>
                      <td>{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                  {department.employees.length === 0 && (
                    <tr><td colSpan="5" className="text-center text-muted">No employees assigned</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="goals" title={<span><i className="fas fa-bullseye me-2"></i>Goals & KPIs</span>}>
          <Card className="content-card">
            <Card.Header className="bg-white border-0 pt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Department Goals</h5>
                <Button className="btn-add-custom" size="sm" onClick={() => setShowGoalModal(true)}>
                  <i className="fas fa-plus me-2"></i>Add Goal
                </Button>
              </div>
              <div className="d-flex gap-2">
                <Form.Select size="sm" value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)} style={{width: 'auto'}}>
                  <option value="ALL">All Active</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="ARCHIVED">Archived</option>
                </Form.Select>
                <Form.Select size="sm" value={goalSort} onChange={(e) => setGoalSort(e.target.value)} style={{width: 'auto'}}>
                  <option value="targetDate">Sort by Deadline</option>
                  <option value="progress">Sort by Progress</option>
                  <option value="status">Sort by Status</option>
                </Form.Select>
              </div>
            </Card.Header>
            <Card.Body>
              {getFilteredAndSortedGoals().map(goal => {
                const alert = getDeadlineAlert(goal.targetDate, goal.status);
                return (
                  <Card key={goal._id} className="mb-3 goal-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <h6 className="mb-0">{goal.title}</h6>
                            {alert && (
                              <Badge bg={alert.color} className="d-flex align-items-center gap-1">
                                <i className={`fas fa-${alert.icon}`}></i>
                                {alert.text}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted mb-2">{goal.description}</p>
                          <div className="d-flex gap-3 text-muted small">
                            <span><i className="fas fa-calendar me-1"></i>{new Date(goal.targetDate).toLocaleDateString()}</span>
                            {goal.owner && (
                              <span><i className="fas fa-user me-1"></i>{goal.owner.firstName} {goal.owner.lastName}</span>
                            )}
                          </div>
                        </div>
                        <Badge bg={
                          goal.status === 'COMPLETED' ? 'success' :
                          goal.status === 'IN_PROGRESS' ? 'primary' :
                          goal.status === 'DELAYED' ? 'danger' : 
                          goal.status === 'ARCHIVED' ? 'secondary' : 'secondary'
                        }>{goal.status.replace('_', ' ')}</Badge>
                      </div>
                      <ProgressBar now={goal.progress} label={`${goal.progress}%`} className="mb-2" />
                      <div className="d-flex gap-2">
                        <Form.Select size="sm" style={{width: 'auto'}} value={goal.owner?._id || ''}
                          onChange={(e) => handleUpdateGoal(goal._id, goal.progress, goal.status, e.target.value)}>
                          <option value="">Assign Owner</option>
                          {department.employees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                          ))}
                        </Form.Select>
                        <Form.Select size="sm" style={{width: 'auto'}} value={goal.progress} 
                          onChange={(e) => handleUpdateGoal(goal._id, parseInt(e.target.value), goal.status, goal.owner?._id)}>
                          {[0,25,50,75,100].map(v => <option key={v} value={v}>{v}%</option>)}
                        </Form.Select>
                        <Form.Select size="sm" style={{width: 'auto'}} value={goal.status}
                          onChange={(e) => handleUpdateGoal(goal._id, goal.progress, e.target.value, goal.owner?._id)}>
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="DELAYED">Delayed</option>
                          <option value="ARCHIVED">Archive</option>
                        </Form.Select>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
              {getFilteredAndSortedGoals().length === 0 && (
                <p className="text-center text-muted">No goals found</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="info" title={<span><i className="fas fa-info-circle me-2"></i>Information</span>}>
          <Card className="content-card">
            <Card.Body className="p-4">
              <Row>
                <Col md={6}>
                  <p><strong>Code:</strong> {department.code}</p>
                  <p><strong>Location:</strong> {department.location || 'Not specified'}</p>
                  <p><strong>Department Head:</strong> {department.departmentHead ? 
                    `${department.departmentHead.firstName} ${department.departmentHead.lastName}` : 'Not assigned'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Parent Department:</strong> {department.parentDepartment?.name || 'None'}</p>
                  <p><strong>Created:</strong> {new Date(department.createdAt).toLocaleDateString()}</p>
                  <p><strong>Description:</strong> {department.description || 'No description'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Add Goal Modal */}
      <Modal show={showGoalModal} onHide={() => setShowGoalModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Goal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddGoal}>
            <Form.Group className="mb-3">
              <Form.Label>Goal Title *</Form.Label>
              <Form.Control type="text" value={goalData.title} 
                onChange={(e) => setGoalData({...goalData, title: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={goalData.description}
                onChange={(e) => setGoalData({...goalData, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Goal Owner</Form.Label>
              <Form.Select value={goalData.owner} onChange={(e) => setGoalData({...goalData, owner: e.target.value})}>
                <option value="">Select Owner</option>
                {department.employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Target Date *</Form.Label>
              <Form.Control type="date" value={goalData.targetDate}
                onChange={(e) => setGoalData({...goalData, targetDate: e.target.value})} required />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowGoalModal(false)}>Cancel</Button>
              <Button type="submit">Add Goal</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DepartmentDetails;
