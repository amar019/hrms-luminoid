import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Card, Dropdown, Alert, Spinner, ListGroup } from 'react-bootstrap';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';


export default function ProjectDiscussionRoom({ projectId, projectName, projectCode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [members, setMembers] = useState([]);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  // Mention autocomplete states
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);

  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch messages from backend
  const fetchMessages = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const response = await api.get(`/api/project-chat/${projectId}/messages?limit=100`);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // Fetch project members for details sidebar or tags
  const fetchProjectDetails = async () => {
    try {
      const response = await api.get(`/api/projects/${projectId}`);
      const projectData = response.data;
      const allMembers = [];
      if (projectData.leader) {
        allMembers.push({ ...projectData.leader, isLeader: true });
      }
      if (projectData.members) {
        projectData.members.forEach(m => {
          allMembers.push({ ...m, isLeader: false });
        });
      }
      setMembers(allMembers);
    } catch (err) {
      console.error('Failed to fetch project members:', err);
    }
  };

  // Trigger loading room data
  useEffect(() => {
    if (projectId) {
      fetchMessages(true);
      fetchProjectDetails();
      
      // Auto-scroll on loading
      setTimeout(scrollToBottom, 300);
    }
  }, [projectId]);

  // Polling every 10 seconds for new messages
  useEffect(() => {
    if (!projectId) return;

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [projectId]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/api/project-chat/${projectId}/messages`, {
        message: newMessage.trim()
      });
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      setShowMentions(false);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to send message' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/(?:^|\s)@(\w*)$/);
    
    if (match) {
      setShowMentions(true);
      setMentionQuery(match[1]);
      setMentionPosition(cursor - match[1].length);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member) => {
    const textBefore = newMessage.slice(0, mentionPosition);
    const textAfter = newMessage.slice(mentionPosition + mentionQuery.length);
    const updated = `${textBefore}${member.firstName} ${textAfter}`;
    setNewMessage(updated);
    setShowMentions(false);
  };

  const filteredMembers = members.filter(m => 
    m.firstName.toLowerCase().includes(mentionQuery.toLowerCase()) || 
    m.lastName.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Composer keypress handler (Enter to send, Shift+Enter to newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initiate inline edit mode
  const startEditing = (msg) => {
    setEditingMessageId(msg._id);
    setEditText(msg.message);
  };

  // Save inline edit
  const handleSaveEdit = async (msgId) => {
    if (!editText.trim()) return;

    try {
      const response = await api.put(`/api/project-chat/messages/${msgId}`, {
        message: editText.trim()
      });
      
      setMessages(prev => prev.map(m => m._id === msgId ? response.data : m));
      setEditingMessageId(null);
      setEditText('');
      Swal.fire({ icon: 'success', title: 'Success', text: 'Message updated', timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to update message' });
    }
  };

  // Delete message
  const handleDeleteMessage = (msgId) => {
    Swal.fire({
      title: 'Delete Message?',
      text: 'Are you sure you want to delete this message? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/project-chat/messages/${msgId}`);
          setMessages(prev => prev.filter(m => m._id !== msgId));
          Swal.fire({ icon: 'success', title: 'Success', text: 'Message deleted', timer: 2000, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete message' });
        }
      }
    });
  };

  // Format timestamps nicely
  const formatTimestamp = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const timeStr = date.toLocaleTimeString([], timeOptions);

    if (isToday) {
      return `Today at ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday at ${timeStr}`;
    } else {
      return `${date.toLocaleDateString([], { day: '2-digit', month: 'short' })} at ${timeStr}`;
    }
  };

  const renderMessageText = (msg) => {
    if (!msg.mentions || msg.mentions.length === 0) {
      return msg.message;
    }
    
    let parts = [msg.message];
    msg.mentions.forEach(m => {
      const mentionStr = `@${m.firstName}`;
      const newParts = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          // Escape string for regex
          const escapedMentionStr = mentionStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escapedMentionStr})(?=\\s|$)`, 'gi');
          const split = part.split(regex);
          split.forEach(s => {
            if (s.toLowerCase() === mentionStr.toLowerCase()) {
              newParts.push(
                <span key={`${m._id}-${Math.random()}`} className="fw-semibold" style={{ color: '#6366F1', backgroundColor: '#EEF2FF', padding: '1px 5px', borderRadius: '4px' }}>
                  {s}
                </span>
              );
            } else if (s) {
              newParts.push(s);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });
    
    return parts;
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="d-flex h-100 border-0 overflow-hidden bg-transparent gap-3">
      
      {/* Discussion Area */}
      <div className="d-flex flex-column flex-grow-1 h-100 bg-white shadow-sm rounded-4" style={{ minWidth: 0 }}>
        {/* Discussion Header */}
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white z-1 rounded-top-4">
          <div>
            <h5 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '18px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
              {projectName} Discussion
            </h5>
            <div className="text-muted small ms-4">Code: <strong className="text-dark">{projectCode}</strong></div>
          </div>
          <div className="d-flex align-items-center gap-3 text-secondary">
            <i className="fas fa-search cursor-pointer fs-5 hover-text-dark"></i>
            <i className="far fa-window-close cursor-pointer fs-4 hover-text-dark"></i>
          </div>
        </div>

        {/* Discussion Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-grow-1 p-4 overflow-y-auto d-flex flex-column gap-3 bg-white"
          style={{ minHeight: 0 }}
        >
          {loading ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Spinner animation="border" variant="success" />
            </div>
          ) : messages.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
              <i className="far fa-comments fs-1 mb-2 text-secondary"></i>
              <h6 className="fw-semibold">No discussions yet.</h6>
              <p className="small text-center mb-0">Start the project conversation by typing an update below!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender?._id === user?.id || msg.sender === user?.id;
              const canModify = isOwnMessage || isAdmin;

              return (
                <div 
                  key={msg._id} 
                  className={`d-flex flex-column mb-2 ${isOwnMessage ? 'align-items-end' : 'align-items-start'}`}
                  onMouseEnter={() => setHoveredMessageId(msg._id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {/* Sender Info Row */}
                  <div className={`d-flex align-items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    <img
                      src={msg.sender?.profileImage || `https://ui-avatars.com/api/?name=${msg.sender ? `${msg.sender.firstName}+${msg.sender.lastName}` : 'User'}&background=${isOwnMessage ? '10B981' : '1E293B'}&color=fff&size=64`}
                      alt=""
                      className="rounded-circle shadow-sm"
                      style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                    />
                    <div className={`d-flex align-items-center gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                        {msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown'}
                      </span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Message Bubble Card */}
                  <div className="d-flex align-items-center gap-2">
                    {isOwnMessage && canModify && !editingMessageId && hoveredMessageId === msg._id && (
                      <div className="d-flex align-items-center gap-1 me-1">
                        <Button variant="light" size="sm" className="rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm p-0 text-secondary bg-white" style={{ width: '26px', height: '26px' }} onClick={() => startEditing(msg)} title="Edit">
                          <i className="fas fa-pen" style={{ fontSize: '11px' }}></i>
                        </Button>
                        <Button variant="light" size="sm" className="rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm p-0 text-danger bg-white" style={{ width: '26px', height: '26px' }} onClick={() => handleDeleteMessage(msg._id)} title="Delete">
                          <i className="fas fa-trash" style={{ fontSize: '11px' }}></i>
                        </Button>
                      </div>
                    )}

                    {editingMessageId === msg._id ? (
                      /* Inline Edit Input Form */
                      <Card className="p-2 border border-warning shadow-sm" style={{ borderRadius: '12px', minWidth: '250px' }}>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="border-0 p-1 resize-none"
                          style={{ fontSize: '14px', outline: 'none', boxShadow: 'none' }}
                        />
                        <div className="d-flex justify-content-end gap-1 mt-2">
                          <Button size="sm" variant="light" className="py-0 px-3 border" style={{ fontSize: '12.5px' }} onClick={() => setEditingMessageId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" className="py-0 px-3 text-white border-0" style={{ backgroundColor: '#10B981', fontSize: '12.5px' }} onClick={() => handleSaveEdit(msg._id)}>
                            Save
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      /* Message Body */
                      <div 
                        className={`shadow-sm position-relative ${isOwnMessage ? 'bg-success text-white' : 'bg-white text-dark'}`}
                        style={{ 
                          padding: '10px 14px',
                          borderRadius: isOwnMessage ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                          maxWidth: '75%',
                          marginLeft: isOwnMessage ? '0' : '38px',
                          marginRight: isOwnMessage ? '38px' : '0',
                          minWidth: '120px'
                        }}
                      >
                        <p className="mb-0 pre-line-wrap" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13.5px', lineHeight: '1.5', paddingBottom: '14px' }}>
                          {renderMessageText(msg)}
                        </p>
                        
                        <div className="position-absolute d-flex align-items-center gap-1" style={{ bottom: '6px', right: '10px', fontSize: '10px' }}>
                          {msg.editedAt && (
                            <span className={isOwnMessage ? 'text-white-50' : 'text-muted'} style={{ fontStyle: 'italic', marginRight: '4px' }}>
                              (edited)
                            </span>
                          )}
                          <span className={isOwnMessage ? 'text-white-50' : 'text-muted'}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwnMessage && (
                            <i className="fas fa-check-double text-white-50 ms-1"></i>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!isOwnMessage && canModify && !editingMessageId && hoveredMessageId === msg._id && (
                      <div className="d-flex align-items-center gap-1 ms-1">
                        <Button variant="light" size="sm" className="rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm p-0 text-danger bg-white" style={{ width: '26px', height: '26px' }} onClick={() => handleDeleteMessage(msg._id)} title="Delete">
                          <i className="fas fa-trash" style={{ fontSize: '11px' }}></i>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer Footer */}
        <div className="p-3 bg-white position-relative rounded-bottom-4">
          {/* Mentions Autocomplete Dropdown */}
          {showMentions && filteredMembers.length > 0 && (
            <ListGroup 
              className="position-absolute shadow border" 
              style={{ bottom: '100%', left: '1rem', zIndex: 1000, maxHeight: '200px', overflowY: 'auto', width: '250px', marginBottom: '8px', borderRadius: '8px' }}
            >
              {filteredMembers.map(m => (
                <ListGroup.Item 
                  key={m._id} 
                  action 
                  onClick={() => insertMention(m)}
                  className="d-flex align-items-center gap-2 py-2 border-0 border-bottom"
                >
                  <img
                    src={m.profileImage || `https://ui-avatars.com/api/?name=${m.firstName}+${m.lastName}&background=10B981&color=fff&size=32`}
                    alt=""
                    className="rounded-circle"
                    style={{ width: '24px', height: '24px' }}
                  />
                  <span className="small fw-semibold text-dark">{m.firstName} {m.lastName}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
          
          <Form onSubmit={handleSendMessage} className="d-flex gap-3 align-items-center">
            <div className="d-flex flex-grow-1 align-items-center bg-white border shadow-sm px-4" style={{ borderRadius: '28px', height: '56px' }}>
              <Form.Control
                type="text"
                placeholder="Type your message... Use @"
                value={newMessage}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                disabled={submitting}
                className="border-0 shadow-none text-dark flex-grow-1 bg-transparent"
                style={{ fontSize: '14px', outline: 'none' }}
                maxLength={2000}
                autoComplete="off"
              />
              <div className="d-flex align-items-center gap-3 text-secondary fs-5 ms-2">
                <i className="fas fa-paperclip cursor-pointer hover-text-dark"></i>
                <i className="far fa-smile cursor-pointer hover-text-dark"></i>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={submitting || !newMessage.trim()}
              className="d-flex align-items-center justify-content-center text-white border-0 shadow-sm flex-shrink-0 p-0"
              style={{ backgroundColor: '#5DCD9A', borderRadius: '16px', width: '56px', height: '56px' }}
            >
              {submitting ? (
                <Spinner size="sm" animation="border" />
              ) : (
                <i className="fas fa-paper-plane fs-4" style={{ transform: 'rotate(45deg)', position: 'relative', right: '2px', bottom: '2px' }}></i>
              )}
            </Button>
          </Form>
        </div>
      </div>

      {/* Side Participants Directory (Desktop Only) */}
      <div className="d-none d-xl-flex flex-column bg-white shadow-sm rounded-4" style={{ width: '260px', flexShrink: 0 }}>
        <div className="p-3 border-bottom text-center">
          <div className="fw-bold text-dark text-start mb-3" style={{ fontSize: '14px' }}>Room Details</div>
          
          <div className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-success-subtle rounded-4" style={{ width: '64px', height: '64px', color: '#10B981' }}>
            <i className="fas fa-users" style={{ fontSize: '24px' }}></i>
          </div>
          
          <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '15px' }}>
            {projectName}
          </h5>
          <div className="text-muted small mb-1">Code: {projectCode}</div>
          <div className="text-muted" style={{ fontSize: '12px' }}>{members.length} Members</div>
        </div>

        <div className="p-3 border-bottom">
          <div className="fw-bold text-dark mb-3" style={{ fontSize: '13.5px' }}>Members ({members.length})</div>
          <div className="d-flex flex-column gap-2">
            {members.slice(0, 5).map(m => (
              <div key={m._id} className="d-flex align-items-center gap-2">
                <img
                  src={m.profileImage || `https://ui-avatars.com/api/?name=${m.firstName}+${m.lastName}&background=1E293B&color=fff&size=48`}
                  alt=""
                  className="rounded-circle shadow-sm"
                  style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                />
                <div className="text-truncate">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '12.5px' }}>
                    {m.firstName} {m.lastName}
                  </div>
                  {m.isLeader ? (
                    <span className="badge bg-success rounded-pill px-2 py-1" style={{ fontSize: '9px' }}>Leader</span>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '10.5px', display: 'block' }}>{m.designation || 'Member'}</span>
                  )}
                </div>
              </div>
            ))}
            {members.length > 5 && (
              <div className="text-center mt-2">
                <Button variant="link" className="text-success text-decoration-none small fw-semibold p-0">View All</Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 flex-grow-1">
          <div className="fw-bold text-dark mb-3" style={{ fontSize: '13.5px' }}>Room Actions</div>
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted d-flex align-items-center gap-2" style={{ fontSize: '12.5px' }}>
              <i className="far fa-bell" style={{ width: '14px' }}></i> Mute Notifications
            </span>
            <Form.Check type="switch" id="mute-switch" className="custom-switch" />
          </div>

          <div className="d-flex justify-content-start align-items-center mt-4">
            <span className="text-danger d-flex align-items-center gap-2 fw-semibold cursor-pointer" style={{ fontSize: '12.5px' }}>
              <i className="fas fa-sign-out-alt" style={{ width: '14px' }}></i> Leave Room
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
