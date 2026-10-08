import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../../utils/api';
import Swal from 'sweetalert2';

export default function CreateRequisitionModal({ show, onHide, onSuccess }) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('');
  const [hiringManager, setHiringManager] = useState('');
  const [hiringManagerCustom, setHiringManagerCustom] = useState('');
  const [isManualManager, setIsManualManager] = useState(false);
  const [targetHires, setTargetHires] = useState(1);
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [experienceYears, setExperienceYears] = useState('1-3 years');
  const [location, setLocation] = useState('On-site');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [priority, setPriority] = useState('MEDIUM');
  const [targetCloseDate, setTargetCloseDate] = useState('');
  const [description, setDescription] = useState('');

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchUsersAndDepartments();
    }
  }, [show]);

  const fetchUsersAndDepartments = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/departments?limit=1000')
      ]);
      const fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
      const fetchedDepts = Array.isArray(deptsRes.data?.data) ? deptsRes.data.data : (Array.isArray(deptsRes.data) ? deptsRes.data : []);

      setUsers(fetchedUsers);
      setDepartments(fetchedDepts);
    } catch (err) {
      console.error("Failed to fetch reference data", err);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalManager = isManualManager ? hiringManagerCustom.trim() : hiringManager;
    if (!title || !code || !finalManager) {
      Swal.fire('Validation Error', 'Please fill in Job Title, Code, and Hiring Manager', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/job-requisitions', {
        title,
        code,
        department: department || null,
        hiringManager: isManualManager ? null : hiringManager,
        hiringManagerName: isManualManager ? hiringManagerCustom.trim() : null,
        targetHires: Number(targetHires),
        salaryRange: {
          min: Number(minSalary) || 0,
          max: Number(maxSalary) || 0,
          currency: 'INR'
        },
        experienceYears,
        location,
        employmentType,
        priority,
        targetCloseDate: targetCloseDate || null,
        description
      });

      Swal.fire({
        icon: 'success',
        title: 'Requisition Created',
        text: `Job Requisition ${code} has been created successfully.`,
        timer: 1800,
        showConfirmButton: false
      });

      setTitle('');
      setCode('');
      setDepartment('');
      setHiringManager('');
      setHiringManagerCustom('');
      setIsManualManager(false);
      setTargetHires(1);
      setMinSalary('');
      setMaxSalary('');
      setDescription('');

      onSuccess();
      onHide();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to create requisition', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" className="green-modal">
      <Modal.Header closeButton className="green-modal-header">
        <Modal.Title>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-briefcase text-white fs-6"></i>
          </div>
          Create New Job Requisition
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="green-modal-body">
          <Row className="g-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Job Title <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  className="green-form-control"
                  placeholder="e.g. Senior Fullstack Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Requisition Code <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  className="green-form-control font-monospace"
                  placeholder="e.g. REQ-DEV-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Form.Label className="fw-bold small text-dark mb-0">Hiring Manager <span className="text-danger">*</span></Form.Label>
                  <Button
                    variant="link"
                    className="p-0 text-emerald text-decoration-none fw-bold"
                    style={{ fontSize: '0.78rem', color: '#059669' }}
                    onClick={() => setIsManualManager(!isManualManager)}
                  >
                    {isManualManager ? '← Pick from Directory' : '+ Enter Name Manually'}
                  </Button>
                </div>
                {isManualManager ? (
                  <Form.Control
                    type="text"
                    className="green-form-control"
                    placeholder="e.g. Vikram Seth (Head of Talent Acquisition)"
                    value={hiringManagerCustom}
                    onChange={(e) => setHiringManagerCustom(e.target.value)}
                    required
                  />
                ) : (
                  <Form.Select
                    className="green-form-select"
                    value={hiringManager}
                    onChange={(e) => setHiringManager(e.target.value)}
                    required
                  >
                    <option value="">Select Hiring Manager</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Department</Form.Label>
                <Form.Select
                  className="green-form-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Target Hires</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  className="green-form-control"
                  value={targetHires}
                  onChange={(e) => setTargetHires(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Priority</Form.Label>
                <Form.Select className="green-form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Target Close Date</Form.Label>
                <Form.Control
                  type="date"
                  className="green-form-control"
                  value={targetCloseDate}
                  onChange={(e) => setTargetCloseDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Min Salary (INR)</Form.Label>
                <Form.Control
                  type="number"
                  className="green-form-control"
                  placeholder="e.g. 600000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Max Salary (INR)</Form.Label>
                <Form.Control
                  type="number"
                  className="green-form-control"
                  placeholder="e.g. 1200000"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Employment Type</Form.Label>
                <Form.Select className="green-form-select" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark">Job Description & Requirements</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  className="green-form-control"
                  placeholder="Key responsibilities, required skills, technical stack..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
            {loading ? 'Creating...' : 'Create Job Requisition'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
