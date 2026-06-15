import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Box, Typography, Button, Paper, Card, CardContent, Divider, Chip, CircularProgress } from '@mui/material';
import { MdArrowBack, MdAccessTime, MdCalendarToday, MdWorkspacePremium, MdOutlineLibraryBooks, MdStar, MdLaunch, MdCheckCircle, MdPlayArrow } from 'react-icons/md';
import { formatDuration } from '../../utils/format';
import ResourceCard from './Shared/ResourceCard';
import EmptyState from './Shared/EmptyState';
import SkeletonLoader from './Shared/SkeletonLoader';
import api from '../../utils/api';
import Swal from 'sweetalert2';

const CourseDetails = ({
  materials = [],
  loading = false,
  onProgressUpdate,
  onDownloadMaterial,
  onDownloadAdditional,
  onDownloadCertificate,
  user
}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [playerContent, setPlayerContent] = useState(null); // { url, type, title, isExternal }
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progressRecords, setProgressRecords] = useState([]);

  const course = materials.find(m => m._id === id);

  // Reset play state when changing courses
  useEffect(() => {
    setPlaying(false);
  }, [id]);

  useEffect(() => {
    if (course) {
      if (course.s3Url) {
        setLoadingPlayer(true);
        api.get(`/api/training/${course._id}/download?preview=true`)
          .then(res => {
            setPlayerContent({
              url: res.data.downloadUrl,
              type: course.mimeType || 'video/mp4',
              title: course.originalName || 'Main Course Lecture'
            });
          })
          .catch(() => {
            setPlayerContent({
              url: course.s3Url,
              type: course.mimeType || 'video/mp4',
              title: course.originalName || 'Main Course Lecture'
            });
          })
          .finally(() => setLoadingPlayer(false));
      } else if (course.externalUrl) {
        setPlayerContent({
          url: course.externalUrl,
          type: 'text/html',
          title: 'External Resource (Link)',
          isExternal: true
        });
      } else if (course.additionalFiles && course.additionalFiles.length > 0) {
        const firstFile = course.additionalFiles[0];
        setLoadingPlayer(true);
        api.get(`/api/training/${course._id}/download-additional/0?preview=true`)
          .then(res => {
            setPlayerContent({
              url: res.data.downloadUrl,
              type: firstFile.mimeType || 'application/octet-stream',
              title: firstFile.originalName || 'Attachment #1'
            });
          })
          .catch(() => {
            setPlayerContent({
              url: firstFile.s3Url,
              type: firstFile.mimeType || 'application/octet-stream',
              title: firstFile.originalName || 'Attachment #1'
            });
          })
          .finally(() => setLoadingPlayer(false));
      } else {
        setPlayerContent(null);
      }
    }
  }, [id]);

  useEffect(() => {
    if (course && ['HR', 'ADMIN', 'MANAGER'].includes(user?.role)) {
      api.get(`/api/training/${course._id}/progress`)
        .then(res => setProgressRecords(res.data))
        .catch(() => { });
    }
  }, [id, user]);

  if (loading || !course) {
    return <SkeletonLoader type="details" />;
  }

  const { title, description, category, estimatedMinutes, isMandatory, progress, dueDate, additionalFiles = [] } = course;
  const status = progress?.status || 'NOT_STARTED';

  const totalLessons = 1 + additionalFiles.length; // Main lesson + attachments
  const hasPlayableContent = Boolean(playerContent || course.s3Url || course.externalUrl);

  const handleStartPlay = async (e) => {
    if (e) e.stopPropagation();
    if (hasPlayableContent) {
      setPlaying(true);
      if (status === 'NOT_STARTED') {
        try {
          await onProgressUpdate(course._id, 'IN_PROGRESS');
        } catch (err) { }
      }
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Course Preview Info',
        text: 'This course has no main video. Please review the details and attachments below.',
        confirmButtonColor: '#0A66C2'
      });
    }
  };

  const handleVideoPlay = async () => {
    if (status === 'NOT_STARTED') {
      try {
        await onProgressUpdate(course._id, 'IN_PROGRESS');
      } catch (err) { }
    }
  };

  const handleVideoEnded = async () => {
    if (status !== 'COMPLETED') {
      try {
        await onProgressUpdate(course._id, 'COMPLETED');
        Swal.fire({
          icon: 'success',
          title: 'Course Completed!',
          text: 'Course marked as completed automatically!',
          confirmButtonColor: '#10B981'
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Failed to update progress automatically',
          confirmButtonColor: '#0A66C2'
        });
      }
    }
  };

  const handleToggleComplete = async () => {
    if (status === 'NOT_STARTED') {
      await onProgressUpdate(course._id, 'IN_PROGRESS');
    } else if (status === 'IN_PROGRESS') {
      await onProgressUpdate(course._id, 'COMPLETED');
    }
  };

  const handlePreviewAttachment = async (file, index) => {
    setLoadingPlayer(true);
    try {
      const res = await api.get(`/api/training/${course._id}/download-additional/${index}?preview=true`);
      setPlayerContent({
        url: res.data.downloadUrl,
        type: file.mimeType || 'application/octet-stream',
        title: file.originalName || `Attachment #${index + 1}`
      });
      setPlaying(true); // Automatically trigger active viewing mode

      // Auto set in progress if not started
      if (status === 'NOT_STARTED') {
        await onProgressUpdate(course._id, 'IN_PROGRESS');
      }

      // Scroll to player smoothly
      window.scrollTo({ top: 80, behavior: 'smooth' });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Unable to fetch preview link',
        confirmButtonColor: '#0A66C2'
      });
    } finally {
      setLoadingPlayer(false);
    }
  };

  return (
    <Box sx={{ mt: -2 }}>
      {/* Back Button */}
      <Button
        startIcon={<MdArrowBack />}
        onClick={() => navigate('/training/catalog')}
        sx={{
          color: '#475569',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.85rem',
          mb: 3,
          fontFamily: "'Inter', sans-serif",
          '&:hover': {
            backgroundColor: '#F1F5F9'
          }
        }}
      >
        Back to Browse Courses
      </Button>

      {/* Main Single Card Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          mb: 4
        }}
      >
        {/* Top Media Player Area */}
        <Box sx={{ backgroundColor: '#0F172A', position: 'relative', width: '100%', minHeight: { xs: 240, sm: 380, md: 480 } }}>
          {loadingPlayer ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 380, color: '#FFFFFF' }}>
              <CircularProgress size={40} sx={{ color: '#0A66C2', mb: 2 }} />
              <Typography variant="body2">Loading media player...</Typography>
            </Box>
          ) : !playing ? (
            /* Thumbnail / Poster mode before click to play */
            <Box sx={{ width: '100%', height: '100%', minHeight: { xs: 240, sm: 380, md: 480 }, position: 'relative', overflow: 'hidden' }}>
              {course.thumbnailUrl ? (
                <Box
                  component="img"
                  src={course.thumbnailUrl}
                  alt={title}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', top: 0, left: 0 }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              )}

              {/* Active File Title Banner */}
              {playerContent && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#FFFFFF',
                    px: 1.5,
                    py: 0.8,
                    borderRadius: '8px',
                    backdropFilter: 'blur(4px)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    zIndex: 2
                  }}
                >
                  Selected File: {playerContent.title}
                </Box>
              )}

              {/* Dark Play Overlay */}
              {hasPlayableContent && (
                <Box
                  onClick={handleStartPlay}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.25s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(15, 23, 42, 0.45)'
                    }
                  }}
                >
                  {/* YouTube-style Play Button */}
                  <Box
                    sx={{
                      width: 76,
                      height: 52,
                      backgroundColor: '#FF0000',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                      transition: 'transform 0.2s ease, background-color 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#E60000',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <MdPlayArrow style={{ fontSize: '2.4rem', color: '#FFFFFF', marginLeft: '2px' }} />
                  </Box>
                </Box>
              )}
            </Box>
          ) : playerContent ? (
            /* Active Media Player */
            playerContent.isExternal ? (
              <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 380, color: '#FFFFFF', textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  {playerContent.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3, maxWidth: 450 }}>
                  This resource is hosted on an external platform. Click the link below to open the guide.
                </Typography>
                <Button
                  variant="contained"
                  href={playerContent.url}
                  target="_blank"
                  endIcon={<MdLaunch />}
                  sx={{ textTransform: 'none', backgroundColor: '#0A66C2', '&:hover': { backgroundColor: '#004182' }, borderRadius: '8px', px: 4, py: 1.2 }}
                >
                  Open External Link
                </Button>
              </Box>
            ) : playerContent.type.includes('video') ? (
              <video
                src={playerContent.url}
                controls
                autoPlay
                onPlay={handleVideoPlay}
                onEnded={handleVideoEnded}
                style={{ width: '100%', height: '100%', maxHeight: '480px', display: 'block', objectFit: 'contain' }}
              />
            ) : playerContent.type.includes('pdf') ? (
              <iframe
                src={playerContent.url}
                title={playerContent.title}
                style={{ width: '100%', height: '480px', border: 'none', display: 'block' }}
              />
            ) : (
              <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 380, color: '#FFFFFF', textAlign: 'center' }}>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Preview not supported directly in player for {playerContent.title}.
                </Typography>
                <Button
                  variant="contained"
                  href={playerContent.url}
                  target="_blank"
                  sx={{ textTransform: 'none', backgroundColor: '#0A66C2', '&:hover': { backgroundColor: '#004182' }, borderRadius: '8px', px: 3, py: 1 }}
                >
                  Download File
                </Button>
              </Box>
            )
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 380, color: '#FFFFFF' }}>
              <Typography variant="body2">No course content available for playback.</Typography>
            </Box>
          )}
        </Box>

        {/* Course Details Block */}
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Title */}
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 800,
              color: '#1E293B',
              mb: 2,
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontSize: { xs: '1.6rem', sm: '2rem' }
            }}
          >
            {title}
          </Typography>

          {/* Metadata Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, mb: 3.5, flexWrap: 'wrap' }}>
            <Chip
              label={category || 'General'}
              size="small"
              sx={{
                fontWeight: 700,
                color: '#E11D48',
                backgroundColor: '#FFF1F2',
                border: '1px solid #FFE4E6',
                borderRadius: '6px',
                height: 24,
                fontSize: '0.75rem'
              }}
            />
            {isMandatory && (
              <Chip
                label="Required"
                size="small"
                sx={{
                  fontWeight: 700,
                  color: '#FFFFFF',
                  backgroundColor: '#DC2626',
                  borderRadius: '6px',
                  height: 24,
                  fontSize: '0.75rem'
                }}
              />
            )}

            {/* Star Rating Mock */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
              <MdStar style={{ fontSize: '1.1rem', color: '#F59E0B' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                4.8 (1,250 ratings)
              </Typography>
            </Box>

            {/* Duration */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
              <MdAccessTime style={{ fontSize: '1.1rem' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                {formatDuration(estimatedMinutes)}
              </Typography>
            </Box>

            {/* Lessons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
              <MdOutlineLibraryBooks style={{ fontSize: '1.1rem' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                {totalLessons} Lessons
              </Typography>
            </Box>

            {/* Due Date */}
            {dueDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                <MdCalendarToday style={{ fontSize: '1.1rem' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                  Due: {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              color: '#334155',
              mb: 3,
              lineHeight: 1.6,
              fontSize: '0.92rem',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {description || 'This course covers core concepts to enhance your professional toolkit.'}
          </Typography>

          {/* Creator Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
            <Box sx={{ display: 'flex', p: 0.5, borderRadius: '50%', backgroundColor: '#F0F7FF', color: '#0A66C2' }}>
              <MdWorkspacePremium style={{ fontSize: '1.3rem' }} />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
              Created by <span style={{ color: '#0A66C2', fontWeight: 600, cursor: 'pointer' }}>Luminoid Technology </span>
            </Typography>
          </Box>

          <Divider sx={{ my: 3.5 }} />

          {/* Course Progress & Manual Actions block */}
          {user?.role?.toUpperCase() === 'EMPLOYEE' && (
            <Box
              sx={{
                p: 3,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: "'Inter', sans-serif" }}>
                  Course Status:
                </Typography>
                <Chip
                  label={status === 'COMPLETED' ? 'Completed' : status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                  color={status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'warning' : 'default'}
                  icon={status === 'COMPLETED' ? <MdCheckCircle /> : undefined}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.75rem', px: 0.5 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {/* Manual Progress Toggle Button */}
                {status !== 'COMPLETED' && (
                  <Button
                    variant={status === 'NOT_STARTED' ? 'outlined' : 'contained'}
                    onClick={handleToggleComplete}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      px: 3,
                      py: 1,
                      boxShadow: 'none',
                      background: status === 'NOT_STARTED' ? 'transparent' : '#0A66C2',
                      color: status === 'NOT_STARTED' ? '#0A66C2' : '#FFFFFF',
                      borderColor: '#0A66C2',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: status === 'NOT_STARTED' ? '#F0F7FF' : '#004182',
                        borderColor: '#0A66C2',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {status === 'NOT_STARTED' ? 'Mark In Progress' : 'Mark Complete'}
                  </Button>
                )}

                {/* Certificate Download Action */}
                {status === 'COMPLETED' && progress?.certificate ? (
                  <Button
                    variant="contained"
                    onClick={() => onDownloadCertificate(course._id)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      px: 3,
                      py: 1,
                      boxShadow: 'none',
                      background: '#10B981',
                      color: '#FFFFFF',
                      '&:hover': {
                        background: '#059669',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Download Certificate
                  </Button>
                ) : status === 'COMPLETED' && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                    ⚠️ Certificate awaiting manager upload.
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Supplementary Attachments List */}
          {additionalFiles.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#1E293B',
                  mb: 2.5,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.1rem'
                }}
              >
                Supplementary Attachments & Resources
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {additionalFiles.map((file, idx) => (
                  <ResourceCard
                    key={idx}
                    title={file.originalName}
                    mimeType={file.mimeType}
                    size={file.size}
                    onPreview={() => handlePreviewAttachment(file, idx)}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Paper>
    </Box>
  );
};

export default CourseDetails;
