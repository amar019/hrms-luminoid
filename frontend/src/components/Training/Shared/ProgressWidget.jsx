import React from 'react';
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material';

const ProgressWidget = ({ 
  type = 'linear', 
  value = 0, 
  title = "Overall Completion", 
  subtitle,
  size = 80,
  thickness = 5,
  color = 'primary'
}) => {
  const roundedValue = Math.min(100, Math.max(0, Math.round(value)));

  if (type === 'circular') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={size}
            thickness={thickness}
            sx={{ color: '#E2E8F0' }}
          />
          <CircularProgress
            variant="determinate"
            value={roundedValue}
            size={size}
            thickness={thickness}
            color={color}
            sx={{
              position: 'absolute',
              left: 0,
              strokeLinecap: 'round'
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              sx={{ fontWeight: 700, fontSize: size > 70 ? '1rem' : '0.8rem', color: '#1E293B', fontFamily: "'Inter', sans-serif" }}
            >
              {roundedValue}%
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', mt: 0.25, fontFamily: "'Inter', sans-serif" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif" }}>
          {title}
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A66C2', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif" }}>
          {roundedValue}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={roundedValue}
        color={color}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: '#F1F5F9',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4
          }
        }}
      />
      {subtitle && (
        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.75, fontSize: '0.75rem', fontFamily: "'Inter', sans-serif" }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default ProgressWidget;
