import React, { useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, Button, Chip, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MdWorkspacePremium, MdEmojiEvents, MdArrowForward, MdShowChart, MdChevronRight } from 'react-icons/md';
import ProgressWidget from './Shared/ProgressWidget';
import CourseCard from './Shared/CourseCard';
import CertificateCard from './Shared/CertificateCard';
import EmptyState from './Shared/EmptyState';

const MyLearning = ({ 
  materials = [], 
  myStats, 
  leaderboard = [], 
  onViewCourse,
  onDownloadCertificate
}) => {
  const navigate = useNavigate();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // Group materials
  const inProgressCourses = materials.filter(m => m.progress?.status === 'IN_PROGRESS');
  const mandatoryCourses = materials.filter(m => m.isMandatory && m.progress?.status !== 'COMPLETED');
  const recommendedCourses = materials.filter(m => m.progress?.status === 'NOT_STARTED' && !m.isMandatory);
  
  // Completed courses
  const completedCourses = materials.filter(m => m.progress?.status === 'COMPLETED');
  
  // Calculate completion percentage
  const totalCoursesCount = materials.length;
  const completedCoursesCount = completedCourses.length;
  const completionPercentage = totalCoursesCount > 0 
    ? (completedCoursesCount / totalCoursesCount) * 100 
    : 0;

  return (
    <Grid container spacing={4}>
      {/* Main Learning Content Area (Left 8.5 Columns) */}
      <Grid item xs={12} md={8.5}>
        {/* Progress Overview Banner */}
        <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 4, p: 2, backgroundColor: '#FFFFFF' }}>
          <CardContent sx={{ p: '8px !important', '&:last-child': { pb: '8px !important' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
              {/* Circular Progress + Title */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <ProgressWidget 
                  type="circular" 
                  value={completionPercentage} 
                  title="Your Progress" 
                  subtitle={`${completedCoursesCount} of ${totalCoursesCount} courses completed`}
                  size={84}
                  thickness={6}
                />
              </Box>
              
              {/* Metrics Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 } }}>
                <Divider orientation="vertical" flexItem sx={{ height: 40, alignSelf: 'center', borderColor: '#E2E8F0' }} />
                <Box sx={{ textAlign: 'center', minWidth: 65 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0A66C2', fontFamily: "'Inter', sans-serif" }}>
                    {totalCoursesCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mt: 0.5 }}>
                    Assigned
                  </Typography>
                </Box>
                
                <Divider orientation="vertical" flexItem sx={{ height: 40, alignSelf: 'center', borderColor: '#E2E8F0' }} />
                <Box sx={{ textAlign: 'center', minWidth: 65 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981', fontFamily: "'Inter', sans-serif" }}>
                    {completedCoursesCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mt: 0.5 }}>
                    Completed
                  </Typography>
                </Box>
                
                <Divider orientation="vertical" flexItem sx={{ height: 40, alignSelf: 'center', borderColor: '#E2E8F0' }} />
                <Box sx={{ textAlign: 'center', minWidth: 65 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#F59E0B', fontFamily: "'Inter', sans-serif" }}>
                    {inProgressCourses.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mt: 0.5 }}>
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 1. Continue Learning */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: "'Inter', sans-serif" }}>
              Continue Learning
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/training/catalog')}
              endIcon={<MdArrowForward />}
              sx={{ textTransform: 'none', color: '#0A66C2', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Browse Catalog
            </Button>
          </Box>
          {inProgressCourses.length === 0 ? (
            <EmptyState 
              imageSrc="/assets/lms_books.png"
              title="No courses in progress" 
              description="Browse the catalog and pick a course to begin your learning journey." 
              actionText="Browse Courses"
              actionVariant="contained"
              onAction={() => navigate('/training/catalog')}
            />
          ) : (
            <Grid container spacing={3}>
              {inProgressCourses.map(course => (
                <Grid item xs={12} key={course._id}>
                  <CourseCard 
                    variant="horizontal"
                    course={course} 
                    onView={() => onViewCourse(course._id)} 
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* 2. Mandatory Training */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: "'Inter', sans-serif" }}>
              Mandatory Training
            </Typography>
            <Chip 
              label="Pending" 
              size="small" 
              sx={{ 
                fontWeight: 600, 
                fontSize: '0.75rem', 
                height: 22, 
                backgroundColor: '#FFF1F2', 
                color: '#E11D48', 
                border: '1px solid #FFE4E6',
                borderRadius: '6px'
              }} 
            />
          </Box>
          {mandatoryCourses.length === 0 ? (
            <EmptyState 
              imageSrc="/assets/lms_medal.png"
              title="All caught up!" 
              description="No outstanding mandatory trainings are currently assigned to you." 
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {mandatoryCourses.map(course => {
                const isOverdue = course.dueDate && new Date(course.dueDate) < new Date();
                return (
                  <Card key={course._id} sx={{ borderRadius: '12px', border: '1px solid #FCA5A5', boxShadow: 'none', p: 2.5, background: '#FFF5F5' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#991B1B', fontFamily: "'Inter', sans-serif" }}>
                          {course.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ color: '#E11D48', fontWeight: 600 }}>
                            Due: {course.dueDate ? new Date(course.dueDate).toLocaleDateString() : 'Immediate'} {isOverdue && '(Overdue)'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                            Category: {course.category || 'General'}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => onViewCourse(course._id)}
                        sx={{
                          background: '#DC2626',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: '8px',
                          boxShadow: 'none',
                          '&:hover': {
                            background: '#991B1B',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        Start Now
                      </Button>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>

        {/* 3. Recommended Courses */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1E293B', fontFamily: "'Inter', sans-serif" }}>
            Recommended For You
          </Typography>
          {recommendedCourses.length === 0 ? (
            <EmptyState 
              imageSrc="/assets/lms_graduation.png"
              title="No recommendations" 
              description="We couldn't find any recommended courses for your department yet." 
              actionText="Explore Catalog"
              actionVariant="outlined"
              onAction={() => navigate('/training/catalog')}
            />
          ) : (
            <Grid container spacing={3}>
              {recommendedCourses.slice(0, 3).map(course => (
                <Grid item xs={12} key={course._id}>
                  <CourseCard 
                    variant="horizontal"
                    course={course} 
                    onView={() => onViewCourse(course._id)} 
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Grid>

      {/* Insights Sidebar (Right 3.5 Columns) */}
      <Grid item xs={12} md={3.5}>
        {/* Learning Insights Card */}
        <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3, p: 2, backgroundColor: '#FFFFFF' }}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ p: 1, borderRadius: '8px', backgroundColor: '#F0F7FF', color: '#0A66C2', display: 'flex' }}>
                <MdShowChart size={20} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: "'Inter', sans-serif" }}>
                Learning Insights
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.88rem' }}>Time Invested</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>
                  {myStats ? `${Math.round(myStats.totalTimeSpent / 60)}h ${myStats.totalTimeSpent % 60}m` : '0h 0m'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.88rem' }}>Completed Courses</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>
                  {completedCoursesCount}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="text"
              fullWidth
              onClick={() => navigate('/training/catalog')}
              sx={{
                textTransform: 'none',
                color: '#0A66C2',
                backgroundColor: '#F0F7FF',
                borderRadius: '8px',
                fontWeight: 600,
                py: 1,
                fontSize: '0.85rem',
                justifyContent: 'space-between',
                px: 2,
                '&:hover': {
                  backgroundColor: '#E0F0FF'
                }
              }}
              endIcon={<MdArrowForward />}
            >
              View full report
            </Button>
          </CardContent>
        </Card>

        {/* Achievements & Leaderboard Card */}
        <Card 
          onClick={() => setLeaderboardOpen(true)}
          sx={{ 
            borderRadius: '16px', 
            border: '1px solid #E2E8F0', 
            boxShadow: 'none', 
            mb: 3, 
            p: 2.5, 
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              borderColor: '#CBD5E1',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#F59E0B', display: 'flex' }}>
                <MdEmojiEvents size={20} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif" }}>
                Achievements & Leaderboard
              </Typography>
            </Box>
            <MdChevronRight style={{ color: '#94A3B8', fontSize: '1.25rem' }} />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem', mt: 1, pl: 5, fontFamily: "'Inter', sans-serif" }}>
            See how you rank and your latest achievements.
          </Typography>
        </Card>

        {/* 4. Recent Completed Certificates */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B', fontFamily: "'Inter', sans-serif" }}>
            Recent Certificates
          </Typography>
          {completedCourses.length === 0 ? (
            <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none', p: 2.5, textAlign: 'center', background: '#FFFFFF' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                Complete courses to receive official certifications.
              </Typography>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {completedCourses.slice(0, 2).map(course => (
                <CertificateCard
                  key={course._id}
                  courseTitle={course.title}
                  completionDate={course.progress?.completedAt}
                  onPreview={course.progress?.certificate ? () => window.open(course.progress.certificate.s3Url, '_blank') : null}
                />
              ))}
            </Box>
          )}
        </Box>
      </Grid>

      {/* Achievements & Leaderboard Dialog */}
      <Dialog 
        open={leaderboardOpen} 
        onClose={() => setLeaderboardOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #F1F5F9', pb: 2 }}>
          <MdEmojiEvents style={{ color: '#F59E0B', fontSize: '1.6rem' }} /> Achievements & Leaderboard
        </DialogTitle>
        <DialogContent sx={{ mt: 2, pb: 1 }}>
          {/* Learning Streak */}
          {myStats?.streak > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 1.8, background: '#FFFBEB', borderRadius: '10px', border: '1px solid #FEF3C7' }}>
              <Box sx={{ fontSize: '2.2rem', flexShrink: 0 }}>🔥</Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#78350F' }}>
                  {myStats.streak} Days Learning Streak
                </Typography>
                <Typography variant="caption" sx={{ color: '#B45309', display: 'block' }}>
                  Keep learning daily to grow your streak!
                </Typography>
              </Box>
            </Box>
          )}

          {/* Achievements Badges */}
          {myStats?.achievements?.length > 0 ? (
            <Box sx={{ mb: 3.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Badges ({myStats.achievements.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {myStats.achievements.map(badge => (
                  <Chip
                    key={badge.id}
                    label={`${badge.icon} ${badge.name}`}
                    title={badge.description}
                    size="small"
                    sx={{ backgroundColor: '#F1F5F9', fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ mb: 3.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Badges (0)
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.8rem' }}>
                No badges earned yet. Complete courses to unlock!
              </Typography>
            </Box>
          )}

          {/* Leaderboard list */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Top Learners
            </Typography>
            {leaderboard.length === 0 ? (
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>No leaderboard data available.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                {leaderboard.slice(0, 5).map((entry, idx) => (
                  <Box key={entry._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, p: 0.8, borderRadius: '8px', '&:hover': { backgroundColor: '#F8FAFC' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : '#64748B', width: 16, textAlign: 'center' }}>
                        {idx + 1}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                        {entry.firstName} {entry.lastName}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0A66C2' }}>
                      {entry.completedCount} courses
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #F1F5F9', mt: 2, p: 1.5 }}>
          <Button onClick={() => setLeaderboardOpen(false)} sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default MyLearning;
