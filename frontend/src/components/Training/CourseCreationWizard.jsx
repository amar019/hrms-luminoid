import React, { useState, useEffect } from 'react';
import { Stepper, Step, StepLabel, Button, Box, Typography, TextField, FormLabel, Grid, Chip, Paper, IconButton, CircularProgress } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { MdArrowForward, MdArrowBack, MdCloudUpload, MdCheckCircle, MdSchool, MdCancel, MdPerson, MdPeople, MdBusiness, MdAdminPanelSettings, MdCheck, MdLink, MdImage, MdVideocam, MdPictureAsPdf, MdAttachFile, MdStar, MdAccessTime, MdOutlineLibraryBooks, MdCalendarToday, MdWorkspacePremium, MdPlayArrow } from 'react-icons/md';
import { formatDuration } from '../../utils/format';
import Swal from 'sweetalert2';

const steps = ['Course Info', 'Audience', 'Content', 'Preview', 'Publish'];

const roleDetails = {
  EMPLOYEE: { label: 'Employee', icon: <MdPerson />, desc: 'General staff & contributors' },
  MANAGER: { label: 'Manager', icon: <MdPeople />, desc: 'Team leads & managers' },
  HR: { label: 'HR', icon: <MdBusiness />, desc: 'Human Resources & recruiters' },
  ADMIN: { label: 'Admin', icon: <MdAdminPanelSettings />, desc: 'Platform administrators' }
};

const CATEGORY_SUGGESTIONS = [
  'Compliance',
  'Technical',
  'HR',
  'Onboarding',
  'Leadership',
  'Cybersecurity',
  'Soft Skills'
];

