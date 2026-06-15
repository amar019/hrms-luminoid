import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { MdSchool, MdArrowForward } from 'react-icons/md';

const EmptyState = ({ 
  icon: Icon = MdSchool, 
  imageSrc,
  title = "No Content Available", 
  description = "Check back later or adjust your filters.", 
  actionText, 
  actionVariant = 'contained',
  onAction 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 2rem',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: 'none',
        minHeight: '220px',
        width: '100%',
        my: 2
      }}
    >
      {imageSrc ? (
        <Box 
          component="img"
          src={imageSrc}
          alt={title}
          sx={{ 
            width: 120, 
            height: 120, 
            objectFit: 'contain',
            mb: 2.5
          }}
        />
      ) : (
        <Box 
          sx={{ 
            fontSize: '3.5rem', 
            color: '#94A3B8', 
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon />
        </Box>
      )}
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700, 
          color: '#1E293B', 
          mb: 1,
          fontFamily: "'Inter', sans-serif",
          fontSize: '1.05rem'
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#64748B', 
          maxWidth: '350px', 
          mb: actionText ? 3 : 0,
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.5,
          fontSize: '0.85rem'
        }}
      >
        {description}
      </Typography>
      {actionText && onAction && (
        <Button
          variant={actionVariant}
          onClick={onAction}
          endIcon={<MdArrowForward />}
          sx={
            actionVariant === 'outlined'
              ? {
                  borderColor: '#E2E8F0',
                  color: '#0A66C2',
                  background: '#FFFFFF',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3,
                  py: 0.8,
                  boxShadow: 'none',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#0A66C2',
                    background: '#F0F7FF',
                    boxShadow: 'none'
                  }
                }
              : {
                  background: '#0A66C2',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3,
                  py: 0.8,
                  boxShadow: 'none',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: '#004182',
                    boxShadow: 'none'
                  }
                }
          }
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
