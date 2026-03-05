import React, { useState, useEffect } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MdNotifications, MdTask, MdEdit, MdComment, MdAlternateEmail, MdSwapHoriz, MdTrendingUp } from 'react-icons/md';
import './NotificationsPanel.css';

const NotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Error fetching unread count');
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data.slice(0, 5));
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Error fetching notifications');
      }
    }
  };

  const handleToggle = (isOpen) => {
    setShow(isOpen);
    if (isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await api.put(`/api/notifications/${notification._id}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setShow(false);
      
      // Navigate to task details and open it
      const taskId = notification.task._id || notification.task;
      
      // Determine which page to navigate to based on user role
      if (user.role === 'EMPLOYEE') {
        navigate('/tasks', { state: { openTaskId: taskId } });
      } else {
        navigate('/task-management', { state: { openTaskId: taskId } });
      }
    } catch (error) {
      console.error('Error marking as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read');
    }
  };

  const getIcon = (type) => {
    const icons = {
      TASK_ASSIGNED: MdTask,
      TASK_UPDATED: MdEdit,
      COMMENT_ADDED: MdComment,
      MENTION: MdAlternateEmail,
      STATUS_CHANGED: MdSwapHoriz,
      PROGRESS_UPDATED: MdTrendingUp
    };
    return icons[type] || MdNotifications;
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!user) return null;

  return (
    <Dropdown show={show} onToggle={handleToggle} align="end">
      <Dropdown.Toggle as="div" className="nav-icon-btn" style={{position: 'relative', cursor: 'pointer'}}>
        <MdNotifications size={22} />
        {unreadCount > 0 && (
          <Badge bg="danger" pill className="badge-pulse" style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            fontSize: '10px',
            minWidth: '18px',
            height: '18px'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-menu">
        <div className="notification-header">
          <h6 className="mb-0">Notifications</h6>
          {unreadCount > 0 && (
            <button className="btn btn-link btn-sm p-0" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          )}
        </div>
        
        <div className="notification-list">
          {notifications.length > 0 ? (
            notifications.map(notif => {
              const IconComponent = getIcon(notif.type);
              return (
                <div
                  key={notif._id}
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon">
                    <IconComponent size={20} />
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notif.message}</p>
                    <small className="notification-time">{getTimeAgo(notif.createdAt)}</small>
                  </div>
                  {!notif.read && <div className="notification-dot"></div>}
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-muted">
              <MdNotifications size={48} className="mb-2" style={{opacity: 0.3}} />
              <p className="mb-0">No notifications</p>
            </div>
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationsPanel;
