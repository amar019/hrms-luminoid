import React, { useMemo } from 'react';
import { Row, Col } from 'react-bootstrap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

export default function TaskDashboard({ tasks, workLogs, isManager }) {
  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const overdue = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length;
    const pendingApproval = tasks.filter(t => t.approvalStatus === 'PENDING').length;
    
    return { total, completed, inProgress, overdue, pendingApproval };
  }, [tasks]);

  // Chart Data
  const statusData = useMemo(() => {
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(statusCounts).map(key => ({ name: key.replace('_', ' '), value: statusCounts[key] }));
  }, [tasks]);

  const departmentData = useMemo(() => {
    const deptCounts = tasks.reduce((acc, task) => {
      acc[task.department] = (acc[task.department] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(deptCounts).map(key => ({ name: key, count: deptCounts[key] }));
  }, [tasks]);

  return (
    <div className="task-dashboard">
      <div className="dashboard-metrics">
        <div className="wm-card metric-card">
          <div className="metric-icon" style={{background: 'var(--wm-primary-light)', color: 'var(--wm-primary)'}}>
            <i className="fas fa-tasks"></i>
          </div>
          <div className="metric-info">
            <h4>Total Tasks</h4>
            <p>{metrics.total}</p>
          </div>
        </div>
        
        <div className="wm-card metric-card">
          <div className="metric-icon" style={{background: '#d1fae5', color: '#059669'}}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="metric-info">
            <h4>Completed</h4>
            <p>{metrics.completed}</p>
          </div>
        </div>
        
        <div className="wm-card metric-card">
          <div className="metric-icon" style={{background: '#e0f2fe', color: '#0284c7'}}>
            <i className="fas fa-spinner"></i>
          </div>
          <div className="metric-info">
            <h4>Active</h4>
            <p>{metrics.inProgress}</p>
          </div>
        </div>
        
        <div className="wm-card metric-card">
          <div className="metric-icon" style={{background: '#fee2e2', color: '#dc2626'}}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="metric-info">
            <h4>Overdue</h4>
            <p>{metrics.overdue}</p>
          </div>
        </div>

        {isManager && (
          <div className="wm-card metric-card">
            <div className="metric-icon" style={{background: '#fef3c7', color: '#d97706'}}>
              <i className="fas fa-user-check"></i>
            </div>
            <div className="metric-info">
              <h4>Pending Approvals</h4>
              <p>{metrics.pendingApproval}</p>
            </div>
          </div>
        )}
      </div>

      <Row>
        <Col lg={6} className="mb-4">
          <div className="wm-card" style={{height: '400px'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem'}}>Tasks by Status</h4>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Col>
        
        <Col lg={6} className="mb-4">
          <div className="wm-card" style={{height: '400px'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem'}}>Tasks by Department</h4>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="count" fill="var(--wm-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>
    </div>
  );
};

