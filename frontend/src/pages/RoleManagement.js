import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import api from '../utils/api';
import { toast } from 'react-toastify';
import PermissionGuard from '../components/PermissionGuard';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    permissions: [],
    color: '#6366f1'
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/permissions/roles');
      setRoles(response.data);
    } catch (error) {
      toast.error('Failed to fetch roles');
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/api/permissions/permissions');
      setPermissions(response.data);
    } catch (error) {
      toast.error('Failed to fetch permissions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/api/permissions/roles/${editingRole._id}`, formData);
        toast.success('Role updated successfully');
      } else {
        await api.post('/api/permissions/roles', formData);
        toast.success('Role created successfully');
      }
      setShowModal(false);
      fetchRoles();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await api.delete(`/api/permissions/roles/${roleId}`);
        toast.success('Role deleted successfully');
        fetchRoles();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      displayName: '',
      description: '',
      permissions: [],
      color: '#6366f1'
    });
    setEditingRole(null);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions.map(p => p._id),
      color: role.color || '#6366f1'
    });
    setShowModal(true);
  };

  const handlePermissionChange = (permissionId, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  return (
    <div className="fade-in-up">
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1 className="page-title">
            <i className="fas fa-shield-alt me-3 text-primary"></i>
            Role Management
          </h1>
          <p className="text-muted mb-0">Manage roles and permissions</p>
        </div>
        <PermissionGuard resource="roles" action="create">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus me-2"></i>
            Create Role
          </Button>
        </PermissionGuard>
      </div>

      <Card className="modern-card">
        <Card.Header>
          <i className="fas fa-users-cog me-2 text-primary"></i>
          System Roles
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded me-2"
                          style={{
                            width: '4px',
                            height: '30px',
                            backgroundColor: role.color
                          }}
                        ></div>
                        <div>
                          <div className="fw-semibold">{role.displayName}</div>
                          <small className="text-muted">{role.name}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">{role.description || 'No description'}</small>
                    </td>
                    <td>
                      <Badge bg="light" text="dark">
                        {role.permissions?.length || 0} permissions
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={role.isSystem ? 'warning' : 'success'}>
                        {role.isSystem ? 'System' : 'Custom'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <PermissionGuard resource="roles" action="update">
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => openEditModal(role)}
                            disabled={role.isSystem}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard resource="roles" action="delete">
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleDelete(role._id)}
                            disabled={role.isSystem}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Role Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRole ? 'Edit Role' : 'Create Role'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Display Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>

            <h6>Permissions</h6>
            {Object.entries(permissions).map(([category, perms]) => (
              <Card key={category} className="mb-3">
                <Card.Header className="py-2">
                  <small className="fw-bold text-muted">{category}</small>
                </Card.Header>
                <Card.Body className="py-2">
                  <Row>
                    {perms.map(perm => (
                      <Col md={6} key={perm._id} className="mb-2">
                        <Form.Check
                          type="checkbox"
                          id={perm._id}
                          label={
                            <div>
                              <div className="fw-semibold">{perm.name.replace(/_/g, ' ')}</div>
                              <small className="text-muted">{perm.description}</small>
                            </div>
                          }
                          checked={formData.permissions.includes(perm._id)}
                          onChange={(e) => handlePermissionChange(perm._id, e.target.checked)}
                        />
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingRole ? 'Update' : 'Create'} Role
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement;