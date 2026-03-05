import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Badge, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './DailyUpdates.css';

const DailyUpdates = () => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [charCount, setCharCount] = useState(0);
  const maxChars = 280;

  useEffect(() => {
    fetchUpdates();
  }, [filter]);

  const fetchUpdates = async () => {
    try {
      const response = await api.get(`/api/daily-updates?filter=${filter}`);
      setUpdates(response.data);
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdate.trim() || newUpdate.length > maxChars) return;

    setLoading(true);
    try {
      await api.post('/api/daily-updates', { content: newUpdate });
      setNewUpdate('');
      setCharCount(0);
      fetchUpdates();
      toast.success('Posted!');
    } catch (error) {
      toast.error('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (updateId) => {
    try {
      await api.post(`/api/daily-updates/${updateId}/like`);
      fetchUpdates();
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleComment = async (updateId, comment) => {
    try {
      await api.post(`/api/daily-updates/${updateId}/comment`, { comment });
      fetchUpdates();
      toast.success('Replied!');
    } catch (error) {
      toast.error('Failed to reply');
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setNewUpdate(text);
      setCharCount(text.length);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="twitter-container">
      {/* Header */}
      <div className="twitter-header">
        <h5 className="twitter-title">Daily Updates</h5>
        <Dropdown>
          <Dropdown.Toggle variant="link" className="filter-toggle">
            <i className="fas fa-ellipsis-h"></i>
          </Dropdown.Toggle>
          <Dropdown.Menu align="end">
            <Dropdown.Item onClick={() => setFilter('all')} active={filter === 'all'}>
              <i className="fas fa-globe me-2"></i>All Updates
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setFilter('team')} active={filter === 'team'}>
              <i className="fas fa-users me-2"></i>Team Only
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setFilter('mine')} active={filter === 'mine'}>
              <i className="fas fa-user me-2"></i>My Updates
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Compose Tweet */}
      <div className="compose-tweet">
        <div className="compose-avatar">
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </div>
        <Form onSubmit={handlePostUpdate} className="compose-form">
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="What's happening?"
            value={newUpdate}
            onChange={handleInputChange}
            className="compose-input"
          />
          <div className="compose-footer">
            <div className="compose-actions">
              <span className={`char-count ${charCount > maxChars * 0.9 ? 'warning' : ''}`}>
                {charCount > 0 && `${charCount}/${maxChars}`}
              </span>
            </div>
            <Button 
              type="submit" 
              className="tweet-btn"
              disabled={loading || !newUpdate.trim() || charCount > maxChars}
            >
              {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Post'}
            </Button>
          </div>
        </Form>
      </div>

      {/* Feed */}
      <div className="twitter-feed">
        {updates.length > 0 ? (
          updates.map((update) => (
            <TweetCard 
              key={update._id} 
              update={update} 
              onLike={handleLike}
              onComment={handleComment}
              getTimeAgo={getTimeAgo}
              currentUser={user}
              onDelete={fetchUpdates}
            />
          ))
        ) : (
          <div className="empty-feed">
            <i className="fas fa-comments fa-3x mb-3"></i>
            <p>No updates yet</p>
            <small>Be the first to share something!</small>
          </div>
        )}
      </div>
    </div>
  );
};

const TweetCard = ({ update, onLike, onComment, getTimeAgo, currentUser, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(update.likes?.includes(currentUser?._id));
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(update.content);

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    onLike(update._id);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(update._id, commentText);
      setCommentText('');
    }
  };

  const handleEdit = async () => {
    if (editText.trim() && editText !== update.content) {
      try {
        await api.put(`/api/daily-updates/${update._id}`, { content: editText });
        toast.success('Updated');
        setIsEditing(false);
        onDelete();
      } catch (error) {
        toast.error('Failed to update');
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this post?')) {
      try {
        await api.delete(`/api/daily-updates/${update._id}`);
        toast.success('Deleted');
        onDelete();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const canModify = update.userId?._id === currentUser?._id;
  const canDelete = update.userId?._id === currentUser?._id || ['ADMIN', 'HR'].includes(currentUser?.role);

  return (
    <div className="tweet-card">
      <div className="tweet-avatar">
        {update.userId?.firstName?.charAt(0)}{update.userId?.lastName?.charAt(0)}
      </div>
      <div className="tweet-content-wrapper">
        <div className="tweet-header">
          <div className="tweet-user-info">
            <span className="tweet-name">{update.userId?.firstName} {update.userId?.lastName}</span>
            <span className="tweet-username">@{update.userId?.role?.toLowerCase()}</span>
            <span className="tweet-dot">·</span>
            <span className="tweet-time">{getTimeAgo(update.createdAt)}</span>
          </div>
          {(canModify || canDelete) && (
            <Dropdown show={showMenu} onToggle={setShowMenu}>
              <Dropdown.Toggle variant="link" className="tweet-menu-btn">
                <i className="fas fa-ellipsis-h"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                {canModify && (
                  <Dropdown.Item onClick={() => setIsEditing(true)}>
                    <i className="fas fa-edit me-2"></i>Edit
                  </Dropdown.Item>
                )}
                {canDelete && (
                  <Dropdown.Item onClick={handleDelete} className="text-danger">
                    <i className="fas fa-trash me-2"></i>Delete
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2">
            <Form.Control
              as="textarea"
              rows={3}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="compose-input"
              autoFocus
            />
            <div className="d-flex gap-2 mt-2">
              <Button size="sm" className="tweet-btn" onClick={handleEdit}>Save</Button>
              <Button size="sm" variant="outline-secondary" onClick={() => { setIsEditing(false); setEditText(update.content); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="tweet-text">
            {update.content}
          </div>
        )}

        <div className="tweet-actions">
          <button className="tweet-action-btn" onClick={() => setShowComments(!showComments)}>
            <i className="far fa-comment"></i>
            <span>{update.comments?.length || 0}</span>
          </button>
          <button className={`tweet-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLikeClick}>
            <i className={`fa${isLiked ? 's' : 'r'} fa-heart`}></i>
            <span>{update.likes?.length || 0}</span>
          </button>
        </div>

        {showComments && (
          <div className="tweet-replies">
            {update.comments?.map((comment, idx) => (
              <div key={idx} className="tweet-reply">
                <div className="reply-avatar">
                  {comment.userId?.firstName?.charAt(0)}
                </div>
                <div className="reply-content">
                  <div className="reply-header">
                    <span className="reply-name">{comment.userId?.firstName} {comment.userId?.lastName}</span>
                  </div>
                  <p className="reply-text">{comment.text}</p>
                </div>
              </div>
            ))}
            <Form onSubmit={handleCommentSubmit} className="reply-form">
              <div className="reply-avatar">
                {currentUser?.firstName?.charAt(0)}
              </div>
              <div className="reply-input-wrapper">
                <Form.Control 
                  type="text" 
                  placeholder="Post your reply" 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)}
                  className="reply-input"
                />
                <Button type="submit" className="reply-btn" disabled={!commentText.trim()}>
                  Reply
                </Button>
              </div>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyUpdates;
