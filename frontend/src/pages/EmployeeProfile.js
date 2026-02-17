import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Tab, Tabs, Image } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const EmployeeProfile = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    personalInfo: {
      phone: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      emergencyContact: { name: '', relationship: '', phone: '', email: '' },
      bloodGroup: '',
      maritalStatus: 'SINGLE'
    },
    professionalInfo: {
      employeeId: '',
      designation: '',
      workLocation: '',
      employmentType: 'FULL_TIME',
      skills: [],
      certifications: []
    },
    bankDetails: {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountType: 'SAVINGS'
    }
  });
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/employee-profiles/me');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to load profile';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/employee-profiles/me', profile);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Error updating profile');
    }
  };

  const handleDelete = async () => {
    if (!id || user?.role !== 'ADMIN') {
      toast.error('Only admins can delete profiles');
      return;
    }
    
    const result = await window.confirm(`Are you sure you want to delete this employee? This action cannot be undone!`);
    if (result) {
      try {
        await api.delete(`/api/users/${id}`);
        toast.success('Employee deleted successfully');
        window.history.back();
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error(error.response?.data?.message || 'Error deleting employee');
      }
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const response = await api.post('/api/employee-profiles/me/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProfile(prev => ({
        ...prev,
        userId: {
          ...prev.userId,
          profileImage: response.data.profileImage
        }
      }));
      
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    try {
      await api.delete('/api/employee-profiles/me/profile-image');
      setProfile(prev => ({
        ...prev,
        userId: {
          ...prev.userId,
          profileImage: null
        }
      }));
      toast.success('Profile image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(error.response?.data?.message || 'Error deleting image');
    }
  };

  const updateNestedField = (section, field, value) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
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
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-user-circle me-3 text-primary"></i>
          {id ? 'Employee Profile' : 'My Profile'}
        </h1>
        <p className="text-muted">Manage your personal and professional information</p>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={12} className="text-center mb-4">
                <div className="profile-image-section">
                  <div className="position-relative d-inline-block">
                    {profile.userId?.profileImage ? (
                      <Image
                        src={profile.userId.profileImage}
                        alt="Profile"
                        roundedCircle
                        width={150}
                        height={150}
                        className="border border-4 border-white shadow-lg"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="d-flex align-items-center justify-content-center border border-4 border-white shadow-lg rounded-circle"
                        style={{ 
                          width: '150px', 
                          height: '150px', 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                      >
                        <i className="fas fa-user fa-4x text-white"></i>
                      </div>
                    )}
                    <div className="position-absolute" style={{ bottom: '8px', right: '8px' }}>
                      <Button
                        variant="primary"
                        className="rounded-circle shadow-sm p-2"
                        style={{ width: '36px', height: '36px' }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        title="Upload photo"
                      >
                        {uploadingImage ? (
                          <div className="spinner-border" style={{ width: '14px', height: '14px' }} role="status"></div>
                        ) : (
                          <i className="fas fa-camera" style={{ fontSize: '12px', color: 'white' }}></i>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h5 className="mb-1">{profile.userId?.firstName} {profile.userId?.lastName}</h5>
                    <p className="text-muted mb-0">{profile.userId?.designation || 'Employee'}</p>
                    {profile.userId?.profileImage && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-0 mt-1"
                        onClick={handleImageDelete}
                      >
                        <i className="fas fa-trash me-1"></i>
                        Remove Photo
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>First Name</Form.Label>
                  <Form.Control value={profile.userId?.firstName || ''} onChange={(e) => setProfile(prev => ({ ...prev, userId: { ...prev.userId, firstName: e.target.value } }))} disabled={!!id && user?.role !== 'ADMIN'} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control value={profile.userId?.lastName || ''} onChange={(e) => setProfile(prev => ({ ...prev, userId: { ...prev.userId, lastName: e.target.value } }))} disabled={!!id && user?.role !== 'ADMIN'} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={profile.userId?.email || ''} onChange={(e) => setProfile(prev => ({ ...prev, userId: { ...prev.userId, email: e.target.value } }))} disabled={!!id && user?.role !== 'ADMIN'} />
                </Form.Group>
              </Col>
              <Col md={4} className="mt-2">
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Control value={profile.professionalInfo?.department || profile.userId?.department || ''} onChange={(e) => setProfile(prev => ({ ...prev, professionalInfo: { ...prev.professionalInfo, department: e.target.value }, userId: { ...prev.userId, department: e.target.value } }))} disabled={!!id && user?.role !== 'ADMIN'} />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        <Tabs defaultActiveKey="personal" className="mb-4">
          <Tab eventKey="personal" title="Personal Info">
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        value={profile.personalInfo?.phone || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'phone', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Blood Group</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.personalInfo?.bloodGroup || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'bloodGroup', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Marital Status</Form.Label>
                      <Form.Select
                        value={profile.personalInfo?.maritalStatus || 'SINGLE'}
                        onChange={(e) => updateNestedField('personalInfo', 'maritalStatus', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      >
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date of Birth</Form.Label>
                      {user?.role === 'ADMIN' || user?.role === 'HR' ? (
                        <Form.Control
                          type="date"
                          value={profile.userId?.dateOfBirth && profile.userId.dateOfBirth !== '1970-01-01T00:00:00.000Z' ? 
                            new Date(profile.userId.dateOfBirth).toISOString().split('T')[0] : ''}
                          onChange={(e) => setProfile(prev => ({ 
                            ...prev, 
                            userId: { ...prev.userId, dateOfBirth: e.target.value || null } 
                          }))}
                          disabled={!!id && user?.role !== 'ADMIN' && user?.role !== 'HR'}
                        />
                      ) : (
                        <Form.Control
                          type="text"
                          value={profile.userId?.dateOfBirth && profile.userId.dateOfBirth !== '1970-01-01T00:00:00.000Z' ? new Date(profile.userId.dateOfBirth).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : ''}
                          readOnly
                          disabled
                          style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                          placeholder="Not set"
                        />
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                <h6 className="mt-4 mb-3">Address</h6>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Street</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.personalInfo?.address?.street || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'address', {
                          ...profile.personalInfo?.address,
                          street: e.target.value
                        })}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.personalInfo?.address?.city || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'address', {
                          ...profile.personalInfo?.address,
                          city: e.target.value
                        })}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.personalInfo?.address?.state || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'address', {
                          ...profile.personalInfo?.address,
                          state: e.target.value
                        })}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
          <Tab eventKey="professional" title="Professional Info">
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Employee ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.professionalInfo?.employeeId || ''}
                        onChange={(e) => updateNestedField('professionalInfo', 'employeeId', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Designation</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.professionalInfo?.designation || ''}
                        onChange={(e) => updateNestedField('professionalInfo', 'designation', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Work Location</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.professionalInfo?.workLocation || ''}
                        onChange={(e) => updateNestedField('professionalInfo', 'workLocation', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Employment Type</Form.Label>
                      <Form.Select
                        value={profile.professionalInfo?.employmentType || 'FULL_TIME'}
                        onChange={(e) => updateNestedField('professionalInfo', 'employmentType', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERN">Intern</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fas fa-calendar-alt me-2"></i>
                        Date of Joining
                      </Form.Label>
                      {user?.role === 'ADMIN' || user?.role === 'HR' ? (
                        <Form.Control
                          type="date"
                          value={profile.userId?.joinDate && profile.userId.joinDate !== '1970-01-01T00:00:00.000Z' ? 
                            new Date(profile.userId.joinDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setProfile(prev => ({ 
                            ...prev, 
                            userId: { ...prev.userId, joinDate: e.target.value || null } 
                          }))}
                        />
                      ) : (
                        <Form.Control
                          type="text"
                          value={profile.userId?.joinDate && profile.userId.joinDate !== '1970-01-01T00:00:00.000Z' ? new Date(profile.userId.joinDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : ''}
                          readOnly
                          disabled
                          style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                          placeholder="Not set"
                        />
                      )}
                      <Form.Text className="text-muted">
                        This is your official joining date with the company
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
          <Tab eventKey="bank" title="Bank Details">
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Account Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.bankDetails?.accountNumber || ''}
                        onChange={(e) => updateNestedField('bankDetails', 'accountNumber', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bank Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.bankDetails?.bankName || ''}
                        onChange={(e) => updateNestedField('bankDetails', 'bankName', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>IFSC Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.bankDetails?.ifscCode || ''}
                        onChange={(e) => updateNestedField('bankDetails', 'ifscCode', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Account Type</Form.Label>
                      <Form.Select
                        value={profile.bankDetails?.accountType || 'SAVINGS'}
                        onChange={(e) => updateNestedField('bankDetails', 'accountType', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      >
                        <option value="SAVINGS">Savings</option>
                        <option value="CURRENT">Current</option>
                        <option value="SALARY">Salary</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        <div className="text-end">
          <Button variant="primary" type="submit" size="lg" disabled={!!id && user?.role !== 'ADMIN'}>
            <i className="fas fa-save me-2"></i>Save Profile
          </Button>
          {id && user?.role === 'ADMIN' && (
            <Button variant="danger" size="lg" className="ms-2" onClick={handleDelete}>
              <i className="fas fa-trash me-2"></i>Delete Employee
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
};

export default EmployeeProfile;