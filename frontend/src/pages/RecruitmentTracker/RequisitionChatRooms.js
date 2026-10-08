import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import GlobalSpinner from '../../components/GlobalSpinner';

export default function RequisitionChatRooms() {
  const { currentRequisition } = useOutletContext();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (currentRequisition && currentRequisition._id && currentRequisition._id !== 'all') {
      fetchDiscussion(currentRequisition._id);
    }
  }, [currentRequisition]);

  const fetchDiscussion = async (reqId) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/requisition-discussions/${reqId}`);
      setDiscussion(res.data);
    } catch (err) {
      console.error("Failed to load requisition discussion", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !currentRequisition || currentRequisition._id === 'all') return;

    setSending(true);
    try {
      const res = await api.post(`/api/requisition-discussions/${currentRequisition._id}/messages`, {
        message: messageText
      });
      setDiscussion(res.data);
      setMessageText('');
    } catch (err) {
      console.error("Failed to post message", err);
    } finally {
      setSending(false);
    }
  };

  if (!currentRequisition || currentRequisition._id === 'all') {
    return (
      <div className="text-center py-5 bg-white rounded-3 border">
        <i className="fas fa-comments text-muted fs-1 mb-2"></i>
        <h5 className="fw-bold text-muted">Select a Specific Requisition</h5>
        <p className="text-muted small">Please select a specific Job Requisition from the sidebar dropdown to enter its Discussion Room.</p>
      </div>
    );
  }

  if (loading && !discussion) return <GlobalSpinner />;

  return (
    <div className="container-fluid p-0">
      <div className="mb-3">
        <h4 className="fw-bold mb-1 text-dark">
          Discussion Room: <span style={{ color: '#059669' }}>{currentRequisition.title} ({currentRequisition.code})</span>
        </h4>
        <small className="text-muted">Real-time collaboration channel for Hiring Managers & Recruiter team.</small>
      </div>

      <Card className="border-0 shadow-sm" style={{ height: 'calc(100vh - 210px)', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
        <Card.Header className="bg-white py-3 fw-bold border-bottom">
          <i className="fas fa-comments text-emerald me-2"></i> Team Chat Channel
        </Card.Header>

        <Card.Body className="p-3" style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
          {discussion?.messages?.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-paper-plane fs-3 mb-2 d-block text-secondary"></i>
              No messages posted yet. Start the conversation with your hiring team!
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {discussion?.messages?.map((msg, idx) => {
                const isMe = msg.sender?._id === user?.id;
                return (
                  <div
                    key={idx}
                    className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        background: isMe ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#ffffff',
                        color: isMe ? '#ffffff' : '#1e293b',
                        padding: '0.75rem 1.15rem',
                        borderRadius: isMe ? '16px 16px 0px 16px' : '16px 16px 16px 0px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: isMe ? 'none' : '1px solid #e2e8f0'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1 gap-3" style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                        <span className="fw-bold">{msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'User'}</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', whitespace: 'pre-wrap' }}>{msg.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>

        <Card.Footer className="bg-white p-3 border-top">
          <Form onSubmit={handleSendMessage} className="d-flex gap-2">
            <Form.Control
              type="text"
              className="green-form-control"
              placeholder="Type your message to the hiring team..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={sending}
            />
            <Button
              type="submit"
              className="btn-emerald-primary"
              disabled={sending || !messageText.trim()}
            >
              {sending ? 'Sending...' : <i className="fas fa-paper-plane"></i>}
            </Button>
          </Form>
        </Card.Footer>
      </Card>
    </div>
  );
}
