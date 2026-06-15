import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { MdFileDownload, MdLaunch, MdPictureAsPdf, MdVideocam, MdInsertDriveFile, MdLink } from 'react-icons/md';

const ResourceCard = ({ title, mimeType, size, onDownload, onPreview, isExternal }) => {
  const getFileIconAndColor = () => {
    if (isExternal) return { icon: MdLink, color: '#0A66C2', bg: '#F0F7FF', label: 'External Link' };
    
    const mt = mimeType?.toLowerCase() || '';
    if (mt.includes('pdf')) {
      return { icon: MdPictureAsPdf, color: '#DC2626', bg: '#FEF2F2', label: 'PDF Document' };
    } else if (mt.includes('video') || mt.includes('mp4') || mt.includes('mov')) {
      return { icon: MdVideocam, color: '#7C3AED', bg: '#F5F3FF', label: 'Video Lecture' };
    } else if (mt.includes('ms-powerpoint') || mt.includes('presentation')) {
      return { icon: MdInsertDriveFile, color: '#EA580C', bg: '#FFF7ED', label: 'PowerPoint Presentation' };
    } else {
      return { icon: MdInsertDriveFile, color: '#0D9488', bg: '#F0FDFA', label: 'Attachment File' };
    }
  };

  const fileConfig = getFileIconAndColor();
  const Icon = fileConfig.icon;

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        mb: 1.5,
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: '#CBD5E1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }
      }}
    >
      {/* Left Details */}
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, mr: 2 }}>
        <Box 
          sx={{ 
            width: 44, 
            height: 44, 
            borderRadius: '8px', 
            backgroundColor: fileConfig.bg, 
            color: fileConfig.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0,
            mr: 2
          }}
        >
          <Icon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600, 
              color: '#1E293B', 
              fontSize: '0.9rem',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.75rem', fontFamily: "'Inter', sans-serif" }}>
              {fileConfig.label}
            </Typography>
            {size && (
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.75rem', fontFamily: "'Inter', sans-serif" }}>
                • {formatSize(size)}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Right Action Trigger Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {onPreview && (
          <Button
            variant="outlined"
            size="small"
            onClick={onPreview}
            sx={{
              textTransform: 'none',
              borderColor: '#E2E8F0',
              color: '#475569',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: "'Inter', sans-serif",
              '&:hover': {
                borderColor: '#CBD5E1',
                backgroundColor: '#F8FAFC'
              }
            }}
          >
            {isExternal ? 'Launch' : 'Open'}
          </Button>
        )}
        {!isExternal && onDownload && (
          <IconButton
            size="small"
            onClick={onDownload}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              color: '#475569',
              p: '6px',
              '&:hover': {
                backgroundColor: '#F8FAFC',
                borderColor: '#CBD5E1'
              }
            }}
          >
            <MdFileDownload size={18} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default ResourceCard;
