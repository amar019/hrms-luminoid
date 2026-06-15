import React from 'react';
import { Grid, Card, CardContent, Skeleton, Box } from '@mui/material';

const SkeletonLoader = ({ type = 'card', count = 3 }) => {
  if (type === 'list') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from(new Array(count)).map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: '6px', mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="text" width="20%" height={16} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '6px' }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (type === 'details') {
    return (
      <Box sx={{ width: '100%', mt: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={260} sx={{ borderRadius: '12px', mb: 4 }} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="90%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="95%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 4 }} />

            <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: '8px', mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: '8px', mb: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none', p: 2 }}>
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
              <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto', mb: 3 }} />
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: '8px' }} />
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {Array.from(new Array(count)).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Skeleton variant="rectangular" width="100%" height={160} />
            <CardContent>
              <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={16} sx={{ mb: 3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: '8px' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SkeletonLoader;
