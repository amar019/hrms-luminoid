import React, { useState } from 'react';
import { Row, Col, Card, Button, Modal, Form, Alert, Table, Badge, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const EmployeeImport = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                           'application/vnd.ms-excel', 
                           'text/csv'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a valid Excel (.xlsx, .xls) or CSV file');
        e.target.value = '';
      }
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/api/employee-import/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Error downloading template');
    }
  };

  const exportEmployees = async () => {
    try {
      const response = await api.get('/api/employee-import/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Employee data exported successfully');
    } catch (error) {
      toast.error('Error exporting employee data');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/api/employee-import/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResults(response.data.results);
      setShowResults(true);
      setShowModal(false);
      setSelectedFile(null);
      
      if (response.data.results.success.length > 0) {
        toast.success(`Successfully imported ${response.data.results.success.length} employees`);
      }
      if (response.data.results.errors.length > 0) {
        toast.warning(`${response.data.results.errors.length} rows had errors`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error importing employees');
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setShowModal(false);
    setImportResults(null);
    setShowResults(false);
  };

  if (!['ADMIN', 'HR'].includes(user?.role)) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-lock fa-3x text-muted mb-3"></i>
        <h4>Access Denied</h4>
        <p className="text-muted">You don't have permission to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="page-header d-flex align-items-center justify-content-between">
        <div>
          <h1 className="page-title mb-1">
            <i className="fas fa-file-import me-3 text-primary"></i>
            Employee Import
          </h1>
          <p className="text-muted mb-0">Bulk import employees from Excel or CSV files</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-success" onClick={exportEmployees}>
            <i className="fas fa-download me-2"></i>Export Employees
          </Button>
          <Button variant="outline-primary" onClick={downloadTemplate}>
            <i className="fas fa-download me-2"></i>Download Template
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-upload me-2"></i>Import Employees
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Import Instructions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Export Current Data:</h6>
                <ul className="mb-3">
                  <li>Download current employee data as Excel file</li>
                  <li>Includes all employee information and profiles</li>
                  <li>Can be used as backup or for external reporting</li>
                </ul>
              </div>

              <div className="mb-3">
                <h6>Supported File Formats:</h6>
                <ul className="mb-3">
                  <li>Excel files (.xlsx, .xls)</li>
                  <li>CSV files (.csv)</li>
                </ul>
              </div>

              <div className="mb-3">
                <h6>Required Fields:</h6>
                <ul className="mb-3">
                  <li><strong>email</strong> - Employee email address (must be unique)</li>
                  <li><strong>firstName</strong> - Employee first name</li>
                  <li><strong>lastName</strong> - Employee last name</li>
                </ul>
              </div>

              <div className="mb-3">
                <h6>Optional Fields:</h6>
                <ul className="mb-0">
                  <li><strong>role</strong> - EMPLOYEE, MANAGER, HR, ADMIN (default: EMPLOYEE)</li>
                  <li><strong>department</strong> - Employee department</li>
                  <li><strong>designation</strong> - Job title</li>
                  <li><strong>employeeId</strong> - Unique employee ID</li>
                  <li><strong>workLocation</strong> - Work location</li>
                  <li><strong>employmentType</strong> - FULL_TIME, PART_TIME, CONTRACT, INTERN</li>
                  <li><strong>dateOfBirth</strong> - Birth date (YYYY-MM-DD format)</li>
                  <li><strong>joinDate</strong> - Joining date (YYYY-MM-DD format)</li>
                  <li><strong>phone</strong> - Phone number</li>
                  <li><strong>address</strong> - Address</li>
                  <li><strong>managerEmail</strong> - Manager's email address</li>
                  <li><strong>emergencyContactName</strong> - Emergency contact name</li>
                  <li><strong>emergencyContactPhone</strong> - Emergency contact phone</li>
                  <li><strong>emergencyContactRelation</strong> - Relationship</li>
                </ul>
              </div>

              <Alert variant="info" className="mt-3">
                <i className="fas fa-lightbulb me-2"></i>
                <strong>Tip:</strong> Download the template file to see the exact format and sample data.
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Quick Stats
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="mb-3">
                  <i className="fas fa-users fa-2x text-primary mb-2"></i>
                  <h4 className="mb-1">Bulk Import</h4>
                  <p className="text-muted mb-0">Import multiple employees at once</p>
                </div>
                <div className="d-grid">
                  <Button variant="success" onClick={() => setShowModal(true)}>
                    <i className="fas fa-plus me-2"></i>Start Import
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Import Modal */}
      <Modal show={showModal} onHide={resetForm} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Import Employees</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleImport}>
          <Modal.Body>
            <div className="mb-4">
              <Form.Group>
                <Form.Label>Select File</Form.Label>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  required
                />
                <Form.Text className="text-muted">
                  Supported formats: Excel (.xlsx, .xls) and CSV (.csv) files
                </Form.Text>
              </Form.Group>
            </div>

            {selectedFile && (
              <Alert variant="success">
                <i className="fas fa-file me-2"></i>
                Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Alert>
            )}

            <Alert variant="warning">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Important:</strong> Make sure your file follows the template format. 
              Employees with existing email addresses will be skipped.
            </Alert>

            {importing && (
              <div className="text-center">
                <ProgressBar animated now={100} className="mb-3" />
                <p className="text-muted">Processing import... Please wait.</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={resetForm} disabled={importing}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!selectedFile || importing}>
              {importing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Importing...
                </>
              ) : (
                <>
                  <i className="fas fa-upload me-2"></i>
                  Import Employees
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Results Modal */}
      <Modal show={showResults} onHide={() => setShowResults(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Import Results</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {importResults && (
            <>
              <div className="mb-4">
                <Row>
                  <Col md={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <h4 className="text-primary mb-1">{importResults.total}</h4>
                      <small className="text-muted">Total Rows</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                      <h4 className="text-success mb-1">{importResults.success.length}</h4>
                      <small className="text-muted">Successful</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                      <h4 className="text-danger mb-1">{importResults.errors.length}</h4>
                      <small className="text-muted">Errors</small>
                    </div>
                  </Col>
                </Row>
              </div>

              {importResults.success.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-success">
                    <i className="fas fa-check-circle me-2"></i>
                    Successfully Imported ({importResults.success.length})
                  </h6>
                  <div className="table-responsive">
                    <Table size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Employee ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.success.map((item, index) => (
                          <tr key={index}>
                            <td>{item.row}</td>
                            <td>{item.name}</td>
                            <td>{item.email}</td>
                            <td>{item.employeeId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

              {importResults.errors.length > 0 && (
                <div>
                  <h6 className="text-danger">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    Errors ({importResults.errors.length})
                  </h6>
                  <div className="table-responsive">
                    <Table size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Email</th>
                          <th>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.errors.map((item, index) => (
                          <tr key={index}>
                            <td>{item.row}</td>
                            <td>{item.email}</td>
                            <td className="text-danger">{item.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResults(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeImport;