import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Badge,
  Table,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [files, setFiles] = useState([]);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [favoriteForm, setFavoriteForm] = useState({
    title: "",
    url: "",
    icon: "",
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    priority: "MEDIUM",
    targetRoles: [],
    expiryDate: "",
  });
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: "",
    type: "FESTIVAL",
    description: "",
  });
  const [fileForm, setFileForm] = useState({
    type: "ORGANIZATION",
    category: "",
    description: "",
    isPublic: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchAnnouncements();
    fetchHolidays();
    fetchFavorites();
    fetchFiles();

    // Auto-refresh announcements every 3 seconds
    const announcementInterval = setInterval(fetchAnnouncements, 3000);

    return () => clearInterval(announcementInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const fetchDashboardData = async () => {
    try {
      let endpoint = "/api/dashboard/employee";
      if (user?.role === "MANAGER") endpoint = "/api/dashboard/manager";
      if (["HR", "ADMIN"].includes(user?.role)) endpoint = "/api/dashboard/hr";

      const response = await api.get(endpoint);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get("/api/announcements");
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await api.get("/api/holidays");
      setHolidays(response.data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await api.get("/api/favorites");
      setFavorites(response.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await api.get("/api/files");
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleAddFavorite = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/favorites", favoriteForm);
      setShowFavoriteModal(false);
      setFavoriteForm({ title: "", url: "", icon: "" });
      fetchFavorites();
      toast.success("Favorite added successfully");
    } catch (error) {
      toast.error("Error adding favorite");
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/announcements", announcementForm);
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        title: "",
        content: "",
        priority: "MEDIUM",
        targetRoles: [],
        expiryDate: "",
      });
      fetchAnnouncements();
      toast.success("Announcement added successfully");
    } catch (error) {
      toast.error("Error adding announcement");
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/holidays", holidayForm);
      setShowHolidayModal(false);
      setHolidayForm({ name: "", date: "", type: "FESTIVAL", description: "" });
      fetchHolidays();
      toast.success("Holiday added successfully");
    } catch (error) {
      toast.error("Error adding holiday");
    }
  };

  const handleMarkHolidayAttendance = async (date) => {
    try {
      const response = await api.post("/api/attendance/mark-holiday", { date });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error marking holiday attendance",
      );
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      Object.keys(fileForm).forEach((key) => {
        formData.append(key, fileForm[key]);
      });

      await api.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowFileModal(false);
      setFileForm({
        type: "ORGANIZATION",
        category: "",
        description: "",
        isPublic: true,
      });
      setSelectedFile(null);
      fetchFiles();
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Error uploading file");
    }
  };

  const handleRoleChange = (role, checked) => {
    if (checked) {
      setAnnouncementForm({
        ...announcementForm,
        targetRoles: [...announcementForm.targetRoles, role],
      });
    } else {
      setAnnouncementForm({
        ...announcementForm,
        targetRoles: announcementForm.targetRoles.filter((r) => r !== role),
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      MANAGER_APPROVED: "info",
      HR_APPROVED: "success",
      REJECTED: "danger",
      CANCELLED: "secondary",
    };
    return (
      <Badge
        bg={variants[status] || "secondary"}
        className={`status-${status.toLowerCase()}`}
      >
        <i className={`fas fa-${getStatusIcon(status)} me-1`}></i>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: "clock",
      MANAGER_APPROVED: "check-circle",
      HR_APPROVED: "check-double",
      REJECTED: "times-circle",
      CANCELLED: "ban",
    };
    return icons[status] || "question-circle";
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="fade-in-up">
      {/* Motivational Quote for All Users */}
      {dashboardData?.motivationalQuote && (
        <Row className="mb-4">
          <Col>
            <Card
              className="modern-card quote-card"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}
            >
              <Card.Body className="text-center text-white py-4">
                <i
                  className="fas fa-quote-left fa-2x mb-3"
                  style={{ opacity: 0.7 }}
                ></i>
                <h5
                  className="mb-3"
                  style={{
                    fontStyle: "italic",
                    fontWeight: 300,
                    lineHeight: 1.6,
                  }}
                >
                  "{dashboardData.motivationalQuote.quote}"
                </h5>
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <small style={{ opacity: 0.9, fontWeight: 500 }}>
                    - {dashboardData.motivationalQuote.author}
                  </small>
                </div>
                <div className="d-flex align-items-center justify-content-center">
                  <div
                    className="bg-white rounded-circle p-2 me-2 d-flex align-items-center justify-content-centere"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <i className="fas fa-heart text-danger"></i>
                  </div>
                  <small style={{ opacity: 0.9 }}>
                    Stay motivated and have a great day!
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <div className="page-header d-flex align-items-center justify-content-between">
        <div>
          <h1 className="page-title mb-1">
            <i className="fas fa-tachometer-alt me-3"></i>
            Dashboard
          </h1>
          <p className="text-muted mb-0">
            Welcome back, {user?.firstName}! Here's your overview.
          </p>
        </div>
        <div className="text-end">
          <small className="text-muted d-block">Last updated</small>
          <small className="text-primary">{new Date().toLocaleString()}</small>
        </div>
      </div>

      {user?.role === "EMPLOYEE" && dashboardData && (
        <>
          <Row className="mb-4">
            <Col md={6}>
              <Card className="widget-card modern-card hover-lift">
                <Card.Header className="border-0 pb-0">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: "48px",
                        height: "48px",
                        background:
                          "linear-gradient(135deg, var(--primary-500), var(--primary-400))",
                      }}
                    >
                      <i className="fas fa-chart-pie text-white"></i>
                    </div>
                    <div>
                      <h6 className="card-title mb-0">Leave Balances</h6>
                      <small className="text-muted-modern">
                        Your available leaves
                      </small>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {dashboardData.balances
                      ?.filter((balance) => balance.leaveTypeId !== null)
                      .map((balance) => (
                        <Col md={6} key={balance._id} className="mb-3">
                          <div className="stats-card">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <h6 className="stats-label mb-0">
                                {balance.leaveTypeId?.name}
                              </h6>
                              <div
                                className="rounded-circle"
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  backgroundColor: balance.leaveTypeId?.color,
                                }}
                              ></div>
                            </div>
                            <div className="stats-number mb-2">
                              {balance.available}
                            </div>
                            <div className="d-flex justify-content-between text-sm">
                              <span className="text-muted">
                                Used: <strong>{balance.used}</strong>
                              </span>
                              <span className="text-warning">
                                Pending: <strong>{balance.pending}</strong>
                              </span>
                            </div>
                          </div>
                        </Col>
                      ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card
                className="widget-card modern-card hover-lift d-flex flex-column"
                style={{ height: "400px" }}
              >
                <Card.Header className="border-0 pb-0">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: "48px",
                        height: "48px",
                        background:
                          "linear-gradient(135deg, var(--info), #0891b2)",
                      }}
                    >
                      <i className="fas fa-bullhorn text-white"></i>
                    </div>
                    <div>
                      <h6 className="card-title mb-0">Announcements</h6>
                      <small className="text-muted-modern">
                        Latest updates
                      </small>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body
                  className="p-0 d-flex flex-column"
                  style={{ minHeight: 0 }}
                >
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                      overflowX: "hidden",
                      padding: "1rem",
                    }}
                    className="custom-scrollbar"
                  >
                    {announcements.length > 0 ? (
                      announcements.map((ann) => (
                        <div
                          key={ann._id}
                          style={{
                            marginBottom: "1rem",
                            paddingBottom: "1rem",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          <div className="d-flex align-items-start">
                            <div
                              className="me-3 d-flex align-items-center justify-content-center text-white rounded"
                              style={{
                                backgroundColor:
                                  ann.priority === "HIGH"
                                    ? "#ef4444"
                                    : ann.priority === "MEDIUM"
                                      ? "#f59e0b"
                                      : "#3b82f6",
                                width: "40px",
                                height: "40px",
                              }}
                            >
                              <i className="fas fa-bullhorn"></i>
                            </div>
                            <div style={{ flex: 1 }}>
                              <h6 className="mb-1">{ann.title}</h6>
                              <p className="text-muted small mb-0">
                                {ann.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted mb-0">No announcements</p>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Upcoming Holidays & Files */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <i className="fas fa-calendar-alt me-2 text-success"></i>
                  Upcoming Holidays
                </Card.Header>
                <Card.Body>
                  {holidays
                    .filter((h) => new Date(h.date) >= new Date())
                    .slice(0, 5)
                    .map((holiday) => (
                      <div
                        key={holiday._id}
                        className="d-flex justify-content-between align-items-center mb-2"
                      >
                        <div>
                          <strong>{holiday.name}</strong>
                          <br />
                          <small className="text-muted">
                            {new Date(holiday.date).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge
                            bg={
                              holiday.type === "FESTIVAL" ? "warning" : "info"
                            }
                          >
                            {holiday.type}
                          </Badge>
                          {["HR", "ADMIN"].includes(user?.role) && (
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() =>
                                handleMarkHolidayAttendance(holiday.date)
                              }
                              title="Mark attendance for all employees"
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <i className="fas fa-file me-2 text-primary"></i>Recent Files
                </Card.Header>
                <Card.Body style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {files.slice(0, 5).map((file) => (
                    <div
                      key={file._id}
                      className="d-flex justify-content-between align-items-center mb-2"
                    >
                      <div>
                        <strong>{file.name}</strong>
                        <br />
                        <small className="text-muted">{file.category}</small>
                      </div>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        href={`/api/files/download/${file._id}`}
                      >
                        <i className="fas fa-download"></i>
                      </Button>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>
                    <i className="fas fa-star me-2 text-warning"></i>Quick Links
                  </span>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => setShowFavoriteModal(true)}
                  >
                    <i className="fas fa-plus"></i>
                  </Button>
                </Card.Header>
                <Card.Body>
                  {favorites.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {favorites.map((fav) => (
                        <Button
                          key={fav._id}
                          variant="outline-secondary"
                          size="sm"
                          href={fav.url}
                          target="_blank"
                        >
                          {fav.icon && (
                            <i className={`fas fa-${fav.icon} me-1`}></i>
                          )}
                          {fav.title}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">No quick links added</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="modern-card h-100">
                <Card.Header className="d-flex align-items-center">
                  <i className="fas fa-calendar-plus me-2 text-success"></i>
                  Upcoming Leaves
                </Card.Header>
                <Card.Body>
                  {dashboardData.upcomingLeaves?.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <tbody>
                          {dashboardData.upcomingLeaves.map((leave) => (
                            <tr key={leave._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div
                                    className="rounded me-2"
                                    style={{
                                      width: "4px",
                                      height: "30px",
                                      backgroundColor:
                                        leave.leaveTypeId?.color || "#6366f1",
                                    }}
                                  ></div>
                                  <div>
                                    <div className="fw-semibold">
                                      {leave.leaveTypeId?.name}
                                    </div>
                                    <small className="text-muted">
                                      {new Date(
                                        leave.startDate,
                                      ).toLocaleDateString()}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="text-end">
                                <Badge
                                  bg="light"
                                  text="dark"
                                  className="badge-modern"
                                >
                                  {leave.days} days
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i
                        className="fas fa-calendar-times text-muted fs-1 mb-3"
                        style={{ color: "#94a3b8" }}
                      ></i>
                      <p className="text-muted mb-0">No upcoming leaves</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="modern-card h-100">
                <Card.Header className="d-flex align-items-center">
                  <i className="fas fa-history me-2 text-info"></i>
                  Recent Leave History
                </Card.Header>
                <Card.Body>
                  {dashboardData.recentLeaves?.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <tbody>
                          {dashboardData.recentLeaves
                            .slice(0, 5)
                            .map((leave) => (
                              <tr key={leave._id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="rounded me-2"
                                      style={{
                                        width: "4px",
                                        height: "30px",
                                        backgroundColor:
                                          leave.leaveTypeId?.color || "#6366f1",
                                      }}
                                    ></div>
                                    <div>
                                      <div className="fw-semibold">
                                        {leave.leaveTypeId?.name}
                                      </div>
                                      <small className="text-muted">
                                        {new Date(
                                          leave.startDate,
                                        ).toLocaleDateString()}
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-end">
                                  {getStatusBadge(leave.status)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i
                        className="fas fa-file-alt text-muted fs-1 mb-3"
                        style={{ color: "#94a3b8" }}
                      ></i>
                      <p className="text-muted mb-0">No leave history</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {user?.role === "MANAGER" && dashboardData && (
        <>
          <Row className="mb-4">
            <Col md={6}>
              <Card className="dashboard-card h-100">
                <Card.Header className="d-flex align-items-center">
                  <i className="fas fa-tasks me-2 text-warning"></i>
                  Pending Approvals (
                  {dashboardData.pendingApprovals?.length || 0})
                </Card.Header>
                <Card.Body>
                  {dashboardData.pendingApprovals?.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <tbody>
                          {dashboardData.pendingApprovals
                            .slice(0, 5)
                            .map((request) => (
                              <tr key={request._id}>
                                <td>
                                  <div className="fw-semibold">
                                    {request.userId?.firstName}{" "}
                                    {request.userId?.lastName}
                                  </div>
                                  <small className="text-muted">
                                    {request.leaveTypeId?.name}
                                  </small>
                                </td>
                                <td className="text-end">
                                  <div className="fw-semibold">
                                    {request.days} days
                                  </div>
                                  <small className="text-muted">
                                    {new Date(
                                      request.startDate,
                                    ).toLocaleDateString()}
                                  </small>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="fas fa-check-circle text-success fs-1 mb-3"></i>
                      <p className="text-muted mb-0">No pending approvals</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="dashboard-card h-100">
                <Card.Header className="d-flex align-items-center">
                  <i className="fas fa-users me-2 text-primary"></i>
                  Team Summary
                </Card.Header>
                <Card.Body>
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="dashboard-stat">
                        {dashboardData.teamMembers?.length || 0}
                      </div>
                      <p className="text-muted mb-0">Team Members</p>
                    </div>
                    <div className="col-6">
                      <div className="dashboard-stat">
                        {dashboardData.teamCalendar?.length || 0}
                      </div>
                      <p className="text-muted mb-0">Upcoming Leaves</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {["HR", "ADMIN"].includes(user?.role) && dashboardData && (
        <>
          {/* Admin Controls */}
          <Row className="mb-4">
            <Col>
              <Card className="modern-card">
                <Card.Header>Admin Controls</Card.Header>
                <Card.Body>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant="primary"
                      onClick={() => setShowAnnouncementModal(true)}
                      className="btn-modern"
                    >
                      <i className="fas fa-bullhorn me-1"></i>Add Announcement
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => setShowHolidayModal(true)}
                      className="btn-modern"
                    >
                      <i className="fas fa-calendar-plus me-1"></i>Add Holiday
                    </Button>
                    <Button
                      variant="info"
                      onClick={() => setShowFileModal(true)}
                      className="btn-modern"
                    >
                      <i className="fas fa-upload me-1"></i>Upload File
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Birthdays & New Hires */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="card-scrollable">
                <Card.Header>
                  <i className="fas fa-birthday-cake me-2 text-warning"></i>
                  Upcoming Birthdays
                </Card.Header>
                <Card.Body>
                  {dashboardData.upcomingBirthdays?.length > 0 ? (
                    dashboardData.upcomingBirthdays.map((emp) => (
                      <div
                        key={emp._id}
                        className="d-flex justify-content-between align-items-center mb-2"
                      >
                        <div>
                          <strong>
                            {emp.firstName} {emp.lastName}
                          </strong>
                          <br />
                          <small className="text-muted">{emp.department}</small>
                        </div>
                        <Badge bg="warning">
                          {new Date(emp.dateOfBirth).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted mb-0">No upcoming birthdays</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="card-scrollable">
                <Card.Header>
                  <i className="fas fa-user-plus me-2 text-success"></i>New
                  Hires (Last 30 days)
                </Card.Header>
                <Card.Body>
                  {dashboardData.newHires?.length > 0 ? (
                    dashboardData.newHires.map((emp) => (
                      <div
                        key={emp._id}
                        className="d-flex justify-content-between align-items-center mb-2"
                      >
                        <div>
                          <strong>
                            {emp.firstName} {emp.lastName}
                          </strong>
                          <br />
                          <small className="text-muted">{emp.department}</small>
                        </div>
                        <Badge bg="success">
                          {new Date(emp.joinDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted mb-0">No new hires</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col md={3}>
              <div className="stats-card text-center h-100">
                <div
                  className="stats-icon mx-auto"
                  style={{ backgroundColor: "#6366f1" }}
                >
                  <i className="fas fa-users"></i>
                </div>
                <div className="stats-number">
                  {dashboardData.totalEmployees}
                </div>
                <p className="stats-label mb-0">Total Employees</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="stats-card text-center h-100">
                <div
                  className="stats-icon mx-auto"
                  style={{ backgroundColor: "#06b6d4" }}
                >
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stats-number">
                  {dashboardData.pendingApprovals}
                </div>
                <p className="stats-label mb-0">Pending Approvals</p>
              </div>
            </Col>
            <Col md={6}>
              <Card className="modern-card h-100">
                <Card.Header className="d-flex align-items-center">
                  <i className="fas fa-chart-bar me-2 text-info"></i>
                  Leave Statistics
                </Card.Header>
                <Card.Body>
                  {dashboardData.leaveStats?.map((stat) => (
                    <div
                      key={stat._id}
                      className="d-flex justify-content-between align-items-center mb-2"
                    >
                      <span className="fw-semibold">
                        <i
                          className={`fas fa-${getStatusIcon(stat._id)} me-2`}
                          style={{ color: "#6366f1" }}
                        ></i>
                        {stat._id.replace("_", " ")}:
                      </span>
                      <span>
                        <Badge
                          bg="light"
                          text="dark"
                          className="me-1 badge-modern"
                        >
                          {stat.count} requests
                        </Badge>
                        <Badge bg="primary" className="badge-modern">
                          {stat.totalDays} days
                        </Badge>
                      </span>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
      {/* Modals */}
      <Modal
        show={showFavoriteModal}
        onHide={() => setShowFavoriteModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Quick Link</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddFavorite}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={favoriteForm.title}
                onChange={(e) =>
                  setFavoriteForm({ ...favoriteForm, title: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL</Form.Label>
              <Form.Control
                type="url"
                value={favoriteForm.url}
                onChange={(e) =>
                  setFavoriteForm({ ...favoriteForm, url: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Icon (FontAwesome class)</Form.Label>
              <Form.Control
                type="text"
                value={favoriteForm.icon}
                onChange={(e) =>
                  setFavoriteForm({ ...favoriteForm, icon: e.target.value })
                }
                placeholder="e.g., link, external-link-alt"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowFavoriteModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Link
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {["HR", "ADMIN"].includes(user?.role) && (
        <>
          <Modal
            show={showAnnouncementModal}
            onHide={() => setShowAnnouncementModal(false)}
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Add Announcement</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleAddAnnouncement}>
              <Modal.Body>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={announcementForm.title}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            title: e.target.value,
                          })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Priority</Form.Label>
                      <Form.Select
                        value={announcementForm.priority}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            priority: e.target.value,
                          })
                        }
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={announcementForm.content}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        content: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Target Roles</Form.Label>
                      <div>
                        {["EMPLOYEE", "MANAGER", "HR", "ADMIN"].map((role) => (
                          <Form.Check
                            key={role}
                            type="checkbox"
                            label={role}
                            checked={announcementForm.targetRoles.includes(
                              role,
                            )}
                            onChange={(e) =>
                              handleRoleChange(role, e.target.checked)
                            }
                          />
                        ))}
                      </div>
                      <Form.Text className="text-muted">
                        Leave empty to target all roles
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Expiry Date (Optional)</Form.Label>
                      <Form.Control
                        type="date"
                        value={announcementForm.expiryDate}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            expiryDate: e.target.value,
                          })
                        }
                      />
                      <Form.Text className="text-muted">
                        Leave empty for no expiry
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowAnnouncementModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Add Announcement
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          <Modal
            show={showHolidayModal}
            onHide={() => setShowHolidayModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Add Holiday</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleAddHoliday}>
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Holiday Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={holidayForm.name}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={holidayForm.date}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, date: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={holidayForm.type}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, type: e.target.value })
                    }
                  >
                    <option value="FESTIVAL">Festival</option>
                    <option value="NATIONAL">National</option>
                    <option value="COMPANY">Company</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={holidayForm.description}
                    onChange={(e) =>
                      setHolidayForm({
                        ...holidayForm,
                        description: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowHolidayModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Add Holiday
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          <Modal show={showFileModal} onHide={() => setShowFileModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Upload File</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleFileUpload}>
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>File</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={fileForm.type}
                    onChange={(e) =>
                      setFileForm({ ...fileForm, type: e.target.value })
                    }
                  >
                    <option value="ORGANIZATION">Organization File</option>
                    <option value="EMPLOYEE">Employee File</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    value={fileForm.category}
                    onChange={(e) =>
                      setFileForm({ ...fileForm, category: e.target.value })
                    }
                    placeholder="e.g., Policy, Handbook, Form"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={fileForm.description}
                    onChange={(e) =>
                      setFileForm({ ...fileForm, description: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Make public to all employees"
                    checked={fileForm.isPublic}
                    onChange={(e) =>
                      setFileForm({ ...fileForm, isPublic: e.target.checked })
                    }
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowFileModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Upload File
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </>
      )}
    </div>
  );
};

export default Dashboard;
