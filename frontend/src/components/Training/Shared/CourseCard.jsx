import React, { useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip, Button, LinearProgress, Menu, MenuItem, IconButton } from '@mui/material';
import { MdAccessTime, MdPeople, MdPlayArrow, MdCheckCircle, MdAssignment, MdMoreHoriz, MdBookmarkBorder, MdBookmark, MdArrowForward, MdShield } from 'react-icons/md';
import { formatDuration } from '../../../utils/format';

const CourseCard = ({ course, onView, onEdit, onDelete, onManageProgress, isAdmin, userRole, variant = 'vertical' }) => {
  const { title, description, category, thumbnailUrl, estimatedMinutes, isMandatory, progress, targetRoles, targetDepartments } = course;
  
  const status = progress?.status || 'NOT_STARTED';
  const [bookmarked, setBookmarked] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLETED':
        return { label: 'Completed', color: 'success', bg: '#E6F4EA', textColor: '#137333' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: 'warning', bg: '#FEF3D6', textColor: '#B06000' };
      default:
        return { label: 'Not Started', color: 'secondary', bg: '#F1F3F4', textColor: '#5F6368' };
    }
  };

  const statusConfig = getStatusConfig();

  // Clean description helper
  const cleanDescription = description 
    ? (description.length > 130 ? description.substring(0, 130) + '...' : description)
    : 'No description available for this course.';

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
  };

  if (variant === 'horizontal') {
    return (
      <Card 
        onClick={onView}
        sx={{
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          background: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
          }
        }}
      >
        {/* Course Thumbnail Image Column */}
        <Box 
          sx={{ 
            position: 'relative', 
            width: { xs: '100%', md: '340px' }, 
            height: { xs: 200, md: 'auto' }, 
            minHeight: { md: 240 },
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {thumbnailUrl ? (
            <CardMedia
              component="img"
              image={thumbnailUrl}
              alt={title}
              sx={{ height: '100%', width: '100%', objectFit: 'contain', backgroundColor: '#F8FAFC' }}
            />
          ) : (
            <Box 
              sx={{ 
                height: '100%', 
                background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}
            >
              <MdPlayArrow style={{ fontSize: '4rem', opacity: 0.5 }} />
            </Box>
          )}
          
          {/* Floating Badges */}
          <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Chip 
              label={category || 'General'} 
              size="small"
              sx={{ 
                backgroundColor: '#FFFFFF', 
                color: '#0A66C2', 
                fontWeight: 700, 
                fontSize: '0.75rem',
                height: 26,
                px: 0.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }} 
            />
            {isMandatory && (
              <Chip 
                icon={<MdShield style={{ color: '#FFFFFF', fontSize: '0.9rem' }} />}
                label="Mandatory" 
                size="small"
                sx={{ 
                  backgroundColor: '#DC2626', 
                  color: '#FFFFFF', 
                  fontWeight: 700, 
                  fontSize: '0.75rem',
                  height: 26,
                  px: 0.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '& .MuiChip-icon': {
                    color: '#FFFFFF !important'
                  }
                }} 
              />
            )}
          </Box>

          {/* Bookmark Button */}
          <IconButton
            onClick={handleBookmarkClick}
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              width: 38,
              height: 38,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: '#F8FAFC'
              }
            }}
          >
            {bookmarked ? (
              <MdBookmark style={{ fontSize: '1.25rem', color: '#0A66C2' }} />
            ) : (
              <MdBookmarkBorder style={{ fontSize: '1.25rem', color: '#475569' }} />
            )}
          </IconButton>
        </Box>

        {/* Content Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 3 }}>
          {/* Title & Description */}
          <Typography 
            variant="h5" 
            component="h3"
            sx={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              color: '#1E293B', 
              lineHeight: 1.3,
              mb: 1.5,
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {title}
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748B', 
              mb: 2.5, 
              fontSize: '0.88rem',
              lineHeight: 1.5,
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {cleanDescription}
          </Typography>

          {/* Course Meta Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B' }}>
              <MdAccessTime style={{ fontSize: '1.1rem' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: "'Inter', sans-serif" }}>
                {formatDuration(estimatedMinutes)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748B' }}>
              <MdPeople style={{ fontSize: '1.1rem' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: "'Inter', sans-serif" }}>
                {course.completionCount || 0} complete
              </Typography>
            </Box>
          </Box>

          {/* Progress Bar (For Employees) */}
          {!isAdmin && (
            <Box sx={{ mb: 3, maxWidth: '480px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: statusConfig.textColor, fontSize: '0.8rem' }}>
                  {statusConfig.label}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.8rem' }}>
                  {status === 'COMPLETED' ? '100%' : status === 'IN_PROGRESS' ? '50%' : '0%'}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={status === 'COMPLETED' ? 100 : status === 'IN_PROGRESS' ? 50 : 0} 
                color={statusConfig.color}
                sx={{ 
                  height: 6, 
                  borderRadius: '3px', 
                  backgroundColor: '#F1F5F9',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: '3px'
                  }
                }}
              />
            </Box>
          )}

          {/* Actions Bar */}
          <Box 
            sx={{ 
              mt: 'auto', 
              display: 'flex', 
              gap: 1.5, 
              alignItems: 'center',
              pt: 2.5,
              borderTop: '1px solid #F1F5F9'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Primary Action Button */}
            <Button
              variant={status === 'COMPLETED' ? 'contained' : 'contained'}
              onClick={onView}
              endIcon={<MdArrowForward />}
              sx={{
                background: '#0A66C2',
                color: '#FFFFFF',
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: 'none',
                px: 3.5,
                py: 1,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  background: '#004182',
                  boxShadow: 'none'
                }
              }}
            >
              {status === 'COMPLETED' ? 'Review Course' : status === 'IN_PROGRESS' ? 'Continue Learning' : 'Start Learning'}
            </Button>

            {/* Menu Toggle Button ("...") */}
            <Box>
              <IconButton
                onClick={handleMenuClick}
                sx={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  width: 42,
                  height: 42,
                  backgroundColor: '#FFFFFF',
                  color: '#64748B',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#CBD5E1',
                    backgroundColor: '#F8FAFC'
                  }
                }}
              >
                <MdMoreHoriz style={{ fontSize: '1.25rem' }} />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #F1F5F9',
                    minWidth: 160
                  }
                }}
              >
                <MenuItem 
                  onClick={(e) => {
                    handleMenuClose(e);
                    onView();
                  }}
                  sx={{ py: 1.2, px: 2, fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}
                >
                  View Details
                </MenuItem>
                
                {isAdmin && [
                  <MenuItem 
                    key="edit"
                    onClick={(e) => {
                      handleMenuClose(e);
                      onEdit();
                    }}
                    sx={{ py: 1.2, px: 2, fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}
                  >
                    Edit Course
                  </MenuItem>,
                  <MenuItem 
                    key="progress"
                    onClick={(e) => {
                      handleMenuClose(e);
                      onManageProgress();
                    }}
                    sx={{ py: 1.2, px: 2, fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}
                  >
                    Manage Progress
                  </MenuItem>,
                  <MenuItem 
                    key="delete"
                    onClick={(e) => {
                      handleMenuClose(e);
                      onDelete();
                    }}
                    sx={{ 
                      py: 1.2, 
                      px: 2, 
                      fontSize: '0.85rem', 
                      fontWeight: 500, 
                      color: '#DC2626',
                      fontFamily: "'Inter', sans-serif",
                      '&:hover': { backgroundColor: '#FEF2F2' }
                    }}
                  >
                    Delete Course
                  </MenuItem>
                ]}
              </Menu>
            </Box>
          </Box>
        </Box>
      </Card>
    );
  }

  // Default Vertical Card Variant (Dashboard Grids)
  return (
    <Card 
      onClick={onView}
      sx={{
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        background: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(10, 102, 194, 0.05)',
          borderColor: '#B3D4FF'
        }
      }}
    >
      {/* Course Thumbnail */}
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
        {thumbnailUrl ? (
          <CardMedia
            component="img"
            image={thumbnailUrl}
            alt={title}
            sx={{ height: '100%', width: '100%', objectFit: 'contain', backgroundColor: '#F8FAFC' }}
          />
        ) : (
          <Box 
            sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569'
            }}
          >
            <MdPlayArrow style={{ fontSize: '2.5rem', opacity: 0.6 }} />
          </Box>
        )}
        
        {/* Floating Badges */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Chip 
            label={category || 'General'} 
            size="small"
            sx={{ 
              backgroundColor: '#FFFFFF', 
              color: '#0A66C2', 
              fontWeight: 700, 
              fontSize: '0.7rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              height: 20,
              borderRadius: '4px',
              px: 0.2
            }} 
          />
          {isMandatory && (
            <Chip 
              label="Mandatory" 
              size="small"
              sx={{ 
                backgroundColor: '#DC2626', 
                color: '#FFFFFF', 
                fontWeight: 700, 
                fontSize: '0.7rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                height: 20,
                borderRadius: '4px',
                px: 0.2
              }} 
            />
          )}
        </Box>
      </Box>

      {/* Course Content */}
      <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
        <Typography 
          variant="h6" 
          component="h3"
          sx={{ 
            fontSize: '1rem', 
            fontWeight: 750, 
            color: '#1E293B', 
            lineHeight: 1.35,
            mb: 1,
            minHeight: '2.5rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {title}
        </Typography>

        <Typography 
          variant="body2" 
          sx={{ 
            color: '#64748B', 
            mb: 2, 
            fontSize: '0.82rem',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {cleanDescription}
        </Typography>

        {/* Course Meta Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
            <MdAccessTime style={{ fontSize: '0.95rem' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: "'Inter', sans-serif" }}>
              {formatDuration(estimatedMinutes)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
            <MdPeople style={{ fontSize: '0.95rem' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: "'Inter', sans-serif" }}>
              {course.completionCount || 0} complete
            </Typography>
          </Box>
        </Box>

        {/* Progress Bar (For Employees) */}
        {!isAdmin && (
          <Box sx={{ mt: 'auto', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: statusConfig.textColor, fontSize: '0.75rem' }}>
                {statusConfig.label}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.75rem' }}>
                {status === 'COMPLETED' ? '100%' : status === 'IN_PROGRESS' ? '50%' : '0%'}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={status === 'COMPLETED' ? 100 : status === 'IN_PROGRESS' ? 50 : 0} 
              color={statusConfig.color}
              sx={{ 
                height: 6, 
                borderRadius: '3px', 
                backgroundColor: '#F1F5F9',
                '& .MuiLinearProgress-bar': {
                  borderRadius: '3px',
                  backgroundColor: status === 'COMPLETED' ? '#10B981' : status === 'IN_PROGRESS' ? '#F97316' : '#94A3B8'
                }
              }}
            />
          </Box>
        )}

        {/* Actions Bar */}
        <Box 
          sx={{ 
            mt: isAdmin ? 'auto' : 0, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pt: 1.5,
            borderTop: '1px solid #F1F5F9'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isAdmin ? (
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={onEdit}
                sx={{ 
                  flex: 1, 
                  textTransform: 'none', 
                  borderColor: '#E2E8F0', 
                  color: '#475569',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  py: 0.5,
                  '&:hover': {
                    borderColor: '#CBD5E1',
                    backgroundColor: '#F8FAFC'
                  }
                }}
              >
                Edit
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={onManageProgress}
                sx={{ 
                  flex: 1, 
                  textTransform: 'none', 
                  borderColor: '#E2E8F0', 
                  color: '#0A66C2',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  py: 0.5,
                  '&:hover': {
                    borderColor: '#B3D4FF',
                    backgroundColor: '#F0F7FF'
                  }
                }}
              >
                Progress
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                color="error" 
                onClick={onDelete}
                sx={{ 
                  minWidth: '30px', 
                  p: 0, 
                  borderColor: '#FCA5A5', 
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: '#FEF2F2'
                  }
                }}
              >
                🗑
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={onView}
              sx={{
                background: '#0A66C2',
                color: '#FFFFFF',
                borderColor: '#0A66C2',
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                boxShadow: 'none',
                py: 0.9,
                '&:hover': {
                  background: '#004182',
                  borderColor: '#0A66C2',
                  boxShadow: 'none'
                }
              }}
            >
              {status === 'COMPLETED' ? 'Review' : status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
