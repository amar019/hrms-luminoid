import React, { useState, useMemo } from 'react';
import { Grid, TextField, InputAdornment, Box, Chip, Paper, Typography } from '@mui/material';
import { MdSearch, MdApps, MdAccessTime, MdCached, MdCheckCircle, MdLayers } from 'react-icons/md';
import CourseCard from './Shared/CourseCard';
import EmptyState from './Shared/EmptyState';
import SkeletonLoader from './Shared/SkeletonLoader';

const CourseCatalog = ({ 
  materials = [], 
  loading = false, 
  onViewCourse,
  onEditCourse,
  onDeleteCourse,
  onManageProgress,
  isAdmin 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Unified Categories
  const categoriesList = ['All', 'Mandatory', 'Technical', 'HR', 'Compliance', 'Sales', 'Management'];

  const statusList = [
    { value: 'All', label: 'All Statuses', icon: MdApps },
    { value: 'NOT_STARTED', label: 'Not Started', icon: MdAccessTime },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: MdCached },
    { value: 'COMPLETED', label: 'Completed', icon: MdCheckCircle }
  ];

  // Filtering Logic
  const filteredMaterials = useMemo(() => {
    return materials.filter(course => {
      const matchSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const courseCat = course.category?.toLowerCase() || '';
      let matchCategory = true;
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Mandatory') {
          matchCategory = course.isMandatory;
        } else {
          matchCategory = courseCat === selectedCategory.toLowerCase();
        }
      }

      const courseStatus = course.progress?.status || 'NOT_STARTED';
      const matchStatus = selectedStatus === 'All' || courseStatus === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [materials, searchQuery, selectedCategory, selectedStatus]);

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <SkeletonLoader type="card" count={4} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Sticky Filter Bar Paper Container */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Search Bar Input */}
          <Grid item xs={12} lg={6.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search course title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch style={{ fontSize: '1.25rem', color: '#94A3B8' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  height: 40,
                  '& fieldset': {
                    borderColor: '#E2E8F0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#CBD5E1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#0A66C2',
                  }
                }
              }}
            />
          </Grid>
          
          {/* Status Dropdown/Selector */}
          <Grid item xs={12} lg={5.5}>
            <Box sx={{ display: 'flex', gap: 1.2, overflowX: 'auto', py: 0.5, flexWrap: 'wrap' }}>
              {statusList.map(item => {
                const isSelected = selectedStatus === item.value;
                const IconComponent = item.icon;
                return (
                  <Chip
                    key={item.value}
                    icon={<IconComponent style={{ color: isSelected ? '#FFFFFF' : '#64748B', fontSize: '1rem' }} />}
                    label={item.label}
                    clickable
                    onClick={() => setSelectedStatus(item.value)}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      height: 40,
                      px: 0.8,
                      textTransform: 'none',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? '#0A66C2' : '#E2E8F0',
                      backgroundColor: isSelected ? '#0A66C2' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: isSelected ? '#004182' : '#F8FAFC',
                        borderColor: isSelected ? '#004182' : '#CBD5E1'
                      },
                      '& .MuiChip-icon': {
                        marginLeft: '4px'
                      },
                      '& .MuiChip-label': {
                        paddingLeft: '6px',
                        paddingRight: '6px'
                      }
                    }}
                  />
                );
              })}
            </Box>
          </Grid>
        </Grid>

        {/* Category Filters Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.8, fontFamily: "'Inter', sans-serif" }}>
            <MdLayers style={{ fontSize: '1.15rem' }} /> Categories:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
            {categoriesList.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <Chip
                  key={cat}
                  label={cat}
                  clickable
                  onClick={() => setSelectedCategory(cat)}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    height: 32,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: isSelected ? '#0A66C2' : '#E2E8F0',
                    backgroundColor: isSelected ? '#0A66C2' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#475569',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isSelected ? '#004182' : '#F1F5F9',
                      borderColor: isSelected ? '#004182' : '#CBD5E1'
                    }
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </Paper>

      {/* Catalog Results Grid */}
      {filteredMaterials.length === 0 ? (
        <EmptyState 
          title="No courses matched your filters" 
          description="Try broadening your keywords or resetting your category selections."
          actionText="Reset Filters"
          actionVariant="outlined"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            setSelectedStatus('All');
          }}
        />
      ) : (
        <Grid container spacing={3.5}>
          {filteredMaterials.map(course => (
            <Grid item xs={12} key={course._id}>
              <CourseCard 
                variant="horizontal"
                course={course} 
                onView={() => onViewCourse(course._id)}
                onEdit={() => onEditCourse(course)}
                onDelete={() => onDeleteCourse(course._id)}
                onManageProgress={() => onManageProgress(course)}
                isAdmin={isAdmin}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CourseCatalog;
