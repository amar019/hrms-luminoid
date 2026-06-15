import React from 'react';
import { Card, CardContent, Typography, Box, Button, Chip } from '@mui/material';
import { MdVerified, MdFileDownload, MdLaunch } from 'react-icons/md';

const CertificateCard = ({ courseTitle, completionDate, onDownload, onPreview }) => {
  const formattedDate = completionDate 
    ? new Date(completionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Recently';

  return (
    <Card
      sx={{
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        borderTop: '4px solid #0A66C2',
        boxShadow: 'none',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.04)'
        }
      }}
    >
      <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Certificate Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Chip
            icon={<MdVerified style={{ color: '#0A66C2', fontSize: '1rem' }} />}
            label="Verified Credential"
            size="small"
            sx={{
              backgroundColor: '#E6F0FA',
              color: '#0A66C2',
              fontWeight: 600,
              fontSize: '0.72rem',
              height: 22,
              px: 0.5,
              '& .MuiChip-icon': {
                color: '#0A66C2 !important',
                marginLeft: '4px'
              },
              '& .MuiChip-label': {
                paddingLeft: '4px',
                paddingRight: '6px'
              }
            }}
          />
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>
            Luminaid LMS
          </Typography>
        </Box>

        {/* Certificate Body */}
        <Typography
          variant="h6"
          sx={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#1E293B',
            mb: 1.5,
            lineHeight: 1.4,
            minHeight: '2.8rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {courseTitle}
        </Typography>

        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', mb: 2.5, fontFamily: "'Inter', sans-serif" }}>
          Earned on: {formattedDate}
        </Typography>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 1.5, borderTop: '1px solid #F1F5F9', alignItems: 'center' }}>
          {onPreview && (
            <Button
              variant="text"
              size="small"
              fullWidth={!onDownload}
              onClick={onPreview}
              endIcon={<MdLaunch />}
              sx={{
                textTransform: 'none',
                color: '#0A66C2',
                fontWeight: 600,
                fontSize: '0.82rem',
                fontFamily: "'Inter', sans-serif",
                justifyContent: onDownload ? 'flex-start' : 'space-between',
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  background: 'transparent',
                  color: '#004182'
                },
                '& .MuiButton-endIcon': {
                  marginLeft: 'auto'
                }
              }}
            >
              View Certificate
            </Button>
          )}
          {onDownload && (
            <Button
              variant="contained"
              size="small"
              onClick={onDownload}
              startIcon={<MdFileDownload />}
              sx={{
                textTransform: 'none',
                background: '#0A66C2',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.8rem',
                boxShadow: 'none',
                ml: onPreview ? 'auto' : 0,
                px: 2,
                py: 0.6,
                fontFamily: "'Inter', sans-serif",
                '&:hover': {
                  background: '#004182',
                  boxShadow: 'none'
                }
              }}
            >
              Download
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
