import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Table, Badge, Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import './AttendanceEnhancements.css';

const Attendance = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weekSummary, setWeekSummary] = useState({
    presentDays: 0,
    totalHours: 0,
    lateDays: 0,
    absentDays: 0,
  });

  // Edit/Delete states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    checkIn: "",
    checkOut: "",
    status: "",
    totalHours: "",
    editReason: "",
  });
  const [deleteReason, setDeleteReason] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTodayStatus(selectedUser);
    fetchAttendanceHistory(selectedUser);
    fetchWeekSummary(selectedUser);

    if (
      user?.role &&
      ["MANAGER", "HR", "ADMIN"].includes(user.role) &&
      employees.length === 0
    ) {
      fetchEmployees();
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [selectedUser, showDeleted]);

  const fetchTodayStatus = async (userId = "") => {
    try {
      let url = "/api/attendance/today";
      if (userId && userId.trim() !== "") {
        url += `?userId=${userId}`;
      } else if (["MANAGER", "HR", "ADMIN"].includes(user?.role)) {
        // For "All" option, pass empty or "all" to get aggregated data
        url += "?userId=all";
      }

      const response = await api.get(url);
      const data = response.data;

      if (!data) {
        setTodayStatus(null);
        return;
      }

      // Handle aggregated data for "All" option
      if (data.isAggregated) {
        setTodayStatus({
          ...data,
          hasCheckedIn: false, // Not applicable for aggregated view
          hasCheckedOut: false, // Not applicable for aggregated view
          checkInTime: null,
          checkOutTime: null,
          isAggregated: true
        });
      } else {
        setTodayStatus({
          ...data,
          hasCheckedIn: Boolean(data.checkInTime || data.checkIn),
          hasCheckedOut: Boolean(data.checkOutTime || data.checkOut),
          checkInTime: data.checkInTime || data.checkIn,
          checkOutTime: data.checkOutTime || data.checkOut,
        });
      }
      
      console.log('Today Status Updated:', data);
    } catch (error) {
      console.error("Error fetching today status:", error);
      setTodayStatus(null);
    }
  };

  const fetchAttendanceHistory = async (userId = "") => {
    try {
      let url = "/api/attendance?limit=50";
      if (userId) url += `&userId=${userId}`;
      if (showDeleted) url += `&includeDeleted=true`;
      const response = await api.get(url);
      setAttendanceHistory(response.data.attendance || response.data);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    }
  };

  const fetchWeekSummary = async (userId = "") => {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      let url = `/api/attendance?startDate=${startOfWeek.toISOString().split("T")[0]}&endDate=${endOfWeek.toISOString().split("T")[0]}&limit=1000`;
      
      // Only add userId filter if it's not empty (for specific user selection)
      if (userId && userId.trim() !== "") {
        url += `&userId=${userId}`;
      }
      // If userId is empty, it will fetch all employees' data for admin/hr/manager

      const response = await api.get(url);
      const records = response.data.attendance || [];

      const summary = records.reduce(
        (acc, record) => {
          if (record.status === "Present") acc.presentDays++;
          if (record.status === "Late") acc.lateDays++;
          if (record.status === "Absent") acc.absentDays++;
          acc.totalHours += record.totalHours || 0;
          return acc;
        },
        { presentDays: 0, totalHours: 0, lateDays: 0, absentDays: 0 },
      );

      setWeekSummary(summary);
    } catch (error) {
      console.error("Error fetching week summary:", error);
      setWeekSummary({ presentDays: 0, totalHours: 0, lateDays: 0, absentDays: 0 });
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/api/employees/directory");
      const profiles = response.data.profiles || [];
      const users = profiles.map((p) => p.userId).filter(Boolean);
      setEmployees(users);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleCheckIn = async () => {
    if (selectedUser && selectedUser !== user?.id) {
      return toast.error("Cannot check in for another user");
    }

    setLoading(true);

    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation not supported by your browser");
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      await api.post("/api/attendance/checkin", { location });

      toast.success("Checked in successfully");
      
      // Refresh data immediately
      await fetchTodayStatus(selectedUser);
      await fetchAttendanceHistory(selectedUser);
      await fetchWeekSummary(selectedUser);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to check in. Please enable location.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*fixed bug: checkout button*/
  const handleCheckOut = async () => {
    if (loading) return;

    if (selectedUser && selectedUser !== user?.id) {
      return toast.error("Cannot check out for another user");
    }

    if (!todayStatus?.hasCheckedIn) {
      return toast.error("Please check in first");
    }

    if (todayStatus?.hasCheckedOut) {
      return toast.error("Already checked out");
    }

    setLoading(true);

    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation not supported by your browser");
        setLoading(false);
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      const { data } = await api.post("/api/attendance/checkout", { location });

      toast.success(data.message || "Checked out successfully");

      // Refresh UI data
      await Promise.all([
        fetchTodayStatus(selectedUser),
        fetchAttendanceHistory(selectedUser),
      ]);
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Unable to check out. Please enable location.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      Present: { bg: "success", icon: "check-circle" },
      Absent: { bg: "danger", icon: "times-circle" },
      "Half Day": { bg: "warning", icon: "clock" },
      Late: { bg: "warning", icon: "exclamation-triangle" },
      "On Leave": { bg: "info", icon: "calendar-alt" },
      LOP: { bg: "danger", icon: "ban" },
    };
    const { bg, icon } = config[status] || { bg: "secondary", icon: "question" };
    return (
      <Badge bg={bg} className="status-badge-enhanced">
        <i className={`fas fa-${icon}`}></i>
        {status}
      </Badge>
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
    });
  };
 
  const formatTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
  };

  const formatDuration = (hours = 0) => {
    if (!hours || isNaN(hours)) return "0h 0m";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const downloadCSV = async () => {
    try {
      const params = new URLSearchParams();
      params.append("startDate", dateRange.startDate);
      params.append("endDate", dateRange.endDate);
      if (selectedUser) params.append("userId", selectedUser);

      const resp = await api.get(`/api/attendance/report?${params.toString()}`);
      const rows = resp.data.attendance || [];
      const headers = [
        "Employee",
        "Date",
        "Check In",
        "Check Out",
        "Total Hours",
        "Status",
      ];
      const csv = [headers.join(",")]
        .concat(
          rows.map((r) => {
            const emp = r.userId
              ? `${r.userId.firstName || ""} ${r.userId.lastName || ""}`.trim()
              : "";
            const date = new Date(r.date).toLocaleDateString("en-GB");
            const checkIn = r.checkIn
              ? new Date(r.checkIn).toLocaleTimeString()
              : "";
            const checkOut = r.checkOut
              ? new Date(r.checkOut).toLocaleTimeString()
              : "";
            const total = r.totalHours
              ? `${Math.floor(r.totalHours)}h ${Math.floor(
                  (r.totalHours - Math.floor(r.totalHours)) * 60,
                )}m`
              : "";
            const status = r.status || "";
            return `"${emp}","${date}","${checkIn}","${checkOut}","${total}","${status}"`;
          }),
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setShowDownloadModal(false);
      toast.success("Report downloaded successfully");
    } catch (error) {
      toast.error("Error generating report");
      console.error(error);
    }
  };

  // Handler: Open edit modal
  const handleEditClick = (record) => {
    setEditingRecord(record);
    
    // Format dates properly for datetime-local input
    const formatForInput = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setEditForm({
      checkIn: formatForInput(record.checkIn),
      checkOut: formatForInput(record.checkOut),
      status: record.status || "",
      totalHours: record.totalHours || "",
      editReason: "",
    });
    setShowEditModal(true);
  };

  // Calculate total hours when check-in or check-out changes
  const calculateTotalHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    if (diffMs < 0) return "";
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100;
  };

  // Handle check-in/out time change
  const handleTimeChange = (field, value) => {
    const newForm = { ...editForm, [field]: value };
    if (field === 'checkIn' || field === 'checkOut') {
      const totalHours = calculateTotalHours(newForm.checkIn, newForm.checkOut);
      newForm.totalHours = totalHours;
    }
    setEditForm(newForm);
  };

  // Handler: Save edited attendance
  const handleSaveEdit = async () => {
    if (!editForm.editReason || editForm.editReason.trim().length < 10) {
      return toast.error("Please provide a reason (minimum 10 characters)");
    }

    setSaveLoading(true);
    try {
      await api.put(`/api/attendance/${editingRecord._id}`, editForm);
      toast.success("Attendance updated successfully");
      setShowEditModal(false);
      fetchAttendanceHistory(selectedUser);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update attendance");
    } finally {
      setSaveLoading(false);
    }
  };

  // Handler: Open delete modal
  const handleDeleteClick = (record) => {
    setEditingRecord(record);
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  // Handler: Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteReason || deleteReason.trim().length < 10) {
      return toast.error("Please provide a reason (minimum 10 characters)");
    }

    try {
      await api.delete(`/api/attendance/${editingRecord._id}`, {
        data: { deletionReason: deleteReason },
      });
      toast.success("Attendance deleted successfully");
      setShowDeleteModal(false);
      fetchAttendanceHistory(selectedUser);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete attendance");
    }
  };

  // Handler: View edit details (for employees)
  const handleViewDetails = (record) => {
    setEditingRecord(record);
    setShowDetailsModal(true);
  };

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-clock me-3 text-primary"></i>
          Attendance Tracking
        </h1>
        <p className="text-muted mb-0">
          Track your daily attendance and working hours
        </p>
      </div>

      <Row className="mb-4">
        {/* Today's Status */}
        <Col lg={8} className="mb-3 mb-lg-0">
          <Card className="h-100 shadow-sm attendance-card">
            <Card.Header className="d-flex align-items-center justify-content-between bg-light">
              <div className="d-flex align-items-center gap-3">
                <i className="fas fa-calendar-day me-2 text-primary"></i>
                <div>
                  <div>Today's Attendance</div>
                  <small className="text-muted">
                    {todayStatus?.user
                      ? `${todayStatus.user.firstName || ""} ${
                          todayStatus.user.lastName || ""
                        }`
                      : ""}
                  </small>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                {user?.role &&
                  ["MANAGER", "HR", "ADMIN"].includes(user.role) && (
                    <Form.Select
                      size="sm"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      style={{ width: "220px" }}
                    >
                      <option value="">View Self / All</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                <div className="text-muted fs-6">
                  {currentTime.toLocaleDateString("en-GB")} -{" "}
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {todayStatus ? (
                todayStatus.isAggregated ? (
                  // Aggregated view for "All" employees
                  <Row>
                    <Col md={3}>
                      <div className="text-center p-3 bg-light rounded">
                        <h4 className="text-primary mb-1">
                          {todayStatus.summary?.totalEmployees || 0}
                        </h4>
                        <small className="text-muted">Total Employees</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center p-3 bg-light rounded">
                        <h4 className="text-success mb-1">
                          {todayStatus.summary?.checkedIn || 0}
                        </h4>
                        <small className="text-muted">Checked In</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center p-3 bg-light rounded">
                        <h4 className="text-danger mb-1">
                          {todayStatus.summary?.checkedOut || 0}
                        </h4>
                        <small className="text-muted">Checked Out</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center p-3 bg-light rounded">
                        <h4 className="text-info mb-1">
                          {formatDuration(todayStatus.summary?.totalHours || 0)}
                        </h4>
                        <small className="text-muted">Total Hours</small>
                      </div>
                    </Col>
                  </Row>
                ) : (
                  // Individual employee view
                  <Row>
                    <Col md={6}>
                      <div className="checkin-section">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="mb-1">Check In</h6>
                            <div className="time-display">
                              {formatTime(todayStatus.checkInTime)}
                            </div>
                          </div>
                          <div className="text-end">
                            {!selectedUser || selectedUser === user?.id ? (
                              !todayStatus.hasCheckedIn ? (
                                <Button
                                  variant="success"
                                  onClick={handleCheckIn}
                                  disabled={loading}
                                  className="attendance-btn btn-ripple"
                                >
                                  {loading ? (
                                    <div className="loading-spinner me-2"></div>
                                  ) : (
                                    <i className="fas fa-sign-in-alt me-2"></i>
                                  )}
                                  Check In
                                </Button>
                              ) : (
                                <Badge bg="success" className="status-badge-enhanced fs-6">
                                  <i className="fas fa-check"></i>
                                  Checked In
                                </Badge>
                              )
                            ) : todayStatus.hasCheckedIn ? (
                              <Badge bg="success" className="status-badge-enhanced fs-6">
                                Checked In
                              </Badge>
                            ) : (
                              <Badge bg="secondary" className="status-badge-enhanced fs-6">
                                No Record
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="checkout-section">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="mb-1">Check Out</h6>
                            <div className="time-display">
                              {formatTime(todayStatus.checkOutTime)}
                            </div>
                          </div>
                          <div className="text-end">
                            {!selectedUser || selectedUser === user?.id ? (
                              !todayStatus.hasCheckedOut &&
                              todayStatus.hasCheckedIn ? (
                                <Button
                                  variant="danger"
                                  onClick={handleCheckOut}
                                  disabled={loading}
                                  className="attendance-btn btn-ripple"
                                >
                                  {loading ? (
                                    <div className="loading-spinner me-2"></div>
                                  ) : (
                                    <i className="fas fa-sign-out-alt me-2"></i>
                                  )}
                                  Check Out
                                </Button>
                              ) : todayStatus.hasCheckedOut ? (
                                <Badge bg="danger" className="status-badge-enhanced fs-6">
                                  <i className="fas fa-check"></i>
                                  Checked Out
                                </Badge>
                              ) : (
                                <Badge bg="secondary" className="status-badge-enhanced fs-6">
                                  Pending
                                </Badge>
                              )
                            ) : todayStatus.hasCheckedOut ? (
                              <Badge bg="danger" className="status-badge-enhanced fs-6">
                                Checked Out
                              </Badge>
                            ) : (
                              <Badge bg="secondary" className="status-badge-enhanced fs-6">
                                No Record
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="text-center p-3 bg-light rounded">
                        <h4 className="text-primary mb-1">
                          {formatDuration(todayStatus.totalHours)}
                        </h4>
                        <small className="text-muted">Total Hours</small>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="text-center p-3 bg-light rounded">
                        <h4 className="mb-1">
                          {getStatusBadge(todayStatus.status)}
                        </h4>
                        <small className="text-muted">Status</small>
                      </div>
                    </Col>
                  </Row>
                )
              ) : (
                <div className="text-center py-4">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                  ></div>
                  <p className="text-muted">Loading today's status...</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col lg={4}>
          <Card className="h-100 shadow-sm attendance-card">
            <Card.Header className="d-flex align-items-center bg-light">
              <i className="fas fa-chart-bar me-2 text-success"></i>
              This Week Summary
            </Card.Header>
            <Card.Body>
              {/* Present Days Progress */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted fw-semibold">Present Days</small>
                  <span className="text-success fw-bold">
                    {selectedUser ? `${weekSummary.presentDays}/7` : weekSummary.presentDays}
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ 
                      width: selectedUser 
                        ? `${(weekSummary.presentDays / 7) * 100}%`
                        : employees.length > 0 
                          ? `${Math.min((weekSummary.presentDays / (employees.length * 7)) * 100, 100)}%`
                          : `${Math.min((weekSummary.presentDays / 7) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <small className="text-muted">
                  {selectedUser 
                    ? `${Math.round((weekSummary.presentDays / 7) * 100)}%`
                    : employees.length > 0
                      ? `${Math.round(Math.min((weekSummary.presentDays / (employees.length * 7)) * 100, 100))}%`
                      : `${Math.round(Math.min((weekSummary.presentDays / 7) * 100, 100))}%`
                  }
                </small>
              </div>

              {/* Total Hours Progress */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted fw-semibold">Total Hours</small>
                  <span className="text-primary fw-bold">
                    {formatDuration(weekSummary.totalHours)}
                    {selectedUser ? "/45h" : ""}
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ 
                      width: selectedUser 
                        ? `${Math.min((weekSummary.totalHours / 45) * 100, 100)}%`
                        : employees.length > 0
                          ? `${Math.min((weekSummary.totalHours / (employees.length * 45)) * 100, 100)}%`
                          : `${Math.min((weekSummary.totalHours / 45) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <small className="text-muted">
                  {selectedUser 
                    ? `${Math.round(Math.min((weekSummary.totalHours / 45) * 100, 100))}%`
                    : employees.length > 0
                      ? `${Math.round(Math.min((weekSummary.totalHours / (employees.length * 45)) * 100, 100))}%`
                      : `${Math.round(Math.min((weekSummary.totalHours / 45) * 100, 100))}%`
                  }
                </small>
              </div>

              {/* Late & Absent Stats */}
              <div className="row mt-3">
                <div className="col-6">
                  <div className="text-center p-2 bg-light rounded">
                    <div className="text-warning fs-5 fw-bold">{weekSummary.lateDays}</div>
                    <small className="text-muted">Late Days</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-2 bg-light rounded">
                    <div className="text-danger fs-5 fw-bold">{weekSummary.absentDays}</div>
                    <small className="text-muted">Absent Days</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Attendance History */}
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center justify-content-between bg-light">
          <i className="fas fa-history me-2 text-info"></i>
          <div>Recent Attendance History</div>
          <div className="d-flex align-items-center gap-2">
            {user?.role && ["MANAGER", "HR", "ADMIN"].includes(user.role) && (
              <>
                {/* Toggle for deleted records */}
                {["ADMIN", "HR"].includes(user?.role) && (
                  <Form.Check
                    type="switch"
                    id="show-deleted-switch"
                    label="Show Deleted"
                    checked={showDeleted}
                    onChange={(e) => setShowDeleted(e.target.checked)}
                    className="me-2"
                  />
                )}
                <Form.Select
                  size="sm"
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    fetchAttendanceHistory(e.target.value);
                  }}
                  style={{ width: "220px" }}
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </Form.Select>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => setShowDownloadModal(true)}
                >
                  <i className="fas fa-download me-1"></i>Download
                </Button>
              </>
            )}
          </div>
        </Card.Header>
        <Card.Body style={{ padding: 0 }}>
          {attendanceHistory.length > 0 ? (
            <div
              className="table-responsive"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              <Table hover className="mb-0 attendance-table">
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                    borderBottom: "2px solid #e2e8f0",
                  }}
                >
                  <tr>
                    <th
                      style={{
                        color: "#475569",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        padding: "1rem",
                      }}
                    >
                      Date
                    </th>
                    {user?.role &&
                      ["MANAGER", "HR", "ADMIN"].includes(user.role) && (
                        <th
                          style={{
                            color: "#475569",
                            fontWeight: "600",
                            fontSize: "0.875rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.025em",
                            padding: "1rem",
                          }}
                        >
                          Employee
                        </th>
                      )}
                    <th
                      style={{
                        color: "#475569",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        padding: "1rem",
                      }}
                    >
                      Check In
                    </th>
                    <th
                      style={{
                        color: "#475569",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        padding: "1rem",
                      }}
                    >
                      Check Out
                    </th>
                    <th
                      style={{
                        color: "#475569",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        padding: "1rem",
                      }}
                    >
                      Total Hours
                    </th>
                    <th
                      style={{
                        color: "#475569",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        padding: "1rem",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        color: "#475569",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        padding: "1rem",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((record) => {
                    const statusClass = record.status === 'Present' ? 'status-present' : 
                                       record.status === 'Absent' ? 'status-absent' : 
                                       record.status === 'Late' ? 'status-late' : 
                                       record.status === 'Half Day' ? 'status-halfday' : '';
                    return (
                    <tr key={record._id} className={`smooth-transition ${statusClass}`} style={record.isDeleted ? { backgroundColor: '#ffe6e6' } : {}}>
                      <td>{formatDate(record.date)}</td>
                      {user?.role &&
                        ["MANAGER", "HR", "ADMIN"].includes(user.role) && (
                          <td>
                            {record.userId
                              ? `${record.userId.firstName} ${record.userId.lastName}`
                              : ""}
                          </td>
                        )}
                      <td>{formatTime(record.checkIn)}</td>
                      <td>
                        {formatTime(record.checkOut)}
                        {record.isAutoCheckout && (
                          <Badge 
                            className="ms-2" 
                            title="Automatically checked out at 6:00 PM"
                            style={{
                              backgroundColor: '#6366f1',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #4f46e5'
                            }}
                          >
                            <i className="fas fa-robot me-1"></i>
                            AUTO
                          </Badge>
                        )}
                      </td>
                      <td>{formatDuration(record.totalHours)}</td>
                      <td>
                        {getStatusBadge(record.status)}
                        {record.isDeleted && (
                          <Badge bg="danger" className="ms-2">
                            <i className="fas fa-trash me-1"></i>
                            Deleted
                          </Badge>
                        )}
                      </td>
                      <td>
                        {/* Show deleted info for Admin/HR */}
                        {record.isDeleted && ["ADMIN", "HR"].includes(user?.role) ? (
                          <div className="text-muted small">
                            <div>Deleted by: {record.deletedBy?.firstName} {record.deletedBy?.lastName}</div>
                            <div>Reason: {record.deletionReason}</div>
                          </div>
                        ) : (
                          <>
                            {/* Admin/HR: Show Edit/Delete buttons */}
                            {["ADMIN", "HR"].includes(user?.role) && !record.isDeleted && (
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditClick(record)}
                                  title="Edit attendance"
                                  style={{ padding: '4px 12px' }}
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteClick(record)}
                                  title="Delete attendance"
                                  style={{ padding: '4px 12px' }}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            )}

                            {/* Employee: Show edited badge and view icon */}
                            {user?.role === "EMPLOYEE" && record.lastEditedBy && (
                              <div className="d-flex align-items-center gap-2">
                                <Badge bg="info" className="me-1">
                                  <i className="fas fa-pencil-alt me-1"></i>
                                  Edited
                                </Badge>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                  onClick={() => handleViewDetails(record)}
                                  title="View edit details"
                                >
                                  <i className="fas fa-eye text-info"></i>
                                </Button>
                              </div>
                            )}

                            {/* Employee: No edit - show nothing */}
                            {user?.role === "EMPLOYEE" && !record.lastEditedBy && (
                              <span className="text-muted">-</span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times text-muted fs-1 mb-3"></i>
              <p className="text-muted mb-0">No attendance records found</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-edit me-2 text-primary"></i>
            Edit Attendance
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingRecord && (
            <div>
              <div className="mb-3 p-3 bg-light rounded">
                <strong>Employee:</strong> {editingRecord.userId?.firstName} {editingRecord.userId?.lastName}
                <br />
                <strong>Date:</strong> {formatDate(editingRecord.date)}
              </div>

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Check-In Time</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={editForm.checkIn}
                        onChange={(e) => handleTimeChange('checkIn', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Check-Out Time</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={editForm.checkOut}
                        onChange={(e) => handleTimeChange('checkOut', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Late">Late</option>
                        <option value="On Leave">On Leave</option>
                        <option value="LOP">LOP</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Total Hours</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        value={editForm.totalHours}
                        onChange={(e) => setEditForm({ ...editForm, totalHours: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Reason for Edit <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Minimum 10 characters required"
                    value={editForm.editReason}
                    onChange={(e) => setEditForm({ ...editForm, editReason: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    {editForm.editReason.length}/10 characters
                  </Form.Text>
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={saveLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={saveLoading}>
            {saveLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Save Changes
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-trash me-2 text-danger"></i>
            Delete Attendance Record
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingRecord && (
            <div>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Warning:</strong> This action cannot be undone!
              </div>

              <div className="mb-3 p-3 bg-light rounded">
                <strong>Employee:</strong> {editingRecord.userId?.firstName} {editingRecord.userId?.lastName}
                <br />
                <strong>Date:</strong> {formatDate(editingRecord.date)}
                <br />
                <strong>Status:</strong> {editingRecord.status}
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Reason for Deletion <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Minimum 10 characters required"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    {deleteReason.length}/10 characters
                  </Form.Text>
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            <i className="fas fa-trash me-2"></i>
            Confirm Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Download Date Range Modal */}
      <Modal show={showDownloadModal} onHide={() => setShowDownloadModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)'
              }}
            >
              <i className="fas fa-download text-white"></i>
            </div>
            <div>
              <h5 className="mb-0">Export Attendance Report</h5>
              <small className="text-muted">Generate custom date range report in CSV format</small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-4">
          <Form>
            <div className="mb-4">
              <label className="form-label fw-semibold mb-3">
                <i className="fas fa-calendar-alt me-2" style={{ color: '#0ea5e9' }}></i>
                Select Date Range
              </label>
              <Row className="g-3">
                <Col md={6}>
                  <div className="position-relative">
                    <Form.Label className="small text-muted mb-2">From Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="form-control-lg"
                      style={{
                        borderRadius: '12px',
                        border: '2px solid #e0f2fe',
                        padding: '12px 16px'
                      }}
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="position-relative">
                    <Form.Label className="small text-muted mb-2">To Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="form-control-lg"
                      style={{
                        borderRadius: '12px',
                        border: '2px solid #e0f2fe',
                        padding: '12px 16px'
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </div>

            <div
              className="p-3 rounded-3"
              style={{
                background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
                border: '1px solid #bae6fd'
              }}
            >
              <div className="d-flex align-items-start">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: '#0ea5e9'
                  }}
                >
                  <i className="fas fa-info-circle text-white"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-2" style={{ color: '#0369a1' }}>Report Details</h6>
                  <div className="small" style={{ color: '#0c4a6e' }}>
                    {selectedUser ? (
                      <>
                        <div className="mb-1">
                          <i className="fas fa-user me-2" style={{ color: '#0ea5e9' }}></i>
                          <strong>Employee:</strong> {employees.find(e => e._id === selectedUser)?.firstName} {employees.find(e => e._id === selectedUser)?.lastName}
                        </div>
                      </>
                    ) : (
                      <div className="mb-1">
                        <i className="fas fa-users me-2" style={{ color: '#0ea5e9' }}></i>
                        <strong>Scope:</strong> All Employees
                      </div>
                    )}
                    <div>
                      <i className="fas fa-file-csv me-2" style={{ color: '#0ea5e9' }}></i>
                      <strong>Format:</strong> CSV (Excel Compatible)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <Button
            variant="light"
            onClick={() => setShowDownloadModal(false)}
            className="px-4 py-2"
            style={{ borderRadius: '10px', fontWeight: '500', border: '2px solid #e5e7eb' }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={downloadCSV}
            className="px-4 py-2"
            style={{
              borderRadius: '10px',
              fontWeight: '500',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}
          >
            <i className="fas fa-download me-2"></i>
            Download Report
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Edit Details Modal (For Employees) */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-info-circle me-2 text-info"></i>
            Attendance Edit Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingRecord && (
            <div>
              <div className="mb-3 p-3 bg-light rounded">
                <strong>Date:</strong> {formatDate(editingRecord.date)}
                <br />
                <strong>Current Status:</strong> {editingRecord.status}
              </div>

              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="fas fa-user-edit me-2"></i>
                  Edit Information
                </h6>
                <hr />
                <p className="mb-2">
                  <strong>Edited By:</strong>{" "}
                  {editingRecord.lastEditedBy?.firstName} {editingRecord.lastEditedBy?.lastName}
                </p>
                <p className="mb-2">
                  <strong>Edited On:</strong>{" "}
                  {editingRecord.lastEditedAt
                    ? new Date(editingRecord.lastEditedAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })
                    : "N/A"}
                </p>
                <p className="mb-0">
                  <strong>Reason:</strong>
                  <br />
                  {editingRecord.editReason || "No reason provided"}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Attendance;
