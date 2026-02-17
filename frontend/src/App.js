import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/custom.css';
import './styles/modern.css';
import './styles/enhanced.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';
import Approvals from './pages/Approvals';
import LeaveTypes from './pages/LeaveTypes';
import EmployeeDirectory from './pages/EmployeeDirectory';
import TeamCalendar from './pages/TeamCalendar';
import Attendance from './pages/Attendance';
import Files from './pages/Files';
import Announcements from './pages/Announcements';
import EmployeeProfile from './pages/EmployeeProfile';
import Expenses from './pages/Expenses';
import Assets from './pages/Assets';
import Reports from './pages/Reports';
import EmployeeImport from './pages/EmployeeImport';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/apply-leave" element={
              <ProtectedRoute roles={['EMPLOYEE']}>
                <Layout>
                  <ApplyLeave />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/my-leaves" element={
              <ProtectedRoute roles={['EMPLOYEE']}>
                <Layout>
                  <MyLeaves />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/approvals" element={
              <ProtectedRoute roles={['MANAGER', 'HR', 'ADMIN']}>
                <Layout>
                  <Approvals />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/leave-types" element={
              <ProtectedRoute roles={['HR', 'ADMIN']}>
                <Layout>
                  <LeaveTypes />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee-directory" element={
              <ProtectedRoute roles={['MANAGER', 'HR', 'ADMIN']}>
                <Layout>
                  <EmployeeDirectory />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/team-calendar" element={
              <ProtectedRoute roles={['MANAGER', 'HR', 'ADMIN']}>
                <Layout>
                  <TeamCalendar />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/attendance" element={
              <ProtectedRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/files" element={
              <ProtectedRoute>
                <Layout>
                  <Files />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/announcements" element={
              <ProtectedRoute roles={['HR', 'ADMIN']}>
                <Layout>
                  <Announcements />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <EmployeeProfile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile/:id" element={
              <ProtectedRoute>
                <Layout>
                  <EmployeeProfile />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/expenses" element={
              <ProtectedRoute>
                <Layout>
                  <Expenses />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/assets" element={
              <ProtectedRoute roles={['HR', 'ADMIN']}>
                <Layout>
                  <Assets />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute roles={['HR', 'ADMIN']}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/employee-import" element={
              <ProtectedRoute roles={['HR', 'ADMIN']}>
                <Layout>
                  <EmployeeImport />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="custom-toast"
          />
        </div>
      </Router>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;