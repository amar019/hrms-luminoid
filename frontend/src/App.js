import Swal from 'sweetalert2';
import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/custom.css";
import "./styles/modern.css";
import "./styles/enhanced.css";
import "./styles/enhanced-navbar.css";
import "./styles/sidebar-dark.css";
import "./styles/mobile-responsive.css";
import "./styles/desktop-enhanced.css";
import "./styles/compact-pages.css";
import "./styles/darkmode.css";
import "./styles/smooth-transitions.css";
import "./styles/modern-spinner.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { DataProvider } from "./context/DataContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import EnhancedLayout from "./components/EnhancedLayout";
import GlobalSpinner from "./components/GlobalSpinner";


import Login from "./pages/Login";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const LeaveManagementHub = lazy(() => import("./pages/LeaveManagementHub"));
const OrganizationHub = lazy(() => import("./pages/OrganizationHub"));
const ApplyLeave = lazy(() => import("./pages/ApplyLeave"));
const MyLeaves = lazy(() => import("./pages/MyLeaves"));
const Approvals = lazy(() => import("./pages/Approvals"));
const LeaveTypes = lazy(() => import("./pages/LeaveTypes"));
const EmployeeDirectory = lazy(() => import("./pages/EmployeeDirectory"));
const TeamCalendar = lazy(() => import("./pages/TeamCalendar"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Files = lazy(() => import("./pages/Files"));
const Announcements = lazy(() => import("./pages/Announcements"));
const EmployeeProfile = lazy(() => import("./pages/EmployeeProfile"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Assets = lazy(() => import("./pages/Assets"));

const Departments = lazy(() => import("./pages/Departments"));
const DepartmentDetails = lazy(() => import("./pages/DepartmentDetails"));
const ProjectTrackerLayout = lazy(() => import("./pages/ProjectTracker/ProjectTrackerLayout"));
const ProjectsHub = lazy(() => import("./pages/ProjectTracker/ProjectsHub"));
const ProjectDetail = lazy(() => import("./pages/ProjectTracker/ProjectDetail"));
const EmployeeDashboard = lazy(() => import("./pages/ProjectTracker/EmployeeDashboard"));
const DailyUpdatesHistory = lazy(() => import("./pages/ProjectTracker/DailyUpdatesHistory"));
const ProjectChatRooms = lazy(() => import("./pages/ProjectTracker/ProjectChatRooms"));
const TrainingMaterials = lazy(() => import("./pages/TrainingMaterials"));
const FieldVisitsHub = lazy(() => import("./pages/FieldVisitsHub"));
const MyFieldWork = lazy(() => import("./pages/MyFieldWork"));
const TeamFieldActivity = lazy(() => import("./pages/TeamFieldActivity"));
const FpoFormPage = lazy(() => import("./pages/FpoFormPage"));
const FpoSubmissions = lazy(() => import("./pages/FpoSubmissions"));

const LoadingFallback = () => <GlobalSpinner />;

const TrackerIndexRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'EMPLOYEE') {
    return <Navigate to="my-tasks" replace />;
  }
  return <Navigate to="projects" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <Dashboard />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/leave-management"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <LeaveManagementHub />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/organization"
                    element={
                      <ProtectedRoute roles={["MANAGER", "HR", "ADMIN"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <OrganizationHub />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/apply-leave"
                    element={
                      <ProtectedRoute roles={["EMPLOYEE"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <ApplyLeave />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/my-leaves"
                    element={
                      <ProtectedRoute roles={["EMPLOYEE"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <MyLeaves />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/approvals"
                    element={
                      <ProtectedRoute roles={["MANAGER", "HR", "ADMIN"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <Approvals />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/leave-types"
                    element={
                      <ProtectedRoute roles={["HR", "ADMIN"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <LeaveTypes />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/employee-directory"
                    element={
                      <ProtectedRoute roles={["MANAGER", "HR", "ADMIN"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <EmployeeDirectory />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/team-calendar"
                    element={
                      <ProtectedRoute roles={["MANAGER", "HR", "ADMIN"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <TeamCalendar />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <Attendance />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/files"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <Files />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/announcements"
                    element={
                      <ProtectedRoute roles={["HR", "ADMIN"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <Announcements />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <EmployeeProfile />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/:id"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <EmployeeProfile />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/expenses"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <Expenses />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/assets"
                    element={
                      <ProtectedRoute roles={["HR", "ADMIN"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <Assets />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />



                  <Route
                    path="/departments"
                    element={
                      <ProtectedRoute roles={["ADMIN"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <Departments />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/departments/:id"
                    element={
                      <ProtectedRoute roles={["ADMIN", "HR", "MANAGER"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <DepartmentDetails />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/project-tracker"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <ProjectTrackerLayout />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<TrackerIndexRedirect />} />
                    <Route path="projects" element={<ProjectsHub />} />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    <Route path="my-tasks" element={<EmployeeDashboard />} />
                    <Route path="daily-updates" element={<DailyUpdatesHistory />} />
                    <Route path="chat-rooms" element={<ProjectChatRooms />} />
                  </Route>

                  {/* Redirect old routes to Project Tracker */}
                  <Route path="/jira" element={<Navigate to="/project-tracker" replace />} />
                  <Route path="/work-management" element={<Navigate to="/project-tracker" replace />} />
                  <Route path="/tasks" element={<Navigate to="/project-tracker" replace />} />
                  <Route path="/task-management" element={<Navigate to="/project-tracker" replace />} />

                  <Route
                    path="/training/*"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <TrainingMaterials />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/field-visits"
                    element={
                      <ProtectedRoute
                        requireFieldEmployee={true}
                        roles={["EMPLOYEE", "MANAGER", "HR", "ADMIN"]}
                      >
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <FieldVisitsHub />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/my-field-work"
                    element={
                      <ProtectedRoute
                        requireFieldEmployee={true}
                        roles={["EMPLOYEE"]}
                      >
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <MyFieldWork />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/team-field-activity"
                    element={
                      <ProtectedRoute roles={["MANAGER", "HR", "ADMIN"]}>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <TeamFieldActivity />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/fpo-form"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <FpoFormPage />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/fpo-submissions"
                    element={
                      <ProtectedRoute>
                        <EnhancedLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <FpoSubmissions />
                          </Suspense>
                        </EnhancedLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>

                

              </div>
            </Router>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
