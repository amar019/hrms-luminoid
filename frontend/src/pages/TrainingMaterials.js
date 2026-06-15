import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Swal from 'sweetalert2';
import TrainingLayout from '../components/Training/TrainingLayout';
import MyLearning from '../components/Training/MyLearning';
import CourseCatalog from '../components/Training/CourseCatalog';
import CourseDetails from '../components/Training/CourseDetails';
import Certificates from '../components/Training/Certificates';
import AdminHub from '../components/Training/AdminHub';
import ComplianceDashboard from '../components/Training/ComplianceDashboard';
import './TrainingMaterials.css';

const TrainingMaterials = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const isAdmin = ['HR', 'ADMIN'].includes(user?.role);
  const showCompliance = isAdmin || user?.role === 'MANAGER';

  useEffect(() => {
    fetchMaterials();
    fetchLeaderboard();
    if (isAdmin || showCompliance) fetchDepartments();
    if (!isAdmin) fetchMyStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const res = await api.get('/api/training');
      setMaterials(res.data);
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to load materials',
        icon: 'error',
        confirmButtonColor: '#0A66C2'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStats = async () => {
    try {
      const res = await api.get('/api/training/my-stats');
      setMyStats(res.data);
    } catch (err) {}
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/api/training/leaderboard?period=month');
      setLeaderboard(res.data);
    } catch (err) {}
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/api/departments?limit=1000');
      if (res.data && res.data.data) {
        const names = res.data.data.map(d => d.name).filter(Boolean);
        const uniqueNames = [...new Set(names)].sort();
        setDepartments(uniqueNames);
      }
    } catch (err) {}
  };

  // Create Course (FD Multpart logic)
  const handleCreateCourse = async (form) => {
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('externalUrl', form.externalUrl);
      fd.append('targetRoles', JSON.stringify(form.targetRoles));
      fd.append('targetDepartments', JSON.stringify(form.targetDepartments));
      fd.append('isMandatory', form.isMandatory);
      fd.append('dueDate', form.dueDate);
      fd.append('estimatedMinutes', form.estimatedMinutes || 0);
      
      if (form.thumbnail) fd.append('thumbnail', form.thumbnail);
      form.files.forEach((file) => {
        fd.append('files', file);
      });

      await api.post('/api/training', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearCache();
      fetchMaterials();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create course');
    }
  };

  // Update Course (FD Multipart logic)
  const handleUpdateCourse = async (id, form) => {
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('externalUrl', form.externalUrl);
      fd.append('targetRoles', JSON.stringify(form.targetRoles));
      fd.append('targetDepartments', JSON.stringify(form.targetDepartments));
      fd.append('isMandatory', form.isMandatory);
      fd.append('dueDate', form.dueDate);
      fd.append('estimatedMinutes', form.estimatedMinutes || 0);
      
      if (form.thumbnail) fd.append('thumbnail', form.thumbnail);
      form.files.forEach((file) => {
        fd.append('files', file);
      });

      await api.put(`/api/training/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearCache();
      fetchMaterials();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update course');
    }
  };

  // Delete Course
  const handleDeleteCourse = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this course?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/training/${id}`);
        Swal.fire({
          title: 'Deleted!',
          text: 'Course deleted',
          icon: 'success',
          confirmButtonColor: '#0A66C2'
        });
        clearCache();
        fetchMaterials();
      } catch (err) {
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete course',
          icon: 'error',
          confirmButtonColor: '#0A66C2'
        });
      }
    }
  };

  // Progress Action Update
  const handleProgressUpdate = async (courseId, status) => {
    try {
      await api.put(`/api/training/${courseId}/progress`, { status });
      Swal.fire({
        title: 'Success!',
        text: 'Progress updated',
        icon: 'success',
        confirmButtonColor: '#0A66C2'
      });
      clearCache();
      fetchMaterials();
      if (!isAdmin) fetchMyStats();
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update progress',
        icon: 'error',
        confirmButtonColor: '#0A66C2'
      });
    }
  };

  // Certificate triggers
  const handleDownloadCertificate = async (materialId) => {
    try {
      const res = await api.get(`/api/training/${materialId}/certificate`);
      if (res.data.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank');
      }
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to download certificate',
        icon: 'error',
        confirmButtonColor: '#0A66C2'
      });
    }
  };

  const handleUploadCertificate = async (materialId, userId, file) => {
    const fd = new FormData();
    fd.append('certificate', file);
    await api.post(`/api/training/${materialId}/progress/${userId}/certificate`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  };

  const handleDeleteCertificate = async (materialId, userId) => {
    await api.delete(`/api/training/${materialId}/progress/${userId}/certificate`);
  };

  const clearCache = () => {
    // Cache disabled for real-time visibility of creations/updates/deletions
  };

  return (
    <TrainingLayout user={user}>
      <Routes>
        {/* Dashboard */}
        <Route 
          path="/" 
          element={
            isAdmin ? (
              <Navigate to="/training/admin" replace />
            ) : (
              <MyLearning 
                materials={materials} 
                myStats={myStats} 
                leaderboard={leaderboard} 
                onViewCourse={(id) => navigate(`/training/course/${id}`)}
                onDownloadCertificate={handleDownloadCertificate}
              />
            )
          } 
        />
        
        {/* Catalog */}
        <Route 
          path="/catalog" 
          element={
            <CourseCatalog 
              materials={materials} 
              loading={loading}
              onViewCourse={(id) => navigate(`/training/course/${id}`)}
              onEditCourse={(course) => navigate(`/training/admin?tab=1&edit=${course._id}`)} // managed inside admin tab
              onDeleteCourse={handleDeleteCourse}
              isAdmin={isAdmin}
            />
          } 
        />
        
        {/* Details centerpiece */}
        <Route 
          path="/course/:id" 
          element={
            <CourseDetails 
              materials={materials} 
              loading={loading}
              onProgressUpdate={handleProgressUpdate}
              onDownloadCertificate={handleDownloadCertificate}
              user={user}
            />
          } 
        />
        
        {/* Certificates gallery */}
        <Route 
          path="/certificates" 
          element={
            <Certificates 
              materials={materials} 
              onDownloadCertificate={handleDownloadCertificate}
            />
          } 
        />
        
        {/* Compliance dashboard */}
        {showCompliance && (
          <Route 
            path="/compliance" 
            element={
              <ComplianceDashboard 
                materials={materials} 
                departments={departments}
              />
            } 
          />
        )}
        
        {/* Admin management workspace */}
        {isAdmin && (
          <Route 
            path="/admin" 
            element={
              <AdminHub 
                materials={materials} 
                departments={departments}
                onCreateCourse={handleCreateCourse}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={handleDeleteCourse}
                onUploadCertificate={handleUploadCertificate}
                onDeleteCertificate={handleDeleteCertificate}
              />
            } 
          />
        )}
      </Routes>
    </TrainingLayout>
  );
};

export default TrainingMaterials;
