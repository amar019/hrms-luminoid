import React, { useState } from 'react';
import { Modal, Badge } from 'react-bootstrap';

const MobileTaskDetails = ({ task, show, onHide, user, onAddComment }) => {
  const [activeTab, setActiveTab] = useState('updates');
  const [comment, setComment] = useState('');

  if (!task) return null;

  const handleCommentSubmit = async () => {
    if (comment.trim()) {
      await onAddComment(comment);
      setComment('');
    }
  };

  return (
    <Modal show={show} onHide={onHide} fullscreen className="task-details-modal d-md-none">
      <Modal.Header closeButton style={{background: '#2c3e50', color: 'white', border: 'none'}}>
        <Modal.Title style={{fontSize: '1rem', fontWeight: '600'}}>
          Task Details
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Mobile Header */}
        <div className="mobile-task-header" style={{background: 'white', padding: '1.25rem', borderBottom: '1px solid #e0e0e0'}}>
          <div className="mobile-task-title" style={{fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem'}}>{task.title}</div>
          <p style={{fontSize: '0.85rem', color: '#666', margin: '0 0 0.75rem 0', lineHeight: '1.4'}}>{task.description || 'No description'}</p>
          <div className="mobile-task-meta" style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
            <Badge bg={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'info'} style={{fontSize: '0.75rem', padding: '0.35rem 0.6rem'}}>
              {task.priority}
            </Badge>
            <Badge bg={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'secondary'} style={{fontSize: '0.75rem', padding: '0.35rem 0.6rem'}}>
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge bg="dark" style={{fontSize: '0.75rem', padding: '0.35rem 0.6rem'}}>{task.department}</Badge>
            <Badge bg="secondary" style={{fontSize: '0.75rem', padding: '0.35rem 0.6rem'}}>{task.workLocation}</Badge>
          </div>
        </div>

        {/* Progress Card */}
        <div className="mobile-progress-card" style={{background: 'white', padding: '1.25rem', borderBottom: '1px solid #e0e0e0'}}>
          <div className="text-center">
            <small className="text-muted d-block mb-2" style={{fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Progress</small>
            <div className="mobile-progress-circle" style={{position: 'relative', display: 'inline-block'}}>
              <svg width="80" height="80" style={{transform: 'rotate(-90deg)'}}>
                <circle cx="40" cy="40" r="35" fill="none" stroke="#e9ecef" strokeWidth="8"/>
                <circle cx="40" cy="40" r="35" fill="none" 
                  stroke={task.progressPercent >= 75 ? '#198754' : task.progressPercent >= 50 ? '#0dcaf0' : task.progressPercent >= 25 ? '#ffc107' : '#dc3545'}
                  strokeWidth="8" strokeDasharray={`${(task.progressPercent || 0) * 2.2} 220`} strokeLinecap="round"/>
              </svg>
              <div className="mobile-progress-text" style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.25rem', fontWeight: '700', color: '#1a1a1a'}}>{task.progressPercent || 0}%</div>
            </div>
          </div>
        </div>

        {/* Task Info Section */}
        <div className="mobile-section" style={{background: 'white', padding: '1.25rem', borderBottom: '1px solid #e0e0e0'}}>
          <div className="mobile-section-title" style={{fontSize: '0.85rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
            Task Information
          </div>
          <div className="mobile-info-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div className="mobile-info-item">
              <div className="mobile-info-label" style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.3px'}}>Type</div>
              <div className="mobile-info-value" style={{fontSize: '0.85rem', fontWeight: '500', color: '#1a1a1a'}}>{task.taskType.replace(/_/g, ' ')}</div>
            </div>
            <div className="mobile-info-item">
              <div className="mobile-info-label" style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.3px'}}>Scheduled</div>
              <div className="mobile-info-value" style={{fontSize: '0.85rem', fontWeight: '500', color: '#1a1a1a'}}>{new Date(task.scheduledDate).toLocaleDateString('en-GB')}</div>
            </div>
            {task.dueDate && (
              <div className="mobile-info-item">
                <div className="mobile-info-label" style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.3px'}}>Due Date</div>
                <div className="mobile-info-value" style={{fontSize: '0.85rem', fontWeight: '500', color: '#1a1a1a'}}>{new Date(task.dueDate).toLocaleDateString('en-GB')}</div>
              </div>
            )}
            {task.estimatedHours && (
              <div className="mobile-info-item">
                <div className="mobile-info-label" style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.3px'}}>Est. Hours</div>
                <div className="mobile-info-value" style={{fontSize: '0.85rem', fontWeight: '500', color: '#1a1a1a'}}>{task.estimatedHours}h</div>
              </div>
            )}
            {task.actualHours && (
              <div className="mobile-info-item">
                <div className="mobile-info-label" style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.3px'}}>Actual Hours</div>
                <div className="mobile-info-value" style={{fontSize: '0.85rem', fontWeight: '500', color: '#1a1a1a'}}>{task.actualHours}h</div>
              </div>
            )}
            <div className="mobile-info-item">
              <div className="mobile-info-label" style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.3px'}}>GPS Required</div>
              <div className="mobile-info-value">
                <Badge bg={task.requireCheckIn ? 'success' : 'secondary'} style={{fontSize: '0.7rem'}}>
                  {task.requireCheckIn ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mobile-tabs" style={{display: 'flex', background: 'white', borderBottom: '2px solid #e0e0e0'}}>
          <button className={`mobile-tab ${activeTab === 'updates' ? 'active' : ''}`} onClick={() => setActiveTab('updates')} style={{flex: 1, padding: '0.85rem', border: 'none', background: activeTab === 'updates' ? '#2c3e50' : 'transparent', color: activeTab === 'updates' ? 'white' : '#666', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'}}>
            Updates
            <span className="mobile-tab-badge" style={{marginLeft: '0.35rem', background: activeTab === 'updates' ? 'rgba(255,255,255,0.2)' : '#e0e0e0', padding: '0.15rem 0.4rem', borderRadius: '10px', fontSize: '0.7rem'}}>{task.dailyUpdates?.length || 0}</span>
          </button>
          <button className={`mobile-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')} style={{flex: 1, padding: '0.85rem', border: 'none', background: activeTab === 'comments' ? '#2c3e50' : 'transparent', color: activeTab === 'comments' ? 'white' : '#666', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'}}>
            Comments
            <span className="mobile-tab-badge" style={{marginLeft: '0.35rem', background: activeTab === 'comments' ? 'rgba(255,255,255,0.2)' : '#e0e0e0', padding: '0.15rem 0.4rem', borderRadius: '10px', fontSize: '0.7rem'}}>{task.comments?.length || 0}</span>
          </button>
          <button className={`mobile-tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')} style={{flex: 1, padding: '0.85rem', border: 'none', background: activeTab === 'team' ? '#2c3e50' : 'transparent', color: activeTab === 'team' ? 'white' : '#666', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'}}>
            Team
            <span className="mobile-tab-badge" style={{marginLeft: '0.35rem', background: activeTab === 'team' ? 'rgba(255,255,255,0.2)' : '#e0e0e0', padding: '0.15rem 0.4rem', borderRadius: '10px', fontSize: '0.7rem'}}>{(task.assignedTo?.length || 0) + 1}</span>
          </button>
          {(task.client?.name || task.checkIn) && (
            <button className={`mobile-tab ${activeTab === 'more' ? 'active' : ''}`} onClick={() => setActiveTab('more')} style={{flex: 1, padding: '0.85rem', border: 'none', background: activeTab === 'more' ? '#2c3e50' : 'transparent', color: activeTab === 'more' ? 'white' : '#666', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'}}>
              More
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div style={{padding: '1rem', background: '#f5f5f5', height: 'calc(100vh - 380px)', overflowY: 'auto'}}>
          {activeTab === 'updates' && (
            <div>
              {task.dailyUpdates?.length > 0 ? (
                task.dailyUpdates.slice().reverse().map((update, idx) => (
                  <div key={idx} className="mobile-update-card" style={{background: 'white', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0'}}>
                    <div className="mobile-update-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                      <div className="mobile-update-user" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                        <div className="mobile-update-avatar" style={{width: '40px', height: '40px', borderRadius: '50%', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '600'}}>
                          {update.updatedBy?.firstName?.[0]}{update.updatedBy?.lastName?.[0]}
                        </div>
                        <div className="mobile-update-info">
                          <div className="mobile-update-name" style={{fontSize: '0.9rem', fontWeight: '600', color: '#1a1a1a'}}>{update.updatedBy?.firstName} {update.updatedBy?.lastName}</div>
                          <div className="mobile-update-time" style={{fontSize: '0.7rem', color: '#666'}}>
                            {new Date(update.date).toLocaleDateString('en-GB')} • {new Date(update.date).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
                          </div>
                        </div>
                      </div>
                      <Badge style={{fontSize: '0.8rem', padding: '0.35rem 0.65rem', background: update.progressPercent >= 75 ? '#28a745' : update.progressPercent >= 50 ? '#0366d6' : update.progressPercent >= 25 ? '#ffc107' : '#dc3545', border: 'none', color: 'white', fontWeight: '600'}}>
                        {update.progressPercent}%
                      </Badge>
                    </div>
                    {update.workDone && (
                      <div className="mobile-update-content" style={{background: '#f8f9fa', borderRadius: '4px', padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid #e0e0e0'}}>
                        <div className="mobile-update-label" style={{fontSize: '0.7rem', fontWeight: '600', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                          Work Completed
                        </div>
                        <div className="mobile-update-text" style={{fontSize: '0.85rem', color: '#1a1a1a', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>{update.workDone}</div>
                      </div>
                    )}
                    {update.issues && (
                      <div className="mobile-update-content" style={{background: '#fff3cd', borderRadius: '4px', padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid #ffc107'}}>
                        <div className="mobile-update-label" style={{fontSize: '0.7rem', fontWeight: '600', color: '#856404', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.3px'}}>
                          Issues / Blockers
                        </div>
                        <div className="mobile-update-text" style={{fontSize: '0.85rem', color: '#856404', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>{update.issues}</div>
                      </div>
                    )}
                    {update.hoursSpent && (
                      <div style={{fontSize: '0.75rem', color: '#666'}}>
                        Time spent: <strong>{update.hoursSpent} hours</strong>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="mobile-empty-state" style={{textAlign: 'center', padding: '4rem 1rem'}}>
                  <div style={{fontSize: '3rem', color: '#d1d5da', marginBottom: '1rem'}}>📋</div>
                  <div className="mobile-empty-text" style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#666'}}>No Updates Yet</div>
                  <p style={{fontSize: '0.85rem', color: '#999', margin: 0}}>Daily progress updates will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="mobile-comment-container" style={{background: '#e5ddd5', height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden'}}>
              <div className="mobile-comment-list" style={{flex: 1, overflowY: 'auto', padding: '1rem'}}>
                {task.comments?.length > 0 ? (
                  task.comments.map((c, idx) => {
                    const isOwn = c.user?._id === user?.id;
                    return (
                      <div key={idx} className={`mobile-comment ${isOwn ? 'own' : ''}`} style={{marginBottom: '0.75rem', display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start'}}>
                        <div style={{maxWidth: '80%'}}>
                          {!isOwn && (
                            <div style={{fontSize: '0.7rem', fontWeight: '600', color: '#666', marginBottom: '4px', marginLeft: '8px'}}>
                              {c.user?.firstName} {c.user?.lastName}
                            </div>
                          )}
                          <div className="mobile-comment-bubble" style={{padding: '8px 12px', borderRadius: '8px', background: isOwn ? '#d9fdd3' : 'white', color: '#1a1a1a', boxShadow: '0 1px 0.5px rgba(11,20,26,.13)'}}>
                            <div className="mobile-comment-text" style={{fontSize: '0.85rem', wordWrap: 'break-word', lineHeight: '1.4'}}>{c.text}</div>
                            <div className="mobile-comment-time" style={{fontSize: '0.65rem', color: '#667781', textAlign: 'right', marginTop: '4px'}}>
                              {new Date(c.createdAt).toLocaleString('en-GB', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="mobile-empty-state" style={{textAlign: 'center', padding: '4rem 1rem'}}>
                    <div style={{fontSize: '3rem', color: '#d1d5da', marginBottom: '1rem'}}>💬</div>
                    <div className="mobile-empty-text" style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#666'}}>No Comments Yet</div>
                    <p style={{fontSize: '0.85rem', color: '#999', margin: 0}}>Start the conversation</p>
                  </div>
                )}
              </div>
              <div className="mobile-comment-input" style={{display: 'flex', alignItems: 'end', gap: '0.5rem', background: '#f0f2f5', padding: '0.75rem', borderTop: '1px solid #d1d7db'}}>
                <textarea 
                  rows={1} 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  placeholder="Type a message"
                  style={{flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '0.85rem', padding: '8px 12px', background: 'white', borderRadius: '8px'}}
                />
                <button 
                  className="mobile-comment-send" 
                  onClick={handleCommentSubmit} 
                  disabled={!comment.trim()}
                  style={{width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'transparent', color: comment.trim() ? '#00a884' : '#8696a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: comment.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, padding: 0}}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div>
              <div style={{marginBottom: '1rem'}}>
                <div style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600'}}>Task Creator</div>
                <div className="mobile-team-member" style={{background: '#f8f9fa', padding: '0.85rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #e0e0e0'}}>
                  <div className="mobile-team-avatar" style={{width: '40px', height: '40px', borderRadius: '50%', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '600'}}>
                    {task.assignedBy?.firstName?.[0]}{task.assignedBy?.lastName?.[0]}
                  </div>
                  <div className="mobile-team-info">
                    <div className="mobile-team-name" style={{fontSize: '0.9rem', fontWeight: '600', color: '#1a1a1a'}}>{task.assignedBy?.firstName} {task.assignedBy?.lastName}</div>
                    <div className="mobile-team-email" style={{fontSize: '0.75rem', color: '#666'}}>{task.assignedBy?.email}</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600'}}>Assigned Team ({task.assignedTo?.length})</div>
                {task.assignedTo?.map(emp => (
                  <div key={emp._id} className="mobile-team-member" style={{background: 'white', padding: '0.85rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', border: '1px solid #e0e0e0'}}>
                    <div className="mobile-team-avatar" style={{width: '40px', height: '40px', borderRadius: '50%', background: '#6c757d', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '600'}}>
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="mobile-team-info">
                      <div className="mobile-team-name" style={{fontSize: '0.9rem', fontWeight: '600', color: '#1a1a1a'}}>{emp.firstName} {emp.lastName}</div>
                      <div className="mobile-team-email" style={{fontSize: '0.75rem', color: '#666'}}>{emp.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'more' && (
            <div>
              {task.client?.name && (
                <div className="mobile-section" style={{background: 'white', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #e0e0e0'}}>
                  <div className="mobile-section-title" style={{fontSize: '0.85rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Client Information
                  </div>
                  <div className="mobile-client-card">
                    <div className="mobile-client-item" style={{marginBottom: '0.5rem', fontSize: '0.85rem'}}><strong>Name:</strong> {task.client.name}</div>
                    {task.client.phone && <div className="mobile-client-item" style={{marginBottom: '0.5rem', fontSize: '0.85rem'}}><strong>Phone:</strong> {task.client.phone}</div>}
                    {task.client.company && <div className="mobile-client-item" style={{marginBottom: '0.5rem', fontSize: '0.85rem'}}><strong>Company:</strong> {task.client.company}</div>}
                    {task.client.address && <div className="mobile-client-item" style={{marginBottom: '0.5rem', fontSize: '0.85rem'}}><strong>Address:</strong> {task.client.address}</div>}
                  </div>
                </div>
              )}
              
              {task.requireCheckIn && (task.checkIn || task.checkOut) && (
                <div className="mobile-section" style={{background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #e0e0e0'}}>
                  <div className="mobile-section-title" style={{fontSize: '0.85rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    GPS Tracking
                  </div>
                  {task.checkIn && (
                    <div className="mobile-gps-card" style={{background: '#f8f9fa', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #e0e0e0'}}>
                      <div className="mobile-gps-title" style={{fontSize: '0.8rem', fontWeight: '600', color: '#28a745', marginBottom: '0.5rem'}}>Check-In</div>
                      <div className="mobile-gps-info" style={{fontSize: '0.8rem', marginBottom: '0.35rem'}}>
                        <strong>Time:</strong> {new Date(task.checkIn.time).toLocaleString('en-GB')}
                      </div>
                      <div className="mobile-gps-info" style={{fontSize: '0.8rem', marginBottom: '0.5rem'}}>
                        <strong>Location:</strong> {task.checkIn.location.lat}, {task.checkIn.location.lng}
                      </div>
                      <a href={`https://www.google.com/maps?q=${task.checkIn.location.lat},${task.checkIn.location.lng}`} target="_blank" rel="noopener noreferrer">
                        <button className="mobile-gps-map-btn" style={{background: '#28a745', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', width: '100%'}}>
                          View on Map
                        </button>
                      </a>
                    </div>
                  )}
                  {task.checkOut && (
                    <div className="mobile-gps-card" style={{background: '#f8f9fa', padding: '1rem', borderRadius: '6px', border: '1px solid #e0e0e0'}}>
                      <div className="mobile-gps-title" style={{fontSize: '0.8rem', fontWeight: '600', color: '#dc3545', marginBottom: '0.5rem'}}>Check-Out</div>
                      <div className="mobile-gps-info" style={{fontSize: '0.8rem', marginBottom: '0.35rem'}}>
                        <strong>Time:</strong> {new Date(task.checkOut.time).toLocaleString('en-GB')}
                      </div>
                      <div className="mobile-gps-info" style={{fontSize: '0.8rem', marginBottom: '0.5rem'}}>
                        <strong>Location:</strong> {task.checkOut.location.lat}, {task.checkOut.location.lng}
                      </div>
                      <a href={`https://www.google.com/maps?q=${task.checkOut.location.lat},${task.checkOut.location.lng}`} target="_blank" rel="noopener noreferrer">
                        <button className="mobile-gps-map-btn" style={{background: '#dc3545', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', width: '100%'}}>
                          View on Map
                        </button>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default MobileTaskDetails;
