import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Badge, ListGroup, Tab, Nav } from 'react-bootstrap';
import api from '../../utils/api';

import { useAuth } from '../../context/AuthContext';
import moment from 'moment';

export default function SubtaskDetailModal({ show, onHide, subtaskId, onSubtaskUpdated, parentTaskId, canEditAll = false }) {
  const { user } = useAuth();
  const [subtask, setSubtask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [parentSubtasks, setParentSubtasks] = useState([]);
  
  // Collaborative inputs
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Form states
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState('');

  const [activeTab, setActiveTab] = useState('comments');

  useEffect(() => {
    if (show && subtaskId) {
      fetchSubtaskDetails();
      fetchEmployees();
    }
  }, [show, subtaskId]);

  useEffect(() => {
    if (subtask && subtask.parentTask) {
      fetchParentSubtasks();
    }
  }, [subtask]);

  const fetchSubtaskDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/subtasks/${subtaskId}`);
      setSubtask(res.data);
      setTempDesc(res.data.description || '');
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load subtask details' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchParentSubtasks = async () => {
    const parentId = parentTaskId || (subtask && (subtask.parentTask?._id || subtask.parentTask));
    if (!parentId) return;
    try {
      // Fetch all subtasks of parent to populate dependency choices
      const res = await api.get(`/api/subtasks?parentTask=${parentId}`);
      // Exclude self from dependency choices
      setParentSubtasks(res.data.subtasks?.filter(s => s._id !== subtaskId) || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFieldChange = async (field, value) => {
    try {
      const res = await api.put(`/api/subtasks/${subtaskId}`, { [field]: value });
      setSubtask(res.data);
      Swal.fire({ icon: 'success', title: 'Success', text: `${field.charAt(0, timer: 2000, showConfirmButton: false }).toUpperCase() + field.slice(1)} updated`);
      if (onSubtaskUpdated) onSubtaskUpdated(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || 'Failed to update field' });
    }
  };

  const handleSaveDescription = async () => {
    try {
      const res = await api.put(`/api/subtasks/${subtaskId}`, { description: tempDesc });
      setSubtask(res.data);
      setIsEditingDesc(false);
      Swal.fire({ icon: 'success', title: 'Success', text: 'Description updated', timer: 2000, showConfirmButton: false });
      if (onSubtaskUpdated) onSubtaskUpdated(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update description' });
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim() || subtask.tags.includes(newTag.trim())) return;
    const updatedTags = [...subtask.tags, newTag.trim()];
    try {
      const res = await api.put(`/api/subtasks/${subtaskId}`, { tags: updatedTags });
      setSubtask(res.data);
      setNewTag('');
      Swal.fire({ icon: 'success', title: 'Success', text: 'Tag added', timer: 2000, showConfirmButton: false });
      if (onSubtaskUpdated) onSubtaskUpdated(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add tag' });
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const updatedTags = subtask.tags.filter(t => t !== tagToRemove);
    try {
      const res = await api.put(`/api/subtasks/${subtaskId}`, { tags: updatedTags });
      setSubtask(res.data);
      Swal.fire({ icon: 'success', title: 'Success', text: 'Tag removed', timer: 2000, showConfirmButton: false });
      if (onSubtaskUpdated) onSubtaskUpdated(res.data);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to remove tag' });
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/api/subtasks/${subtaskId}/comments`, { text: commentText });
      // Reload comments and log
      const detailRes = await api.get(`/api/subtasks/${subtaskId}`);
      setSubtask(detailRes.data);
      setCommentText('');
      Swal.fire({ icon: 'success', title: 'Success', text: 'Comment posted', timer: 2000, showConfirmButton: false });
      if (onSubtaskUpdated) onSubtaskUpdated(detailRes.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to post comment' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'EMPLOYEE'); // standard type in HRMS

    try {
      const uploadRes = await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fileData = uploadRes.data;

      // Link to subtask
      const res = await api.post(`/api/subtasks/${subtaskId}/attachments`, {
        name: fileData.originalName || file.name,
        url: fileData.s3Url
      });
      
      // Reload subtask details
      fetchSubtaskDetails();
      Swal.fire({ icon: 'success', title: 'Success', text: 'File attached successfully', timer: 2000, showConfirmButton: false });
      if (onSubtaskUpdated) onSubtaskUpdated(res.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to upload attachment' });
    } finally {
      setUploadingFile(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical': return { bg: 'danger', text: '#fff' };
      case 'High': return { bg: 'warning', text: '#333' };
      case 'Medium': return { bg: 'primary', text: '#fff' };
      default: return { bg: 'secondary', text: '#fff' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'primary';
      case 'Review': return 'info';
      case 'Blocked': return 'danger';
      default: return 'secondary';
    }
  };

  if (!show) return null;

  // Role permissions checks
  const isCreator = subtask && (subtask.assignedBy?._id === user?.id || subtask.assignedBy === user?.id);
  const isAssignee = subtask && (subtask.owner?._id === user?.id || subtask.owner === user?.id);
  const hasEditRights = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER' || isCreator || canEditAll;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="subtask-detail-modal">
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          {subtask && (
            <>
              <Badge bg="secondary" className="px-2.5 py-1.5" style={{ fontSize: '12.5px', fontWeight: 700 }}>
                {subtask.taskId}
              </Badge>
              <span style={{ fontSize: '17px', color: 'var(--tracker-text-subtle)', fontWeight: 600 }}>/ Subtask Details</span>
            </>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-2">
        {!subtask || loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted">Loading subtask details...</p>
          </div>
        ) : (
          <Row className="g-4">
            {/* Left side: Main details and collaboration */}
            <Col lg={8} className="d-flex flex-column" style={{ borderRight: '1px solid #E2E8F0', paddingRight: '24px' }}>
              <h2 className="fw-extrabold mb-3" style={{ fontSize: '22px', color: '#1E293B', letterSpacing: '-0.3px' }}>
                {subtask.title}
              </h2>

              {/* Description */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h5 className="fw-bold m-0" style={{ fontSize: '14px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <i className="fas fa-align-left me-2"></i>Description
                  </h5>
                  {!isEditingDesc && hasEditRights && (
                    <Button variant="link" size="sm" className="p-0 text-emerald fw-semibold" onClick={() => setIsEditingDesc(true)}>
                      <i className="fas fa-edit me-1"></i>Edit
                    </Button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={tempDesc}
                      onChange={(e) => setTempDesc(e.target.value)}
                      className="mb-2"
                      style={{ fontSize: '13.5px', borderRadius: '6px' }}
                    />
                    <div className="d-flex gap-2">
                      <Button variant="success" size="sm" onClick={handleSaveDescription}>
                        Save
                      </Button>
                      <Button variant="light" size="sm" onClick={() => { setTempDesc(subtask.description || ''); setIsEditingDesc(false); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-light rounded" style={{ fontSize: '14px', color: '#334155', minHeight: '60px', border: '1px solid #E2E8F0', whiteSpace: 'pre-wrap' }}>
                    {subtask.description || 'No description added. Click Edit to add details.'}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="mb-4">
                <h5 className="fw-bold mb-2" style={{ fontSize: '14px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-tags me-2"></i>Tags
                </h5>
                <div className="d-flex flex-wrap gap-1.5 align-items-center">
                  {subtask.tags?.map((t, idx) => (
                    <Badge key={idx} bg="light" className="text-secondary border px-2 py-1.5 rounded d-flex align-items-center gap-1.5">
                      {t}
                      {hasEditRights && (
                        <i className="fas fa-times-circle cursor-pointer text-muted-hover" onClick={() => handleRemoveTag(t)}></i>
                      )}
                    </Badge>
                  ))}
                  {hasEditRights && (
                    <Form onSubmit={handleAddTag} className="d-flex gap-1.5 align-items-center">
                      <Form.Control
                        size="sm"
                        type="text"
                        placeholder="+ Add Tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        style={{ width: '90px', height: '26px', fontSize: '11px', borderRadius: '4px' }}
                      />
                    </Form>
                  )}
                </div>
              </div>

              {/* Tabs Section for Comments & Activity */}
              <div className="mt-2 flex-grow-1">
                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                  <Nav.Item>
                    <Nav.Link eventKey="comments">
                      <i className="fas fa-comments me-2"></i>Comments ({subtask.comments?.length || 0})
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="attachments">
                      <i className="fas fa-paperclip me-2"></i>Attachments ({subtask.attachments?.length || 0})
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="history">
                      <i className="fas fa-history me-2"></i>Activity History
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                {activeTab === 'comments' && (
                  <div>
                    <ListGroup variant="flush" className="mb-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {subtask.comments?.map(c => (
                        <ListGroup.Item key={c._id} className="py-2 border-0 px-0 d-flex gap-2.5">
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white bg-indigo fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px', flexShrink: 0 }}>
                            {c.author?.firstName?.[0]}{c.author?.lastName?.[0]}
                          </div>
                          <div className="flex-grow-1 p-2 bg-light rounded" style={{ border: '1px solid #E2E8F0' }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                                {c.author?.firstName} {c.author?.lastName}
                              </span>
                              <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                                {moment(c.createdAt).fromNow()}
                              </span>
                            </div>
                            <p className="m-0" style={{ fontSize: '13px', color: '#334155' }}>
                              {c.text}
                            </p>
                          </div>
                        </ListGroup.Item>
                      ))}
                      {(!subtask.comments || subtask.comments.length === 0) && (
                        <div className="text-center text-muted small py-4">No comments posted yet.</div>
                      )}
                    </ListGroup>

                    {(hasEditRights || isAssignee) && (
                      <Form onSubmit={handlePostComment} className="d-flex gap-2 align-items-end">
                        <Form.Control
                          as="textarea"
                          rows={1}
                          placeholder="Add a comment... (use @name to mention)"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          style={{ fontSize: '13px', borderRadius: '8px', resize: 'none' }}
                        />
                        <Button type="submit" className="btn-emerald text-white px-3" style={{ height: '38px', borderRadius: '8px' }} disabled={!commentText.trim() || submittingComment}>
                          {submittingComment ? '...' : 'Post'}
                        </Button>
                      </Form>
                    )}
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div>
                    <ListGroup className="mb-3">
                      {subtask.attachments?.map((file, idx) => (
                        <ListGroup.Item key={idx} className="d-flex align-items-center justify-content-between py-2 border shadow-sm rounded mb-2 bg-white">
                          <div className="d-flex align-items-center gap-2">
                            <i className="far fa-file-alt text-primary fs-5"></i>
                            <div>
                              <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{file.name}</div>
                              <div className="text-muted" style={{ fontSize: '10.5px' }}>Attached {moment(file.uploadDate).format('LL')}</div>
                            </div>
                          </div>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                            <i className="fas fa-download"></i> View
                          </a>
                        </ListGroup.Item>
                      ))}
                      {(!subtask.attachments || subtask.attachments.length === 0) && (
                        <div className="text-center text-muted small py-4">No files attached to this subtask.</div>
                      )}
                    </ListGroup>

                    {(hasEditRights || isAssignee) && (
                      <Form.Group className="mb-3">
                        <Form.Label className="btn btn-outline-primary btn-sm m-0 cursor-pointer d-inline-flex align-items-center gap-2">
                          <i className="fas fa-cloud-upload-alt"></i>
                          {uploadingFile ? 'Uploading File...' : 'Upload Attachment'}
                          <Form.Control
                            type="file"
                            className="d-none"
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                          />
                        </Form.Label>
                      </Form.Group>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="activity-timeline" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {subtask.activityLog?.slice().reverse().map((log, idx) => (
                      <div key={idx} className="d-flex gap-2.5 pb-3 position-relative">
                        <div className="d-flex flex-column align-items-center" style={{ width: '32px' }}>
                          <div className="rounded-circle bg-emerald text-white d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', fontSize: '9px' }}>
                            <i className="fas fa-history"></i>
                          </div>
                          {idx !== subtask.activityLog.length - 1 && (
                            <div className="flex-grow-1" style={{ width: '2px', background: '#E2E8F0', margin: '4px 0' }}></div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            {log.message}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                            {moment(log.timestamp).format('LLL')}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!subtask.activityLog || subtask.activityLog.length === 0) && (
                      <div className="text-center text-muted small py-4">No activity logged.</div>
                    )}
                  </div>
                )}
              </div>
            </Col>

            {/* Right side: Sidebar details (Assignee, Priority, Status, Estimations, Watchers, Dependencies) */}
            <Col lg={4}>
              <div className="d-flex flex-column gap-4 bg-light p-3 rounded" style={{ border: '1px solid #E2E8F0' }}>
                <h5 className="fw-bold m-0" style={{ fontSize: '14px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Metadata & Settings
                </h5>

                {/* Status */}
                <div>
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Status</Form.Label>
                  <Form.Select
                    value={subtask.status}
                    disabled={!(hasEditRights || isAssignee)}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className={`text-white bg-${getStatusStyle(subtask.status)} border-0`}
                    style={{ borderRadius: '6px', fontWeight: 600 }}
                  >
                    {(hasEditRights
                      ? ['Pending', 'In Progress', 'Review', 'Completed', 'Blocked']
                      : (['Pending', 'In Progress', 'Completed'].includes(subtask.status)
                          ? ['Pending', 'In Progress', 'Completed']
                          : ['Pending', 'In Progress', 'Completed', subtask.status])
                    ).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* Priority */}
                <div>
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Priority</Form.Label>
                  <Form.Select
                    value={subtask.priority}
                    disabled={!hasEditRights}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    style={{ borderRadius: '6px', fontWeight: 600 }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </Form.Select>
                </div>

                {/* Assignee */}
                <div>
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Assignee</Form.Label>
                  {subtask.owner ? (
                    <div className="d-flex align-items-center gap-2 bg-white p-2 rounded border" style={{ height: '38px' }}>
                      <img
                        src={subtask.owner.profileImage || `https://ui-avatars.com/api/?name=${subtask.owner.firstName}+${subtask.owner.lastName}&background=3B82F6&color=fff&size=24`}
                        alt=""
                        className="rounded-circle border"
                        style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                      />
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                        {subtask.owner.firstName} {subtask.owner.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted italic">Unassigned</span>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={subtask.dueDate ? new Date(subtask.dueDate).toISOString().substring(0, 10) : ''}
                    disabled={!hasEditRights}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                    style={{ borderRadius: '6px' }}
                  />
                </div>

                {/* Estimation Tracker */}
                <Row className="g-2">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Est. Hours</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={subtask.estimatedHours || 0}
                        disabled={!hasEditRights}
                        onChange={(e) => handleFieldChange('estimatedHours', Number(e.target.value))}
                        style={{ borderRadius: '6px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Logged (Act.)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={subtask.actualHours || 0}
                        disabled={!(hasEditRights || isAssignee)}
                        onChange={(e) => handleFieldChange('actualHours', Number(e.target.value))}
                        style={{ borderRadius: '6px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Dependencies */}
                <div>
                  <Form.Label style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Blocked By (Dependency)</Form.Label>
                  <Form.Select
                    value={subtask.dependencies?.[0] || ''}
                    disabled={!hasEditRights}
                    onChange={(e) => handleFieldChange('dependencies', e.target.value ? [e.target.value] : [])}
                    style={{ borderRadius: '6px' }}
                  >
                    <option value="">No Dependencies</option>
                    {parentSubtasks.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.taskId}: {s.title} ({s.status})
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Modal.Body>
    </Modal>
  );
}