const formatBytes = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const CourseCreationWizard = ({ onSubmit, initialData, departments = [], onCancel }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    externalUrl: '',
    thumbnail: null,
    thumbnailUrl: '',
    targetRoles: [],
    targetDepartments: [],
    isMandatory: false,
    dueDate: '',
    estimatedMinutes: '',
    useHoursMode: false,
    durationWeeks: '',
    durationHours: '',
    files: []
  });

  useEffect(() => {
    if (initialData) {
      const minutes = initialData.estimatedMinutes || 0;
      const isHoursMode = minutes >= 60;
      const hours = isHoursMode ? Math.round(minutes / 60) : 0;
      const weeks = isHoursMode ? Math.round(hours / 5) : 0;

      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        externalUrl: initialData.externalUrl || '',
        thumbnail: null,
        thumbnailUrl: initialData.thumbnailUrl || '',
        targetRoles: initialData.targetRoles || [],
        targetDepartments: initialData.targetDepartments || [],
        isMandatory: initialData.isMandatory || false,
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        estimatedMinutes: minutes ? minutes.toString() : '',
        useHoursMode: isHoursMode,
        durationWeeks: weeks > 0 ? weeks.toString() : '',
        durationHours: hours > 0 ? hours.toString() : '',
        files: []
      });
    }
  }, [initialData]);

  const handleNext = () => {
    if (activeStep === 0) {
      if (!form.title) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Course Title is required',
          confirmButtonColor: '#0A66C2'
        });
        return;
      }
      if (form.useHoursMode) {
        if (!form.durationWeeks || !form.durationHours) {
          Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: 'Please specify weeks and total hours for the course duration',
            confirmButtonColor: '#0A66C2'
          });
          return;
        }
      } else {
        if (!form.estimatedMinutes) {
          Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: 'Please specify the estimated minutes for the course duration',
            confirmButtonColor: '#0A66C2'
          });
          return;
        }
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCheckboxChange = (field, value) => {
    setForm(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleWeeksChange = (wStr) => {
    const w = parseInt(wStr) || 0;
    const h = w * 5; // 5 hours per week default
    setForm(prev => ({
      ...prev,
      durationWeeks: wStr,
      durationHours: h > 0 ? h.toString() : '',
      estimatedMinutes: h > 0 ? (h * 60).toString() : ''
    }));
  };

  const handleHoursChange = (hStr) => {
    const h = parseInt(hStr) || 0;
    const w = Math.round(h / 5);
    setForm(prev => ({
      ...prev,
      durationHours: hStr,
      durationWeeks: w > 0 ? w.toString() : '',
      estimatedMinutes: h > 0 ? (h * 60).toString() : ''
    }));
  };

  const handleSubmitForm = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getThumbnailPreview = () => {
    if (form.thumbnail) {
      try {
        return URL.createObjectURL(form.thumbnail);
      } catch (e) {
        return '';
      }
    }
    return form.thumbnailUrl || '';
  };

  const CustomStepIcon = (props) => {
    const { active, completed, icon } = props;
    const icons = {
      1: <MdSchool />,
      2: <MdPeople />,
      3: <MdCloudUpload />,
      4: <MdStar />,
      5: <MdCheckCircle />,
    };
    return (
      <Box
        sx={{
          backgroundColor: completed ? '#0A66C2' : active ? '#0A66C2' : '#F1F5F9',
          color: completed ? '#FFFFFF' : active ? '#FFFFFF' : '#64748B',
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          boxShadow: active ? '0 0 0 4px rgba(10, 102, 194, 0.15)' : 'none',
          transition: 'all 0.3s ease',
          fontSize: '1.3rem',
          zIndex: 1,
        }}
      >
        {completed ? <MdCheck /> : icons[String(icon)]}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1000px', mx: 'auto', py: 2 }}>
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel 
        sx={{ 
          mb: 5,
          '& .MuiStepConnector-line': { borderColor: '#E2E8F0', borderWidth: 2 },
          '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': { borderColor: '#0A66C2' },
          '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': { borderColor: '#0A66C2' }
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={CustomStepIcon}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mt: 0.5 }}>
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          mb: 3, 
          borderRadius: '20px', 
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.015)'
        }}
      >
        {/* STEP 1: COURSE INFO */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
              General Course Information
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 4, fontFamily: "'Inter', sans-serif" }}>
              Provide essential details to identify, categorize, and schedule the course duration.
            </Typography>

            <Grid container spacing={4}>
              {/* Row 1: Course Title (Left) and Description (Right) */}
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Course Title *"
                  size="small"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Reactjs"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#CBD5E1' },
                      '&.Mui-focused fieldset': { borderColor: '#0A66C2', borderWidth: '2px' },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter course description..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#CBD5E1' },
                      '&.Mui-focused fieldset': { borderColor: '#0A66C2', borderWidth: '2px' },
                    }
                  }}
                />
              </Grid>

              {/* Row 2: Category Select dropdown */}
              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={CATEGORY_SUGGESTIONS}
                  value={form.category}
                  onChange={(event, newValue) => {
                    setForm({ ...form, category: newValue || '' });
                  }}
                  onInputChange={(event, newInputValue) => {
                    setForm({ ...form, category: newInputValue || '' });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      placeholder="Select a category"
                      size="medium"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          '& fieldset': { borderColor: '#E2E8F0' },
                          '&:hover fieldset': { borderColor: '#CBD5E1' },
                          '&.Mui-focused fieldset': { borderColor: '#0A66C2', borderWidth: '2px' },
                        }
                      }}
                    />
                  )}
                />
                
                {/* Category Suggestion Chips */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mr: 0.5 }}>
                    Quick Select:
                  </Typography>
                  {CATEGORY_SUGGESTIONS.map(cat => (
                    <Chip
                      key={cat}
                      label={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      clickable
                      sx={{
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        height: 30,
                        borderRadius: '15px',
                        transition: 'all 0.2s ease',
                        border: '1px solid #E2E8F0',
                        '&:hover': {
                          backgroundColor: '#E2E8F0',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Grid>
              
              {/* Row 3: Duration Type (Left) and Inputs (Right) */}
              <Grid item xs={12} md={7}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5 }}>
                  Duration Type
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Card 1: Minutes */}
                  <Paper
                    elevation={0}
                    onClick={() => setForm(prev => ({ 
                      ...prev, 
                      useHoursMode: false,
                      estimatedMinutes: prev.estimatedMinutes || '30',
                      durationWeeks: '',
                      durationHours: ''
                    }))}
                    sx={{
                      p: 2,
                      borderRadius: '14px',
                      border: '2px solid',
                      borderColor: !form.useHoursMode ? '#2563EB' : '#E2E8F0',
                      backgroundColor: !form.useHoursMode ? '#F0F6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      '&:hover': {
                        borderColor: !form.useHoursMode ? '#2563EB' : '#CBD5E1'
                      }
                    }}
                  >
                    {/* Radio circle */}
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: !form.useHoursMode ? '#2563EB' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#FFFFFF'
                    }}>
                      {!form.useHoursMode && (
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2563EB' }} />
                      )}
                    </Box>

                    {/* Clock Icon Circle */}
                    <Box sx={{
                      display: 'flex',
                      p: 1.2,
                      borderRadius: '50%',
                      backgroundColor: !form.useHoursMode ? '#DBEAFE' : '#F1F5F9',
                      color: !form.useHoursMode ? '#2563EB' : '#64748B',
                      fontSize: '1.25rem'
                    }}>
                      <MdAccessTime />
                    </Box>

                    {/* Text block */}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: !form.useHoursMode ? '#1E3A8A' : '#1E293B' }}>
                        Minutes (Short Training)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.2 }}>
                        Best for short, micro-learning sessions
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Card 2: Weeks & Hours */}
                  <Paper
                    elevation={0}
                    onClick={() => setForm(prev => ({ 
                      ...prev, 
                      useHoursMode: true,
                      estimatedMinutes: '',
                      durationWeeks: prev.durationWeeks || '8',
                      durationHours: prev.durationHours || '40'
                    }))}
                    sx={{
                      p: 2,
                      borderRadius: '14px',
                      border: '2px solid',
                      borderColor: form.useHoursMode ? '#2563EB' : '#E2E8F0',
                      backgroundColor: form.useHoursMode ? '#F0F6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      '&:hover': {
                        borderColor: form.useHoursMode ? '#2563EB' : '#CBD5E1'
                      }
                    }}
                  >
                    {/* Radio circle */}
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: form.useHoursMode ? '#2563EB' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#FFFFFF'
                    }}>
                      {form.useHoursMode && (
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2563EB' }} />
                      )}
                    </Box>

                    {/* Calendar Icon Circle */}
                    <Box sx={{
                      display: 'flex',
                      p: 1.2,
                      borderRadius: '50%',
                      backgroundColor: form.useHoursMode ? '#DBEAFE' : '#F1F5F9',
                      color: form.useHoursMode ? '#2563EB' : '#64748B',
                      fontSize: '1.25rem'
                    }}>
                      <MdCalendarToday />
                    </Box>

                    {/* Text block */}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: form.useHoursMode ? '#1E3A8A' : '#1E293B' }}>
                        Weeks & Hours (Long Course)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.2 }}>
                        Best for in-depth or multi-week programs
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              </Grid>

              {/* Right Input for Duration */}
              <Grid item xs={12} md={5}>
                {!form.useHoursMode ? (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                      Estimated Duration (minutes) *
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={form.estimatedMinutes}
                      onChange={e => setForm({ 
                        ...form, 
                        estimatedMinutes: e.target.value,
                        durationWeeks: '',
                        durationHours: ''
                      })}
                      placeholder="30"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          '& fieldset': { borderColor: '#E2E8F0' },
                          '&:hover fieldset': { borderColor: '#CBD5E1' },
                          '&.Mui-focused fieldset': { borderColor: '#0A66C2', borderWidth: '2px' },
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748B', mt: 1, display: 'block' }}>
                      Equivalent to ~{form.estimatedMinutes ? (parseInt(form.estimatedMinutes) / 60).toFixed(1) : '0.5'} hour(s)
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                        Weeks (Duration) *
                      </Typography>
                      <TextField
                        fullWidth
                        type="number"
                        value={form.durationWeeks}
                        onChange={e => handleWeeksChange(e.target.value)}
                        placeholder="8"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#0A66C2', borderWidth: '2px' },
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                        Total Hours (Calculated) *
                      </Typography>
                      <TextField
                        fullWidth
                        type="number"
                        value={form.durationHours}
                        onChange={e => handleHoursChange(e.target.value)}
                        placeholder="40"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#0A66C2', borderWidth: '2px' },
                          }
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 2: AUDIENCE */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
              Define Target Audience
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 4, fontFamily: "'Inter', sans-serif" }}>
              Determine who must complete or can access this training module.
            </Typography>

            {/* Target Roles: Interactive Cards */}
            <Box sx={{ mb: 4 }}>
              <FormLabel component="legend" sx={{ fontWeight: 700, color: '#334155', mb: 2, fontSize: '0.88rem' }}>
                Target Roles
              </FormLabel>
              <Grid container spacing={2}>
                {['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'].map(role => {
                  const isSelected = form.targetRoles.includes(role);
                  const detail = roleDetails[role];
                  return (
                    <Grid item xs={12} sm={6} md={3} key={role}>
                      <Paper
                        elevation={0}
                        onClick={() => handleCheckboxChange('targetRoles', role)}
                        sx={{
                          p: 2.5,
                          height: '100%',
                          borderRadius: '12px',
                          border: '2px solid',
                          borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                          backgroundColor: isSelected ? '#F0F7FF' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: 1,
                          position: 'relative',
                          '&:hover': {
                            borderColor: isSelected ? '#2563EB' : '#CBD5E1',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                          }
                        }}
                      >
                        {isSelected && (
                          <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', color: '#2563EB' }}>
                            <MdCheckCircle style={{ fontSize: '1.2rem' }} />
                          </Box>
                        )}
                        <Box sx={{
                          display: 'flex',
                          p: 1.2,
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#2563EB' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#64748B',
                          fontSize: '1.5rem',
                          mb: 1
                        }}>
                          {detail.icon}
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          {detail.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', px: 1 }}>
                          {detail.desc}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 1.5 }}>
                💡 Select specific roles to target, or leave all unselected to make it visible to everyone.
              </Typography>
            </Box>

            {/* Target Departments: Clickable Grid Chips */}
            <Box sx={{ mb: 4 }}>
              <FormLabel component="legend" sx={{ fontWeight: 700, color: '#334155', mb: 2, fontSize: '0.88rem' }}>
                Target Departments
              </FormLabel>
              {departments.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {departments.map(dept => {
                    const isSelected = form.targetDepartments.includes(dept);
                    return (
                      <Chip
                        key={dept}
                        label={dept}
                        onClick={() => handleCheckboxChange('targetDepartments', dept)}
                        icon={isSelected ? <MdCheck /> : undefined}
                        sx={{
                          backgroundColor: isSelected ? '#0A66C2' : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          border: '1px solid',
                          borderColor: isSelected ? '#0A66C2' : '#E2E8F0',
                          fontWeight: 600,
                          px: 1.5,
                          py: 2.2,
                          borderRadius: '10px',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isSelected ? '#004182' : '#F8FAFC',
                            borderColor: isSelected ? '#0A66C2' : '#CBD5E1',
                          },
                          '& .MuiChip-icon': {
                            color: 'inherit'
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                  No departments found. Target applies to all.
                </Typography>
              )}
            </Box>

            {/* Compliance Mode Toggle Card */}
            <Box sx={{ mb: 4 }}>
              <FormLabel component="legend" sx={{ fontWeight: 700, color: '#334155', mb: 2, fontSize: '0.88rem' }}>
                Course Rules
              </FormLabel>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    onClick={() => setForm(prev => ({ ...prev, isMandatory: false, dueDate: '' }))}
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: !form.isMandatory ? '#0A66C2' : '#E2E8F0',
                      backgroundColor: !form.isMandatory ? '#F0F7FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      '&:hover': {
                        borderColor: !form.isMandatory ? '#0A66C2' : '#CBD5E1'
                      }
                    }}
                  >
                    <Box sx={{
                      mt: 0.5,
                      display: 'flex',
                      p: 1,
                      borderRadius: '50%',
                      backgroundColor: !form.isMandatory ? '#0A66C2' : '#F1F5F9',
                      color: !form.isMandatory ? '#FFFFFF' : '#64748B'
                    }}>
                      <MdSchool />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                        Optional Study {!form.isMandatory && <MdCheck style={{ color: '#0A66C2' }} />}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                        Self-paced study for professional growth with no strict deadlines.
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    onClick={() => setForm(prev => ({ ...prev, isMandatory: true }))}
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: form.isMandatory ? '#DC2626' : '#E2E8F0',
                      backgroundColor: form.isMandatory ? '#FEF2F2' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      '&:hover': {
                        borderColor: form.isMandatory ? '#DC2626' : '#CBD5E1'
                      }
                    }}
                  >
                    <Box sx={{
                      mt: 0.5,
                      display: 'flex',
                      p: 1,
                      borderRadius: '50%',
                      backgroundColor: form.isMandatory ? '#DC2626' : '#F1F5F9',
                      color: form.isMandatory ? '#FFFFFF' : '#64748B'
                    }}>
                      <MdCheckCircle />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                        Mandatory Compliance {form.isMandatory && <MdCheck style={{ color: '#DC2626' }} />}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                        Required compliance module with targeted due date and completion auditing.
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {form.isMandatory && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1, fontSize: '0.85rem' }}>
                  Due Date *
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <MdCalendarToday style={{ color: '#64748B', fontSize: '1.1rem', marginRight: '8px' }} />
                    )
                  }}
                  sx={{
                    maxWith: 320,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#CBD5E1' },
                      '&.Mui-focused fieldset': { borderColor: '#DC2626', borderWidth: '2px' },
                    }
                  }}
                />
                <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 500, mt: 0.8, display: 'block' }}>
                  ⚠️ Required deadline for employee progress audits.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* STEP 3: CONTENT */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
              Upload Material & Content
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 4, fontFamily: "'Inter', sans-serif" }}>
              Attach documents, learning videos, or link to external learning resources.
            </Typography>

            <Box sx={{ mb: 4 }}>
              <FormLabel sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 2, fontSize: '0.88rem' }}>
                Upload Course Content
              </FormLabel>
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #0A66C2',
                  borderRadius: '16px',
                  backgroundColor: '#F8FAFC',
                  py: 5,
                  px: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#F0F7FF',
                    borderColor: '#004182',
                  }
                }}
              >
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={e => {
                    const newFiles = Array.from(e.target.files);
                    setForm(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
                  }}
                />
                <Box sx={{ p: 1.5, borderRadius: '50%', backgroundColor: '#E0F0FF', color: '#0A66C2', mb: 2 }}>
                  <MdCloudUpload style={{ fontSize: '2.4rem' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5, fontFamily: "'Inter', sans-serif" }}>
                  Drag & Drop Course Files Here
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', mb: 2.5, fontSize: '0.82rem' }}>
                  Support files like PDF documents, lectures, PowerPoint decks, and MP4 videos (Max 100MB per file).
                </Typography>
                <Button
                  variant="contained"
                  component="span"
                  sx={{
                    textTransform: 'none',
                    backgroundColor: '#0A66C2',
                    '&:hover': { backgroundColor: '#004182' },
                    borderRadius: '8px',
                    fontWeight: 600,
                    boxShadow: 'none',
                    px: 3
                  }}
                >
                  Browse Files
                </Button>
              </Box>

              {form.files.length > 0 && (
                <Box sx={{ mt: 3.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569' }}>
                    Attached Files ({form.files.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {form.files.map((file, idx) => {
                      const isPdf = file.name?.toLowerCase().endsWith('.pdf');
                      const isVideo = file.name?.toLowerCase().endsWith('.mp4') || file.name?.toLowerCase().endsWith('.webm');
                      return (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            backgroundColor: '#FFFFFF',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#CBD5E1',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                              display: 'flex',
                              p: 1.2,
                              borderRadius: '8px',
                              backgroundColor: isPdf ? '#FEF2F2' : isVideo ? '#F0F7FF' : '#F8FAFC',
                              color: isPdf ? '#EF4444' : isVideo ? '#0A66C2' : '#64748B'
                            }}>
                              {isPdf ? <MdPictureAsPdf style={{ fontSize: '1.2rem' }} /> : isVideo ? <MdVideocam style={{ fontSize: '1.2rem' }} /> : <MdAttachFile style={{ fontSize: '1.2rem' }} />}
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                                {file.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {formatBytes(file.size)}
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => setForm({ ...form, files: form.files.filter((_, i) => i !== idx) })}
                            sx={{
                              color: '#64748B',
                              '&:hover': {
                                color: '#EF4444',
                                backgroundColor: '#FEF2F2'
                              }
                            }}
                          >
                            <MdCancel />
                          </IconButton>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 4 }}>
              <FormLabel sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 1.5, fontSize: '0.88rem' }}>
                OR External URL (e.g. YouTube, Article link)
              </FormLabel>
              <TextField
                fullWidth
                size="small"
                label="External URL"
                value={form.externalUrl}
                onChange={e => setForm({ ...form, externalUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                InputProps={{
                  startAdornment: (
                    <MdLink style={{ color: '#64748B', fontSize: '1.2rem', marginRight: '8px' }} />
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused fieldset': { borderColor: '#0A66C2', borderWidth: '2px' },
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <FormLabel sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 1.5, fontSize: '0.88rem' }}>
                Course Cover Image (Thumbnail)
              </FormLabel>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box
                    component="label"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #E2E8F0',
                      borderRadius: '12px',
                      backgroundColor: '#F8FAFC',
                      py: 3.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#F1F5F9',
                        borderColor: '#CBD5E1',
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={e => {
                        if (e.target.files[0]) {
                          setForm(prev => ({ ...prev, thumbnail: e.target.files[0] }));
                        }
                      }}
                    />
                    <MdImage style={{ fontSize: '2rem', color: '#0A66C2', marginBottom: '8px' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                      Choose Thumbnail Cover
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', mt: 0.5 }}>
                      Recommended: Aspect ratio 16:9 (PNG, JPG)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  {(form.thumbnail || form.thumbnailUrl) ? (
                    <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', height: 125 }}>
                      <Box
                        component="img"
                        src={getThumbnailPreview()}
                        alt="Thumbnail Preview"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setForm(prev => ({ ...prev, thumbnail: null, thumbnailUrl: '' }))}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(15,23,42,0.7)',
                          color: '#FFFFFF',
                          '&:hover': {
                            backgroundColor: 'rgba(15,23,42,0.9)',
                          }
                        }}
                      >
                        <MdCancel />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 125, border: '1px dashed #E2E8F0', borderRadius: '12px', color: '#94A3B8', backgroundColor: '#F8FAFC' }}>
                      <Typography variant="body2">No cover image uploaded.</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {/* STEP 4: PREVIEW (EMPLOYEE VIEW LAYOUT REPLICA) */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
              Live Employee View Preview
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 4, fontFamily: "'Inter', sans-serif" }}>
              This is how the course will be displayed to targeted Employees on their dashboard.
            </Typography>

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
              {/* Top Media Player Area mockup */}
              <Box sx={{ backgroundColor: '#0F172A', position: 'relative', width: '100%', minHeight: { xs: 220, sm: 340 } }}>
                <Box sx={{ width: '100%', height: '100%', minHeight: { xs: 220, sm: 340 }, position: 'relative', overflow: 'hidden' }}>
                  {getThumbnailPreview() ? (
                    <Box 
                      component="img" 
                      src={getThumbnailPreview()} 
                      alt={form.title} 
                      sx={{ width: '100%', height: '100%', minHeight: { xs: 220, sm: 340 }, objectFit: 'cover', display: 'block', position: 'absolute', top: 0, left: 0 }} 
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        minHeight: { xs: 220, sm: 340 },
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

                  {/* Active File Title Banner mockup */}
                  {(form.files.length > 0 || form.externalUrl) && (
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
                      Selected File: {form.files.length > 0 ? form.files[0].name : form.externalUrl}
                    </Box>
                  )}
                  
                  {/* Dark Play Overlay mockup */}
                  <Box 
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
                    }}
                  >
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
                      }}
                    >
                      <MdPlayArrow style={{ fontSize: '2.4rem', color: '#FFFFFF', marginLeft: '2px' }} />
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Course Details Block mockup */}
              <Box sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 800, 
                    color: '#1E293B', 
                    mb: 2, 
                    fontFamily: "'Outfit', 'Inter', sans-serif"
                  }}
                >
                  {form.title || 'Untitled Course'}
                </Typography>

                {/* Metadata Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5, flexWrap: 'wrap' }}>
                  <Chip 
                    label={form.category || 'General'} 
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
                  {form.isMandatory && (
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
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                    <MdStar style={{ fontSize: '1.1rem', color: '#F59E0B' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                      4.8 (1,250 ratings)
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                    <MdAccessTime style={{ fontSize: '1.1rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                      {formatDuration(parseInt(form.estimatedMinutes) || 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                    <MdOutlineLibraryBooks style={{ fontSize: '1.1rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                      {1 + form.files.length} Lessons
                    </Typography>
                  </Box>

                  {form.dueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                      <MdCalendarToday style={{ fontSize: '1.1rem' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                        Due: {new Date(form.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#334155', 
                    mb: 3.5, 
                    lineHeight: 1.6, 
                    fontSize: '0.92rem', 
                    fontFamily: "'Inter', sans-serif" 
                  }}
                >
                  {form.description || 'This course covers core concepts to enhance your professional toolkit.'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
                  <Box sx={{ display: 'flex', p: 0.5, borderRadius: '50%', backgroundColor: '#F0F7FF', color: '#0A66C2' }}>
                    <MdWorkspacePremium style={{ fontSize: '1.3rem' }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                    Created by <span style={{ color: '#0A66C2', fontWeight: 600 }}>Luminaid Academy</span>
                  </Typography>
                </Box>

                {/* Course Progress status mock */}
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
                      label="Not Started" 
                      color="default"
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.75rem', px: 0.5 }}
                    />
                  </Box>

                  <Button
                    variant="outlined"
                    disabled
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      px: 3,
                      py: 1,
                      borderColor: '#0A66C2',
                      color: '#0A66C2'
                    }}
                  >
                    Mark In Progress
                  </Button>
                </Box>

                {/* Supplementary Attachments List mockup */}
                {form.files.length > 0 && (
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
                      {form.files.map((file, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', p: 1, borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#64748B' }}>
                              <MdAttachFile style={{ fontSize: '1.2rem' }} />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>{file.name}</Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>{formatBytes(file.size)}</Typography>
                            </Box>
                          </Box>
                          <Button 
                            variant="outlined" 
                            disabled
                            size="small"
                            sx={{ textTransform: 'none', borderRadius: '6px' }}
                          >
                            Open
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        )}

        {/* STEP 5: PUBLISH */}
        {activeStep === 4 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#10B981', mb: 3 }}>
              <MdCheckCircle style={{ fontSize: '4rem' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#1E293B', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
              Ready to Launch!
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B', maxWidth: 520, mx: 'auto', mb: 5, fontSize: '0.95rem' }}>
              You have successfully configured the course. Please review the configurations below before launching.
            </Typography>

            {/* Summary Inspection Grid */}
            <Grid container spacing={3} sx={{ textAlign: 'left', mb: 5 }}>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0A66C2', mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    Course Overview
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Title</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{form.title}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Category</Typography>
                      <Chip label={form.category || 'General'} size="small" sx={{ mt: 0.5, fontWeight: 700, color: '#0A66C2', backgroundColor: '#F0F7FF', borderRadius: '4px' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Estimated Duration</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{formatDuration(parseInt(form.estimatedMinutes) || 0)}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0A66C2', mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    Target Audience
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Roles</Typography>
                      {form.targetRoles.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {form.targetRoles.map(r => <Chip key={r} label={r} size="small" sx={{ fontSize: '0.7rem' }} />)}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>All Roles</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Departments</Typography>
                      {form.targetDepartments.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {form.targetDepartments.map(d => <Chip key={d} label={d} size="small" sx={{ fontSize: '0.7rem' }} />)}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>All Departments</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Type / Deadline</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: form.isMandatory ? '#DC2626' : '#1E293B' }}>
                        {form.isMandatory ? `Mandatory (Due: ${form.dueDate})` : 'Optional / Self-paced'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0A66C2', mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    Materials & Content
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Main Files Attached</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{form.files.length} resource(s)</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>External Reference URL</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: form.externalUrl ? '#0A66C2' : '#64748B', wordBreak: 'break-all' }}>
                        {form.externalUrl || 'None specified'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Cover Image</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                        {form.thumbnail || form.thumbnailUrl ? 'Cover provided' : 'Default cover'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Box 
              sx={{ 
                p: 2.5, 
                borderRadius: '12px', 
                backgroundColor: '#F0F7FF', 
                border: '1px solid #E0F0FF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                maxWidth: 550,
                mx: 'auto'
              }}
            >
              <MdSchool style={{ color: '#0A66C2', fontSize: '1.5rem', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: '#004182', fontWeight: 600, textAlign: 'left' }}>
                Publishing sends notifications to matched staff and makes training instantly active in the workspace directory.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Wizard Navigation Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 3, borderTop: '1px solid #F1F5F9', alignItems: 'center' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<MdArrowBack />}
            sx={{ 
              textTransform: 'none', 
              color: '#64748B', 
              fontWeight: 700,
              borderRadius: '8px',
              fontSize: '0.9rem',
              px: 2.5,
              '&:hover': { backgroundColor: 'transparent', color: '#1E293B' }
            }}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ 
                textTransform: 'none', 
                borderRadius: '10px',
                fontWeight: 700,
                borderColor: '#E2E8F0',
                color: '#1E293B',
                px: 4,
                py: 1,
                '&:hover': { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' }
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmitForm : handleNext}
              endIcon={activeStep === steps.length - 1 ? null : <MdArrowForward />}
              disabled={submitting}
              sx={{ 
                textTransform: 'none', 
                background: activeStep === steps.length - 1 ? '#10B981' : '#2563EB', 
                color: '#FFFFFF', 
                borderRadius: '10px', 
                boxShadow: 'none', 
                fontWeight: 700,
                px: 4,
                py: 1,
                '&:hover': { background: activeStep === steps.length - 1 ? '#059669' : '#1D4ED8', boxShadow: 'none' } 
              }}
            >
              {activeStep === steps.length - 1 ? (submitting ? 'Publishing...' : 'Publish') : 'Next'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CourseCreationWizard;
