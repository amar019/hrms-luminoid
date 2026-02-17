import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Table, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Assets = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [assetForm, setAssetForm] = useState({
    assetId: '',
    name: '',
    category: 'LAPTOP',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    condition: 'NEW'
  });

  useEffect(() => {
    fetchAssets();
    if (['HR', 'ADMIN'].includes(user?.role)) {
      fetchEmployees();
    }
  }, [user?.role]);

  const fetchAssets = async () => {
    try {
      const response = await api.get('/api/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/assets', assetForm);
      setShowModal(false);
      setAssetForm({ assetId: '', name: '', category: 'LAPTOP', brand: '', model: '', serialNumber: '', purchaseDate: '', condition: 'NEW' });
      fetchAssets();
      toast.success('Asset added successfully');
    } catch (error) {
      toast.error('Error adding asset');
    }
  };

  const handleAssign = async (assetId, employeeId) => {
    try {
      await api.put(`/api/assets/${assetId}/assign`, { employeeId });
      fetchAssets();
      toast.success('Asset assigned successfully');
    } catch (error) {
      toast.error('Error assigning asset');
    }
  };

  const handleReturn = async (assetId) => {
    try {
      await api.put(`/api/assets/${assetId}/return`);
      fetchAssets();
      toast.success('Asset returned successfully');
    } catch (error) {
      toast.error('Error returning asset');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      AVAILABLE: 'success',
      ASSIGNED: 'primary',
      MAINTENANCE: 'warning',
      RETIRED: 'secondary'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1 className="page-title">
            <i className="fas fa-laptop me-3 text-primary"></i>
            Asset Management
          </h1>
          <p className="text-muted">Track and manage company assets</p>
        </div>
        {['HR', 'ADMIN'].includes(user?.role) && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus me-2"></i>Add Asset
          </Button>
        )}
      </div>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Company Assets</h5>
            </Card.Header>
            <Card.Body>
              {assets.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Asset ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Brand/Model</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(asset => (
                      <tr key={asset._id}>
                        <td><strong>{asset.assetId}</strong></td>
                        <td>{asset.name}</td>
                        <td>{asset.category}</td>
                        <td>{asset.brand} {asset.model}</td>
                        <td>{getStatusBadge(asset.status)}</td>
                        <td>
                          {asset.assignedTo ? 
                            `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : 
                            '-'
                          }
                        </td>
                        <td>
                          {['HR', 'ADMIN'].includes(user?.role) && (
                            <div className="d-flex gap-2">
                              {asset.status === 'AVAILABLE' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    const employeeId = prompt('Enter employee ID to assign:');
                                    if (employeeId) handleAssign(asset._id, employeeId);
                                  }}
                                >
                                  Assign
                                </Button>
                              )}
                              {asset.status === 'ASSIGNED' && (
                                <Button
                                  size="sm"
                                  variant="warning"
                                  onClick={() => handleReturn(asset._id)}
                                >
                                  Return
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-laptop text-muted fs-1 mb-3"></i>
                  <p className="text-muted mb-0">No assets found</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Asset Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Asset</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Asset ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={assetForm.assetId}
                    onChange={(e) => setAssetForm({...assetForm, assetId: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Asset Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({...assetForm, category: e.target.value})}
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="DESKTOP">Desktop</option>
                    <option value="MOBILE">Mobile</option>
                    <option value="TABLET">Tablet</option>
                    <option value="MONITOR">Monitor</option>
                    <option value="KEYBOARD">Keyboard</option>
                    <option value="MOUSE">Mouse</option>
                    <option value="HEADSET">Headset</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Condition</Form.Label>
                  <Form.Select
                    value={assetForm.condition}
                    onChange={(e) => setAssetForm({...assetForm, condition: e.target.value})}
                  >
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Brand</Form.Label>
                  <Form.Control
                    type="text"
                    value={assetForm.brand}
                    onChange={(e) => setAssetForm({...assetForm, brand: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model</Form.Label>
                  <Form.Control
                    type="text"
                    value={assetForm.model}
                    onChange={(e) => setAssetForm({...assetForm, model: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Serial Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({...assetForm, serialNumber: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={assetForm.purchaseDate}
                    onChange={(e) => setAssetForm({...assetForm, purchaseDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add Asset</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Assets;