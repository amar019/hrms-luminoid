import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Table, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'TRAVEL',
    amount: '',
    expenseDate: '',
    description: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/api/expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', expenseForm.title);
      formData.append('category', expenseForm.category);
      formData.append('amount', expenseForm.amount);
      formData.append('expenseDate', expenseForm.expenseDate);
      formData.append('description', expenseForm.description);
      
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      await api.post('/api/expenses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setShowModal(false);
      setExpenseForm({ title: '', category: 'TRAVEL', amount: '', expenseDate: '', description: '' });
      setReceiptFile(null);
      setReceiptPreview(null);
      fetchExpenses();
      toast.success('Expense submitted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting expense');
    }
  };

  const handleApproveReject = async (id, status, rejectionReason = '') => {
    try {
      await api.put(`/api/expenses/${id}/approve-reject`, { status, rejectionReason });
      fetchExpenses();
      toast.success(`Expense ${status.toLowerCase()} successfully`);
    } catch (error) {
      toast.error('Error updating expense');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: 'secondary',
      SUBMITTED: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      REIMBURSED: 'info'
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
            <i className="fas fa-receipt me-3 text-primary"></i>
            Expense Management
          </h1>
          <p className="text-muted">Submit and track your expense claims</p>
        </div>
        {user?.role === 'EMPLOYEE' && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus me-2"></i>New Expense
          </Button>
        )}
      </div>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Expense Claims</h5>
            </Card.Header>
            <Card.Body>
              {expenses.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      {['MANAGER', 'HR', 'ADMIN'].includes(user?.role) && <th>Employee</th>}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(expense => (
                      <tr key={expense._id}>
                        <td>
                          <strong>{expense.title}</strong>
                          {expense.description && (
                            <><br/><small className="text-muted">{expense.description}</small></>
                          )}
                        </td>
                        <td>{expense.category}</td>
                        <td>₹{expense.amount}</td>
                        <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                        <td>{getStatusBadge(expense.status)}</td>
                        {['MANAGER', 'HR', 'ADMIN'].includes(user?.role) && (
                          <td>{expense.employeeId?.firstName} {expense.employeeId?.lastName}</td>
                        )}
                        <td>
                          <div className="d-flex gap-2 align-items-center">
                            {expense.receipt?.filePath && (
                              <Button
                                size="sm"
                                variant="outline-info"
                                onClick={() => {
                                  const fileUrl = `${API_BASE_URL}/${expense.receipt.filePath}`;
                                  window.open(fileUrl, '_blank');
                                }}
                                title="View Receipt"
                              >
                                <i className="fas fa-file-invoice me-1"></i>
                                Receipt
                              </Button>
                            )}
                            {['MANAGER', 'HR', 'ADMIN'].includes(user?.role) && expense.status === 'SUBMITTED' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleApproveReject(expense._id, 'APPROVED')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => {
                                    const reason = prompt('Rejection reason:');
                                    if (reason) handleApproveReject(expense._id, 'REJECTED', reason);
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-receipt text-muted fs-1 mb-3"></i>
                  <p className="text-muted mb-0">No expenses found</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* New Expense Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setReceiptFile(null);
        setReceiptPreview(null);
      }} size="lg" centered>
        <Modal.Header closeButton style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderBottom: 'none'
        }}>
          <Modal.Title className="d-flex align-items-center">
            <i className="fas fa-receipt me-2"></i>
            Submit New Expense
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: '2rem' }}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <i className="fas fa-heading me-2 text-primary"></i>
                    Expense Title
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Business trip to New York"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                    required
                    style={{ 
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      padding: '0.75rem'
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <i className="fas fa-tags me-2 text-success"></i>
                    Category
                  </Form.Label>
                  <Form.Select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                    style={{ 
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      padding: '0.75rem'
                    }}
                  >
                    <option value="TRAVEL">✈️ Travel</option>
                    <option value="MEALS">🍽️ Meals</option>
                    <option value="ACCOMMODATION">🏨 Accommodation</option>
                    <option value="TRANSPORT">🚗 Transport</option>
                    <option value="OFFICE_SUPPLIES">📦 Office Supplies</option>
                    <option value="TRAINING">🎓 Training</option>
                    <option value="OTHER">📋 Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <i className="fas fa-rupee-sign me-2 text-warning"></i>
                    Amount
                  </Form.Label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ 
                      background: '#f8f9fa',
                      border: '2px solid #e9ecef',
                      borderRight: 'none',
                      borderRadius: '8px 0 0 8px'
                    }}>₹</span>
                    <Form.Control
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      required
                      style={{ 
                        border: '2px solid #e9ecef',
                        borderLeft: 'none',
                        borderRadius: '0 8px 8px 0',
                        padding: '0.75rem'
                      }}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <i className="fas fa-calendar-alt me-2 text-info"></i>
                    Expense Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({...expenseForm, expenseDate: e.target.value})}
                    required
                    style={{ 
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      padding: '0.75rem'
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <i className="fas fa-align-left me-2 text-secondary"></i>
                    Description
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Provide additional details about this expense..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    style={{ 
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      resize: 'vertical'
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <i className="fas fa-file-invoice me-2 text-danger"></i>
                    Receipt / Bill
                    <small className="text-muted ms-2">(Optional - JPEG, PNG, or PDF, max 5MB)</small>
                  </Form.Label>
                  <div 
                    className="border rounded p-4 text-center"
                    style={{
                      border: '2px dashed #dee2e6',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => document.getElementById('receipt-upload').click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.backgroundColor = '#f0f4ff';
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.style.borderColor = '#dee2e6';
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.style.borderColor = '#dee2e6';
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        handleFileChange({ target: { files: [file] } });
                      }
                    }}
                  >
                    {receiptPreview ? (
                      <div>
                        <img 
                          src={receiptPreview} 
                          alt="Receipt preview" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                          }}
                        />
                        <div>
                          <p className="mb-2">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            {receiptFile.name}
                          </p>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceiptFile(null);
                              setReceiptPreview(null);
                            }}
                          >
                            <i className="fas fa-times me-1"></i>Remove
                          </Button>
                        </div>
                      </div>
                    ) : receiptFile ? (
                      <div>
                        <i className="fas fa-file-pdf text-danger" style={{ fontSize: '3rem' }}></i>
                        <p className="mt-2 mb-2">{receiptFile.name}</p>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptFile(null);
                            setReceiptPreview(null);
                          }}
                        >
                          <i className="fas fa-times me-1"></i>Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <i className="fas fa-cloud-upload-alt text-primary" style={{ fontSize: '3rem' }}></i>
                        <p className="mt-3 mb-2">
                          <strong>Click to upload</strong> or drag and drop
                        </p>
                        <p className="text-muted small mb-0">
                          JPEG, PNG, or PDF (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                  <Form.Control
                    type="file"
                    id="receipt-upload"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ 
            borderTop: '1px solid #e9ecef',
            padding: '1.5rem 2rem'
          }}>
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setShowModal(false);
                setReceiptFile(null);
                setReceiptPreview(null);
              }}
              style={{ borderRadius: '8px', padding: '0.5rem 1.5rem' }}
            >
              <i className="fas fa-times me-2"></i>Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              style={{ 
                borderRadius: '8px', 
                padding: '0.5rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              <i className="fas fa-paper-plane me-2"></i>Submit Expense
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Expenses;