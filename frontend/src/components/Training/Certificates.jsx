import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import CertificateCard from './Shared/CertificateCard';
import EmptyState from './Shared/EmptyState';
import { MdWorkspacePremium } from 'react-icons/md';

const Certificates = ({ materials = [], onDownloadCertificate }) => {
  // Filter courses that are completed AND have certificates uploaded
  const certifiedCourses = materials.filter(
    (course) => course.progress?.status === 'COMPLETED' && course.progress?.certificate
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          component="h2"
          sx={{ 
            fontWeight: 700, 
            color: '#1E293B', 
            mb: 1, 
            fontFamily: "'Outfit', 'Inter', sans-serif" 
          }}
        >
          My Certificates
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#64748B', 
            fontFamily: "'Inter', sans-serif" 
          }}
        >
          View and download verified professional certifications you have completed at Luminoid.
        </Typography>
      </Box>

      {certifiedCourses.length === 0 ? (
        <EmptyState
          icon={MdWorkspacePremium}
          title="No Certificates Yet"
          description="Once you complete a course and it is verified by your manager, your certificate will appear here."
        />
      ) : (
        <Grid container spacing={3}>
          {certifiedCourses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course._id}>
              <CertificateCard
                courseTitle={course.title}
                completionDate={course.progress?.completedAt}
                onDownload={() => onDownloadCertificate(course._id)}
                onPreview={() => window.open(course.progress.certificate.s3Url, '_blank')}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Certificates;
