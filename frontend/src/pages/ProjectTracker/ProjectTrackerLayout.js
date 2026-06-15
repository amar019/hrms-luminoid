import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/project-tracker.css';

export default function ProjectTrackerLayout() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Try to load cached projects from sessionStorage
    const cached = sessionStorage.getItem('tracker_projects');
    if (cached) {
      try {
        setProjects(JSON.parse(cached));
      } catch (err) {
        console.error("Failed to parse cached projects", err);
      }
    }

    // 2. Fetch from API to update cache and state
    fetchProjects();

    // 3. Listen to project update events to clear cache and refresh list
    const handleUpdate = () => {
      fetchProjects();
    };
    window.addEventListener('projectCreatedOrUpdated', handleUpdate);
    window.addEventListener('projectDeleted', handleUpdate);

    return () => {
      window.removeEventListener('projectCreatedOrUpdated', handleUpdate);
      window.removeEventListener('projectDeleted', handleUpdate);
    };
  }, []);

  const getProjectIdFromPath = (pathname) => {
    const match = pathname.match(/^\/project-tracker\/projects\/([^/]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const activeId = id || getProjectIdFromPath(location.pathname);
    if (activeId) {
      setSelectedProjectId(activeId);
      localStorage.setItem('selectedProjectId', activeId);
    } else {
      const stored = localStorage.getItem('selectedProjectId');
      if (stored && (stored === 'general' || projects.some(p => p._id === stored))) {
        setSelectedProjectId(stored);
      } else if (projects.length > 0) {
        setSelectedProjectId(projects[0]._id);
      }
    }
  }, [id, projects, location.pathname]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/projects');
      setProjects(res.data);
      sessionStorage.setItem('tracker_projects', JSON.stringify(res.data));
    } catch (e) {
      console.error("Failed to fetch projects list");
    }
  };

  const handleProjectChange = (projId) => {
    setSelectedProjectId(projId);
    localStorage.setItem('selectedProjectId', projId);
    setIsMobileMenuOpen(false);
    navigate(`/project-tracker/projects/${projId}`);
  };

  const currentProject = selectedProjectId === 'general'
    ? { _id: 'general', name: 'General Tasks', code: 'GEN' }
    : projects.find(p => p._id === selectedProjectId);
  const isManagerOrAdmin = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);

  return (
    <div className="tracker-app">
      {/* Mobile Top Header */}
      <div className="tracker-mobile-header px-3 py-2 d-flex align-items-center justify-content-between w-100">
        <button
          className="tracker-mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
        <span className="tracker-mobile-title">Luminoid Tracker</span>
        <div className="tracker-mobile-user">
          <img
            src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || 'User')}&background=10B981&color=fff&size=64`}
            alt=""
            className="tracker-mobile-user-avatar"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || 'User')}&background=10B981&color=fff&size=64`;
            }}
          />
        </div>
      </div>

      {/* Backdrop for Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="tracker-sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar Drawer */}
      <div className={`tracker-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="tracker-sidebar-header">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tracker-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Project Tracker
            </div>
            {/* Close button inside sidebar on mobile */}
            <button
              className="btn btn-link text-muted p-1 border-0 d-md-none"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <i className="fas fa-times fs-5"></i>
            </button>
          </div>

          {/* Project Selector Dropdown */}
          <Dropdown className="w-100 mb-2">
            <Dropdown.Toggle
              variant="light"
              className="w-100 d-flex align-items-center justify-content-between text-start border shadow-sm"
              style={{ background: '#FFFFFF', padding: '8px 12px', fontSize: '13.5px', fontWeight: 600, color: 'var(--tracker-text)', borderRadius: '6px' }}
            >
              <span className="d-flex align-items-center gap-2 text-truncate">
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--tracker-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', flexShrink: 0 }}>
                  <i className="fas fa-briefcase"></i>
                </div>
                <span className="text-truncate">{currentProject ? currentProject.name : 'Select Project'}</span>
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100 tracker-dropdown-menu">
              <Dropdown.Item
                onClick={() => handleProjectChange('general')}
                className={`tracker-dropdown-item ${selectedProjectId === 'general' ? 'active-project' : ''}`}
              >
                <div className="text-title">
                  <i className="fas fa-tasks" style={{ fontSize: '13px', color: selectedProjectId === 'general' ? '#10B981' : '#64748B' }}></i>
                  General Tasks
                </div>
                <span className="text-subtitle">No specific project linked</span>
              </Dropdown.Item>
              {projects.map(p => (
                <Dropdown.Item
                  key={p._id}
                  onClick={() => handleProjectChange(p._id)}
                  className={`tracker-dropdown-item ${p._id === selectedProjectId ? 'active-project' : ''}`}
                >
                  <div className="text-title">
                    <i className="fas fa-folder" style={{ fontSize: '13px', color: p._id === selectedProjectId ? '#10B981' : '#64748B' }}></i>
                    {p.name}
                  </div>
                  <span className="text-subtitle">Code: {p.code}</span>
                </Dropdown.Item>
              ))}
              <div className="tracker-dropdown-divider" />
              <Dropdown.Item
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/project-tracker/projects');
                }}
                className="tracker-dropdown-directory"
              >
                <i className="fas fa-list" style={{ fontSize: '13px' }}></i>
                Projects Directory
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <div className="tracker-sidebar-nav">
          <NavLink to="/project-tracker/projects" end className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <i className="fas fa-tachometer-alt" style={{ width: '16px', textAlign: 'center' }}></i> Dashboard
          </NavLink>

          <NavLink to="/project-tracker/my-tasks" className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <i className="fas fa-tasks" style={{ width: '16px', textAlign: 'center' }}></i> My Tasks
          </NavLink>

          <NavLink
            to={selectedProjectId ? `/project-tracker/projects/${selectedProjectId}` : '#'}
            className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''} ${!selectedProjectId ? 'disabled text-muted' : ''}`}
            onClick={(e) => {
              if (!selectedProjectId) {
                e.preventDefault();
              } else {
                setIsMobileMenuOpen(false);
              }
            }}
          >
            <i className="fas fa-table" style={{ width: '16px', textAlign: 'center' }}></i> Task Tracker
          </NavLink>

          <NavLink to="/project-tracker/daily-updates" className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <i className="fas fa-history" style={{ width: '16px', textAlign: 'center' }}></i> Daily Updates
          </NavLink>

          <NavLink to="/project-tracker/chat-rooms" className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <i className="fas fa-comments" style={{ width: '16px', textAlign: 'center' }}></i> Project Chat Rooms
          </NavLink>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="tracker-main">
        <Outlet context={{ currentProject }} />
      </div>
    </div>
  );
}
