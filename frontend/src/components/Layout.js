import React, { useState, useEffect } from 'react';
import { Nav, Navbar, Container, Row, Col, Breadcrumb, Button, Offcanvas } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [{ name: 'Home', path: '/dashboard' }];
    
    pathnames.forEach((name, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      breadcrumbs.push({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
        path
      });
    });
    
    return breadcrumbs;
  };

  const getMenuItems = () => {
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
      { path: '/attendance', label: 'Attendance', icon: 'fas fa-clock', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] }
    ];

    if (user?.role === 'EMPLOYEE') {
      items.push(
        { path: '/apply-leave', label: 'Apply Leave', icon: 'fas fa-plus-circle', roles: ['EMPLOYEE'] },
        { path: '/my-leaves', label: 'My Leaves', icon: 'fas fa-calendar-check', roles: ['EMPLOYEE'] }
      );
    }

    if (['MANAGER', 'HR', 'ADMIN'].includes(user?.role)) {
      items.push(
        { path: '/approvals', label: 'Pending Approvals', icon: 'fas fa-tasks', roles: ['MANAGER', 'HR', 'ADMIN'] },
        { path: '/team-calendar', label: 'Team Calendar', icon: 'fas fa-calendar-alt', roles: ['MANAGER', 'HR', 'ADMIN'] },
        { path: '/employee-directory', label: 'Employee Directory', icon: 'fas fa-users', roles: ['MANAGER', 'HR', 'ADMIN'] }
      );
    }

    if (['HR', 'ADMIN'].includes(user?.role)) {
      items.push(
        { path: '/leave-types', label: 'Leave Types', icon: 'fas fa-cogs', roles: ['HR', 'ADMIN'] },
        { path: '/announcements', label: 'Announcements', icon: 'fas fa-bullhorn', roles: ['HR', 'ADMIN'] },
        { path: '/reports', label: 'Reports', icon: 'fas fa-chart-bar', roles: ['HR', 'ADMIN'] }
      );
    }

    if (user?.role === 'ADMIN') {
      items.push(
        { path: '/departments', label: 'Departments', icon: 'fas fa-sitemap', roles: ['ADMIN'] }
      );
    }

    // Add Files for all users to view
    items.push(
      { path: '/files', label: 'Files & Documents', icon: 'fas fa-folder-open', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
      { path: '/profile', label: 'My Profile', icon: 'fas fa-user-circle', roles: ['EMPLOYEE', 'MANAGER', 'HR'] },
      { path: '/expenses', label: 'Expenses', icon: 'fas fa-receipt', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] }
    );

    if (['HR', 'ADMIN'].includes(user?.role)) {
      items.push(
        { path: '/assets', label: 'Asset Management', icon: 'fas fa-laptop', roles: ['HR', 'ADMIN'] }
      );
    }

    return items.filter(item => item.roles.includes(user?.role));
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-brand text-white">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="fas fa-building me-2 fs-4"></i>
            {(!sidebarCollapsed || isMobile) && (
              <div>
                <h5 className="mb-0">HRMS Pro</h5>
                <small className="text-light opacity-75">Leave Management</small>
              </div>
            )}
          </div>
          {!isMobile && (
            <Button 
              variant="link" 
              className="text-white p-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <i className={`fas fa-${sidebarCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
            </Button>
          )}
        </div>
      </div>
      
      <div className="text-white p-3 border-bottom border-secondary">
        <div className="d-flex align-items-center">
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
               style={{width: '40px', height: '40px'}}>
            <i className="fas fa-user text-white"></i>
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <div>
              <div className="fw-semibold">{user?.firstName} {user?.lastName}</div>
              <small className="text-light opacity-75">{user?.email}</small>
              <div>
                <span className="badge bg-primary mt-1">{user?.role}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Nav className="flex-column py-3">
        {getMenuItems().map(item => (
          <LinkContainer key={item.path} to={item.path}>
            <Nav.Link 
              className="text-white-50 d-flex align-items-center"
              onClick={() => isMobile && setShowMobileSidebar(false)}
            >
              <i className={`${item.icon} me-3`}></i>
              {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
            </Nav.Link>
          </LinkContainer>
        ))}
        <Nav.Link 
          className="text-white-50 d-flex align-items-center mt-3" 
          onClick={() => {
            logout();
            isMobile && setShowMobileSidebar(false);
          }}
          style={{ cursor: 'pointer' }}
        >
          <i className="fas fa-sign-out-alt me-3"></i>
          {(!sidebarCollapsed || isMobile) && <span>Logout</span>}
        </Nav.Link>
      </Nav>
    </>
  );

  return (
    <div className="app-container">
      {/* Theme Toggle - Hidden since it's now in navbar */}

      {/* Mobile Header */}
      {isMobile && (
        <Navbar bg="primary" variant="dark" className="mobile-header">
          <Button 
            variant="link" 
            className="text-white p-0 me-3"
            onClick={() => setShowMobileSidebar(true)}
          >
            <i className="fas fa-bars fs-4"></i>
          </Button>
          <Navbar.Brand className="mb-0">
            <i className="fas fa-building me-2"></i>
            HRMS Pro
          </Navbar.Brand>
          <Button 
            variant="link" 
            className="text-white p-0 ms-auto"
            onClick={logout}
            title="Logout"
          >
            <i className="fas fa-sign-out-alt fs-5"></i>
          </Button>
        </Navbar>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <SidebarContent />
        </div>
      )}

      {/* Mobile Sidebar */}
      <Offcanvas 
        show={showMobileSidebar} 
        onHide={() => setShowMobileSidebar(false)}
        className="sidebar-mobile"
      >
        <Offcanvas.Header closeButton className="text-white">
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <div className={`main-content ${isMobile ? 'mobile' : sidebarCollapsed ? 'collapsed' : ''}`}>

        <div className="content-wrapper">
          {/* Fixed Top Navbar for Desktop */}
          {!isMobile && (
            <div className="fixed-navbar d-flex justify-content-between align-items-center px-3 py-2 bg-white border-bottom mb-3" style={{minHeight: '60px'}}>
              {/* Breadcrumb Navigation */}
              <Breadcrumb className="breadcrumb-modern mb-0">
                {getBreadcrumbs().map((crumb, index) => (
                  <LinkContainer key={crumb.path} to={crumb.path}>
                    <Breadcrumb.Item 
                      active={index === getBreadcrumbs().length - 1}
                    >
                      {crumb.name}
                    </Breadcrumb.Item>
                  </LinkContainer>
                ))}
              </Breadcrumb>
              
              {/* Right Side Buttons */}
              <div className="d-flex gap-2">
                {/* <div className="theme-toggle-inline" onClick={toggleTheme}>
                  <i className={`fas fa-${theme === 'light' ? 'moon' : 'sun'}`}></i>
                </div> */}
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={logout}
                  className="d-flex align-items-center logout-btn-custom"
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </Button>
              </div>
            </div>
          )}
          
          <div className="animate-slide-up">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;