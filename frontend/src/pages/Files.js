import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Table,
  Badge,
  Nav,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';

const Files = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fileForm, setFileForm] = useState({
    type: "ORGANIZATION",
    category: "",
    description: "",
    isPublic: true,
    targetUserId: "",
    requiresAcknowledgment: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState("organization");
  const [showAckModal, setShowAckModal] = useState(false);
  const [ackComments, setAckComments] = useState("");
  const [selectedFileForAck, setSelectedFileForAck] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedFileForVerify, setSelectedFileForVerify] = useState(null);
  const [verifyForm, setVerifyForm] = useState({
    verificationStatus: 'VERIFIED'
  });

  useEffect(() => {
    fetchFiles();
    if (["HR", "ADMIN"].includes(user?.role)) {
      fetchEmployees();
    }
  }, [user?.role]);

  const fetchFiles = async () => {
    try {
      const response = await api.get("/api/files");
      setFiles(response.data);
      
      // Check if employee's documents are locked
      if (user?.role === 'EMPLOYEE') {
        const myDocs = response.data.filter(f => 
          f.type === 'EMPLOYEE' && 
          f.targetUserId === user.id && 
          f.uploadedBy._id === user.id
        );
        setIsLocked(myDocs.some(doc => doc.isLocked));
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Error fetching files");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/api/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      Object.keys(fileForm).forEach((key) => {
        if (fileForm[key]) {
          formData.append(key, fileForm[key]);
        }
      });

      await api.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowModal(false);
      setFileForm({
        type: "ORGANIZATION",
        category: "",
        description: "",
        isPublic: true,
        targetUserId: "",
        requiresAcknowledgment: false,
      });
      setSelectedFile(null);
      fetchFiles();
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    const result = await Swal.fire({
      title: 'Delete File?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/files/${fileId}`);
        fetchFiles();
        toast.success("File deleted successfully");
      } catch (error) {
        toast.error(error.response?.data?.message || "Error deleting file");
      }
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await api.get(`/api/files/download/${fileId}`);
      const { downloadUrl } = response.data;

      // Create a temporary link and click it to download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Error downloading file");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleAcknowledge = async (file) => {
    setSelectedFileForAck(file);
    setShowAckModal(true);
  };

  const submitAcknowledgment = async () => {
    try {
      await api.post(`/api/files/${selectedFileForAck._id}/acknowledge`, {
        comments: ackComments,
      });
      setShowAckModal(false);
      setAckComments("");
      setSelectedFileForAck(null);
      fetchFiles();
      toast.success("Document acknowledged successfully");
    } catch (error) {
      toast.error("Error acknowledging document");
    }
  };

  const handleSubmitDocuments = async () => {
    const result = await Swal.fire({
      title: 'Submit Documents?',
      text: 'Once submitted, you cannot upload/edit/delete. Continue?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, submit!'
    });

    if (result.isConfirmed) {
      try {
        await api.post('/api/files/submit-my-documents');
        fetchFiles();
        toast.success('Documents submitted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error submitting documents');
      }
    }
  };

  const handleUnlockDocuments = async (employeeId) => {
    const result = await Swal.fire({
      title: 'Unlock Documents?',
      text: "This will allow the employee to edit their documents again.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, unlock!'
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/api/files/unlock/${employeeId}`);
        fetchFiles();
        toast.success('Documents unlocked');
      } catch (error) {
        toast.error('Error unlocking documents');
      }
    }
  };

  const handleOpenModal = () => {
    if (user?.role === 'EMPLOYEE') {
      setFileForm({ 
        type: 'EMPLOYEE', 
        category: '', 
        description: '', 
        isPublic: false, 
        targetUserId: user.id, 
        requiresAcknowledgment: false 
      });
    } else {
      // Reset form for HR/Admin
      setFileForm({
        type: 'ORGANIZATION',
        category: '',
        description: '',
        isPublic: true,
        targetUserId: '',
        requiresAcknowledgment: false,
      });
    }
    setShowModal(true);
  };

  const getVerificationBadge = (status) => {
    const badges = {
      UNVERIFIED: <Badge bg="secondary"><i className="fas fa-question me-1"></i>Unverified</Badge>,
      VERIFIED: <Badge bg="success"><i className="fas fa-check-circle me-1"></i>Verified</Badge>,
      EXPIRED: <Badge bg="warning"><i className="fas fa-exclamation-triangle me-1"></i>Expired</Badge>,
      INVALID: <Badge bg="danger"><i className="fas fa-times-circle me-1"></i>Invalid</Badge>
    };
    return badges[status] || badges.UNVERIFIED;
  };

  const handleVerifyDocument = async (file) => {
    setSelectedFileForVerify(file);
    setVerifyForm({
      verificationStatus: file.verificationStatus || 'VERIFIED'
    });
    setShowVerifyModal(true);
  };

  const submitVerification = async () => {
    try {
      await api.put(`/api/files/${selectedFileForVerify._id}/verify`, verifyForm);
      setShowVerifyModal(false);
      setSelectedFileForVerify(null);
      setVerifyForm({ verificationStatus: 'VERIFIED' });
      fetchFiles();
      toast.success('Document verification updated');
    } catch (error) {
      toast.error('Error updating verification');
    }
  };

  const organizationFiles = files.filter(
    (file) => file.type === "ORGANIZATION"
  );
  const employeeFiles = files.filter((file) => file.type === "EMPLOYEE");

  // Filter files based on search term (for HR/Admin)
  const filterFiles = (fileList) => {
    if (!searchTerm || user?.role === 'EMPLOYEE') return fileList;
    
    const term = searchTerm.toLowerCase();
    return fileList.filter(file => {
      const uploaderName = `${file.uploadedBy?.firstName || ''} ${file.uploadedBy?.lastName || ''}`.toLowerCase();
      const targetEmployee = employees.find(emp => emp._id === file.targetUserId);
      const targetName = targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}`.toLowerCase() : '';
      
      return uploaderName.includes(term) || targetName.includes(term) || file.name.toLowerCase().includes(term);
    });
  };

  const filteredOrgFiles = filterFiles(organizationFiles);
  const filteredEmpFiles = filterFiles(employeeFiles);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-muted">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="page-header d-flex align-items-center justify-content-between">
        <div>
          <h1 className="page-title mb-1">
            <i className="fas fa-folder-open me-3 text-primary"></i>
            Files & Documents
          </h1>
          <p className="text-muted mb-0">
            Manage organization and employee files
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {user?.role === 'EMPLOYEE' && !isLocked && (
            <>
              <Button variant="primary" onClick={handleOpenModal}>
                <i className="fas fa-upload me-2"></i>Upload My Documents
              </Button>
              {employeeFiles.filter(f => f.uploadedBy._id === user.id).length > 0 && (
                <Button variant="success" onClick={handleSubmitDocuments}>
                  <i className="fas fa-lock me-2"></i>Submit Documents
                </Button>
              )}
            </>
          )}
          {user?.role === 'EMPLOYEE' && isLocked && (
            <div className="alert alert-info mb-0 py-2 px-3">
              <i className="fas fa-lock me-2"></i>
              Documents submitted. Contact HR to make changes.
            </div>
          )}
          {['HR', 'ADMIN'].includes(user?.role) && (
            <Button variant="primary" onClick={handleOpenModal}>
              <i className="fas fa-upload me-2"></i>Upload File
            </Button>
          )}
        </div>
      </div>

      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link
            active={activeTab === "organization"}
            onClick={() => setActiveTab("organization")}
          >
            <i className="fas fa-building me-2"></i>
            Organization Documents ({organizationFiles.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === "employee"}
            onClick={() => setActiveTab("employee")}
          >
            <i className="fas fa-user me-2"></i>
            Employee Documents ({employeeFiles.length})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Row>
        <Col>
          <Card className="modern-table-wrapper">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i
                    className={`fas fa-${
                      activeTab === "organization" ? "building" : "user"
                    } me-2`}
                  ></i>
                  {activeTab === "organization" ? "Organization" : "Employee"}{" "}
                  Documents
                </h5>
                {['HR', 'ADMIN'].includes(user?.role) && (
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="text"
                      placeholder="Search by name or employee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '300px' }}
                    />
                    {searchTerm && (
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setSearchTerm('')}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {(activeTab === "organization"
                ? filteredOrgFiles
                : filteredEmpFiles
              ).length > 0 ? (
                <div className="table-responsive">
                  <Table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Uploaded By</th>
                        {activeTab === "employee" && ['HR', 'ADMIN'].includes(user?.role) && (
                          <th>Target Employee</th>
                        )}
                        <th>Date</th>
                        <th>Verification</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === "organization"
                        ? filteredOrgFiles
                        : filteredEmpFiles
                      ).map((file) => (
                        <tr key={file._id}>
                          <td>
                            <div>
                              <div className="fw-semibold">
                                <i className="fas fa-file me-2 text-primary"></i>
                                {file.name}
                              </div>
                              {file.description && (
                                <small className="text-muted">
                                  {file.description}
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="text-muted">
                              {file.category || "N/A"}
                            </span>
                          </td>
                          <td>
                            <span className="fw-semibold">
                              {formatFileSize(file.size)}
                            </span>
                          </td>
                          <td>
                            <div>
                              <div className="fw-semibold">
                                {file.uploadedBy?.firstName}{" "}
                                {file.uploadedBy?.lastName}
                              </div>
                              <small className="text-muted">
                                {file.uploadedBy?.email}
                              </small>
                            </div>
                          </td>
                          {activeTab === "employee" && ['HR', 'ADMIN'].includes(user?.role) && (
                            <td>
                              <div className="fw-semibold">
                                {employees.find(emp => emp._id === file.targetUserId)?.firstName}{" "}
                                {employees.find(emp => emp._id === file.targetUserId)?.lastName}
                              </div>
                            </td>
                          )}
                          <td>
                            <span className="text-muted">
                              {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <div>
                              {getVerificationBadge(file.verificationStatus)}
                              {file.verifiedBy && (
                                <div className="mt-1">
                                  <small className="text-muted">
                                    <i className="fas fa-user-check me-1"></i>
                                    {file.verifiedBy.firstName} {file.verifiedBy.lastName}
                                  </small>
                                </div>
                              )}
                              {file.verificationNotes && (
                                <div className="mt-1">
                                  <small className="text-muted fst-italic">
                                    <i className="fas fa-sticky-note me-1"></i>
                                    {file.verificationNotes}
                                  </small>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() =>
                                  handleDownload(
                                    file._id,
                                    file.originalName || file.name
                                  )
                                }
                              >
                                <i className="fas fa-download me-1"></i>
                                Download
                              </Button>
                              {['HR', 'ADMIN'].includes(user?.role) && (
                                <>
                                  {file.type === 'EMPLOYEE' && (
                                    <Button
                                      size="sm"
                                      variant="outline-success"
                                      onClick={() => handleVerifyDocument(file)}
                                      title="Verify Document"
                                    >
                                      <i className="fas fa-check-circle me-1"></i>
                                      Verify
                                    </Button>
                                  )}
                                  {file.isLocked && file.type === 'EMPLOYEE' && (
                                    <Button
                                      size="sm"
                                      variant="outline-secondary"
                                      onClick={() => handleUnlockDocuments(file.targetUserId)}
                                      title="Unlock for employee to edit"
                                    >
                                      <i className="fas fa-lock-open me-1"></i>
                                      Unlock
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleDeleteFile(file._id)}
                                  >
                                    <i className="fas fa-trash me-1"></i>
                                    Delete
                                  </Button>
                                </>
                              )}
                              {user?.role === 'EMPLOYEE' && 
                                !file.isLocked && 
                                file.uploadedBy._id === user.id && (
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleDeleteFile(file._id)}
                                >
                                  <i className="fas fa-trash me-1"></i>
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="table-empty">
                  <i className="fas fa-folder-open"></i>
                  <p className="mb-0">No {activeTab} documents found</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upload Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload File</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFileUpload}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>File</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={fileForm.type}
                    onChange={(e) =>
                      setFileForm({ ...fileForm, type: e.target.value })
                    }
                    disabled={user?.role === 'EMPLOYEE'}
                  >
                    <option value="ORGANIZATION">Organization File</option>
                    <option value="EMPLOYEE">Employee File</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    value={fileForm.category}
                    onChange={(e) =>
                      setFileForm({ ...fileForm, category: e.target.value })
                    }
                    placeholder="e.g., Policy, Handbook, Form"
                  />
                </Form.Group>
              </Col>
              {fileForm.type === "EMPLOYEE" && user?.role !== 'EMPLOYEE' && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Target Employee</Form.Label>
                    <Form.Select
                      value={fileForm.targetUserId}
                      onChange={(e) =>
                        setFileForm({
                          ...fileForm,
                          targetUserId: e.target.value,
                        })
                      }
                      required={fileForm.type === "EMPLOYEE"}
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} - {emp.department}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={fileForm.description}
                onChange={(e) =>
                  setFileForm({ ...fileForm, description: e.target.value })
                }
                placeholder="Brief description of the file"
              />
            </Form.Group>

            {fileForm.type === "ORGANIZATION" && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Make public to all employees"
                  checked={fileForm.isPublic}
                  onChange={(e) =>
                    setFileForm({ ...fileForm, isPublic: e.target.checked })
                  }
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Requires employee acknowledgment"
                checked={fileForm.requiresAcknowledgment}
                onChange={(e) =>
                  setFileForm({
                    ...fileForm,
                    requiresAcknowledgment: e.target.checked,
                  })
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Acknowledgment Modal */}
      <Modal show={showAckModal} onHide={() => setShowAckModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Acknowledge Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are about to acknowledge that you have read and understood:</p>
          <div className="bg-light p-3 rounded mb-3">
            <strong>{selectedFileForAck?.name}</strong>
            {selectedFileForAck?.description && (
              <div className="text-muted mt-1">
                {selectedFileForAck.description}
              </div>
            )}
          </div>
          <Form.Group>
            <Form.Label>Comments (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={ackComments}
              onChange={(e) => setAckComments(e.target.value)}
              placeholder="Any comments or questions about this document..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAckModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={submitAcknowledgment}>
            <i className="fas fa-check me-2"></i>
            Acknowledge Document
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Verification Modal */}
      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Verify Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="bg-light p-3 rounded mb-3">
            <strong>{selectedFileForVerify?.name}</strong>
            {selectedFileForVerify?.description && (
              <div className="text-muted mt-1">
                {selectedFileForVerify.description}
              </div>
            )}
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>Verification Status</Form.Label>
            <Form.Select
              value={verifyForm.verificationStatus}
              onChange={(e) => setVerifyForm({ verificationStatus: e.target.value })}
            >
              <option value="UNVERIFIED">Unverified</option>
              <option value="VERIFIED">Verified</option>
              <option value="EXPIRED">Expired</option>
              <option value="INVALID">Invalid</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVerifyModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitVerification}>
            <i className="fas fa-certificate me-2"></i>
            Update Verification
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Files;
