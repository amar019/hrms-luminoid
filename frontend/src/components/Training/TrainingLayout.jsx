import React from 'react';
import { Box, Typography, Tabs, Tab, Paper, Container } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdSchool, MdBookmark, MdCardMembership, MdPoll, MdSettings } from 'react-icons/md';

const TrainingLayout = ({ user, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isAdmin = ['HR', 'ADMIN'].includes(user?.role);
  const isManager = user?.role === 'MANAGER';
  const showCompliance = isAdmin || isManager;
  const showAdminHub = isAdmin;

  // Define tabs dynamically based on user roles
  const tabs = [];
  if (!isAdmin) {
    tabs.push({ label: 'My Learning', path: '/training', icon: <MdSchool style={{ fontSize: '1.2rem', marginBottom: '2px' }} /> });
  }
  tabs.push({ label: 'Browse Courses', path: '/training/catalog', icon: <MdBookmark style={{ fontSize: '1.2rem', marginBottom: '2px' }} /> });
  if (!isAdmin) {
    tabs.push({ label: 'Certificates', path: '/training/certificates', icon: <MdCardMembership style={{ fontSize: '1.2rem', marginBottom: '2px' }} /> });
  }
  if (isManager) {
    tabs.push({ label: 'Compliance', path: '/training/compliance', icon: <MdPoll style={{ fontSize: '1.2rem', marginBottom: '2px' }} /> });
  }
  if (showAdminHub) {
    tabs.push({ label: 'Admin Hub', path: '/training/admin', icon: <MdSettings style={{ fontSize: '1.2rem', marginBottom: '2px' }} /> });
  }

  // Determine active tab index based on route
  const getActiveTab = () => {
    const matchedIndex = tabs.findIndex(tab => {
      if (tab.path === '/training') {
        return currentPath === '/training' || currentPath === '/training/';
      }
      return currentPath.startsWith(tab.path);
    });
    return matchedIndex !== -1 ? matchedIndex : 0;
  };

  const handleTabChange = (event, newValue) => {
    const targetTab = tabs[newValue];
    if (targetTab) {
      navigate(targetTab.path);
    }
  };

  const activeTab = getActiveTab();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F8F9FA', py: 0 }}>
      {/* Premium LMS Header */}
      <Paper
        elevation={0}
        className="premium-gradient-header"
        sx={{
          color: '#FFFFFF',
          borderRadius: 0,
          pt: 4,
          pb: 6,
          px: { xs: 2, md: 4 },
          mb: 0
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                  mb: 1
                }}
              >
                Welcome Back, {user?.firstName || 'Learner'} 👋
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  opacity: 0.85,
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  maxWidth: '600px'
                }}
              >
                Explore expert-led courses, verify compliance requirements, and build your professional skill set.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderBottom: '1px solid #E2E8F0',
          borderRadius: 0,
          backgroundColor: '#FFFFFF',
          px: { xs: 2, md: 4 },
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        <Container maxWidth="lg">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#0A66C2',
                height: '3px'
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.92rem',
                minWidth: 'auto',
                py: 2,
                px: 3,
                color: '#64748B',
                fontFamily: "'Inter', sans-serif",
                '&.Mui-selected': {
                  color: '#0A66C2'
                }
              }
            }}
          >
            {tabs.map((tab, idx) => (
              <Tab
                key={idx}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
              />
            ))}
          </Tabs>
        </Container>
      </Paper>

      {/* Main Content Viewport */}
      <Container maxWidth="lg" sx={{ py: 4, pb: 8 }} className="animate-fade-in">
        {children}
      </Container>
    </Box>
  );
};

export default TrainingLayout;
