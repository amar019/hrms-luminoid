import React, { useState, useEffect } from 'react';
import { Box, Paper, Tabs, Tab, Grid, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress } from '@mui/material';
import { MdSettings, MdAdd, MdEdit, MdDelete, MdOpenInNew, MdFileUpload, MdCheck } from 'react-icons/md';
import CourseCreationWizard from './CourseCreationWizard';
import EmptyState from './Shared/EmptyState';
import api from '../../utils/api';
import Swal from 'sweetalert2';

const AdminHub = ({ 
  materials = [], 
  departments = [], 
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onUploadCertificate,
  onDeleteCertificate
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editingCourse, setEditingCourse] = useState(null);
  const [progressCourse, setProgressCourse] = useState(null); // Course for progress modal
  const [progressData, setProgressData] = useState([]);
  const [uploadingCert, setUploadingCert] = useState(null); // userId

  // Fetch progress data for a course when selected
  useEffect(() => {
    if (progressCourse) {
      api.get(`/api/training/${progressCourse._id}/progress`)
        .then(res => setProgressData(res.data))
        .catch(() => {});
    }
  }, [progressCourse]);

  const handleEditClick = (course) => {
    setEditingCourse(course);
    setActiveTab(1); // switch to wizard tab
  };

  const handleCreateNewClick = () => {
    setEditingCourse(null);
    setActiveTab(1);
  };

  const handleWizardCancel = () => {
    setEditingCourse(null);
    setActiveTab(0);
  };

  const handleWizardSubmit = async (formData) => {
    try {
      if (editingCourse) {
        await onUpdateCourse(editingCourse._id, formData);
        Swal.fire({
          title: 'Success!',
          text: 'Course updated successfully',
          icon: 'success',
          confirmButtonColor: '#0A66C2'
        });
      } else {
        await onCreateCourse(formData);
        Swal.fire({
          title: 'Success!',
          text: 'Course created successfully',
          icon: 'success',
          confirmButtonColor: '#0A66C2'
        });
      }
      setEditingCourse(null);
      setActiveTab(0); // return to list
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to submit course',
        icon: 'error',
        confirmButtonColor: '#0A66C2'
      });
    }
  };

  const handleCertUpload = async (userId, file) => {
    if (!file || !progressCourse) return;
    setUploadingCert(userId);
    try {
      await onUploadCertificate(progressCourse._id, userId, file);
      Swal.fire({
        title: 'Success!',
        text: 'Certificate uploaded successfully',
        icon: 'success',
        confirmButtonColor: '#0A66C2'
      });
      // Refresh progress data
      const res = await api.get(`/api/training/${progressCourse._id}/progress`);
      setProgressData(res.data);
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to upload certificate',
        icon: 'error',
        confirmButtonColor: '#0A66C2'
      });
    } finally {
      setUploadingCert(null);
    }
  };

  const handleCertDelete = async (userId) => {
    if (!progressCourse) return;
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this certificate?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await onDeleteCertificate(progressCourse._id, userId);
        Swal.fire({
          title: 'Deleted!',
          text: 'Certificate deleted successfully',
          icon: 'success',
          confirmButtonColor: '#0A66C2'
        });
        // Refresh progress data
        const res = await api.get(`/api/training/${progressCourse._id}/progress`);
        setProgressData(res.data);
      } catch (err) {
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete certificate',
          icon: 'error',
          confirmButtonColor: '#0A66C2'
        });
      }
    }
  };

  // KPI Calculations
  const totalCourses = materials.length;
  const mandatoryCount = materials.filter(m => m.isMandatory).length;
  const totalCompletions = materials.reduce((acc, m) => acc + (m.completionCount || 0), 0);
  const totalViews = materials.reduce((acc, m) => acc + (m.viewCount || 0), 0);

  return (
    <Box>
      <Paper elevation={0} className="glass-card-no-hover" sx={{ overflow: 'hidden', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            px: 2,
            borderBottom: '1px solid #E2E8F0',
            '& .MuiTabs-indicator': { backgroundColor: '#0A66C2' },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              color: '#64748B',
              fontFamily: "'Inter', sans-serif",
              '&.Mui-selected': { color: '#0A66C2' }
            }
          }}
        >
          <Tab icon={<MdSettings style={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Course Management" />
          <Tab icon={<MdAdd style={{ fontSize: '1.1rem' }} />} iconPosition="start" label={editingCourse ? "Edit Course" : "Create Course"} />
        </Tabs>

        {/* Tab 0: Course List Table */}
        {activeTab === 0 && (
          <Box sx={{ p: 4 }}>
            {/* KPI Stats widgets */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="glass-card premium-metric-card">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#64748B', fontWeight: 600 }}>Total Courses</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E293B', mt: 1 }}>{totalCourses}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="glass-card premium-metric-card">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#64748B', fontWeight: 600 }}>Completions</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981', mt: 1 }}>{totalCompletions}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="glass-card premium-metric-card">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#64748B', fontWeight: 600 }}>Mandatory</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#EF4444', mt: 1 }}>{mandatoryCount}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="glass-card premium-metric-card">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#64748B', fontWeight: 600 }}>Total Views</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#475569', mt: 1 }}>{totalViews}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Actions & Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>Course Library Database</Typography>
              <Button 
                variant="contained" 
                startIcon={<MdAdd />}
                onClick={handleCreateNewClick}
                sx={{ textTransform: 'none', background: '#0A66C2', color: '#FFFFFF', borderRadius: '8px', boxShadow: 'none', '&:hover': { background: '#004182', boxShadow: 'none' } }}
              >
                Create New Course
              </Button>
            </Box>

            {materials.length === 0 ? (
              <EmptyState title="No Courses Created Yet" description="Create a course to populate your LMS database directory." actionText="Create Course" onAction={handleCreateNewClick} />
            ) : (
              <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Course Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Assigned Audience</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Completions</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {materials.map((course) => (
                      <TableRow key={course._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>{course.title}</TableCell>
                        <TableCell>{course.category || 'General'}</TableCell>
                        <TableCell>
                          {course.targetRoles.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {course.targetRoles.map(role => (
                                <Chip key={role} label={role} size="small" sx={{ fontSize: '0.7rem' }} />
                              ))}
                            </Box>
                          ) : (
                            <Chip label="All Staff" size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#10B981' }}>{course.completionCount || 0}</TableCell>
                        <TableCell>
                          <Chip 
                            label={course.isMandatory ? 'Mandatory' : 'Optional'} 
                            color={course.isMandatory ? 'error' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button 
                              size="small" 
                              onClick={() => handleEditClick(course)}
                              startIcon={<MdEdit />}
                              sx={{ textTransform: 'none', color: '#475569' }}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              onClick={() => setProgressCourse(course)}
                              startIcon={<MdOpenInNew />}
                              sx={{ textTransform: 'none', color: '#0A66C2' }}
                            >
                              Progress
                            </Button>
                            <Button 
                              size="small" 
                              color="error"
                              onClick={() => onDeleteCourse(course._id)}
                              startIcon={<MdDelete />}
                              sx={{ textTransform: 'none' }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Tab 1: Wizard Component */}
        {activeTab === 1 && (
          <Box sx={{ p: 4 }}>
            <CourseCreationWizard 
              onSubmit={handleWizardSubmit} 
              initialData={editingCourse}
              departments={departments}
              onCancel={handleWizardCancel}
            />
          </Box>
        )}

      </Paper>

      {/* Progress & Certificate Management Dialog */}
      <Dialog open={!!progressCourse} onClose={() => setProgressCourse(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}>
          Verify Progress and Certificates - {progressCourse?.title}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {progressData.length === 0 ? (
            <Box sx={{ py: 4 }}>
              <EmptyState title="No employee started yet" description="No progress records exist for this training module." />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Certificate Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {progressData.map(record => (
                    <TableRow key={record._id}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {record.userId?.firstName} {record.userId?.lastName}
                        <Typography variant="caption" sx={{ display: 'block', color: '#64748B' }}>{record.userId?.email}</Typography>
                      </TableCell>
                      <TableCell>{record.userId?.department || 'General'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={record.status === 'COMPLETED' ? 'Completed' : record.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'} 
                          color={record.status === 'COMPLETED' ? 'success' : record.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {record.certificate ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => window.open(record.certificate.s3Url, '_blank')}
                              startIcon={<MdCheck />}
                              sx={{ textTransform: 'none' }}
                            >
                              View
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error" 
                              onClick={() => handleCertDelete(record.userId._id)}
                              sx={{ textTransform: 'none' }}
                            >
                              Remove
                            </Button>
                          </Box>
                        ) : (
                          <Box>
                            <input 
                              type="file" 
                              id={`upload-cert-${record._id}`}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleCertUpload(record.userId._id, e.target.files[0]);
                                }
                              }}
                            />
                            <Button 
                              size="small" 
                              variant="contained" 
                              startIcon={<MdFileUpload />}
                              onClick={() => document.getElementById(`upload-cert-${record._id}`).click()}
                              disabled={uploadingCert === record.userId._id}
                              sx={{ textTransform: 'none', background: '#0A66C2', boxShadow: 'none' }}
                            >
                              {uploadingCert === record.userId._id ? 'Uploading...' : 'Verify Cert'}
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #E2E8F0', p: 2 }}>
          <Button variant="outlined" onClick={() => setProgressCourse(null)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminHub;
