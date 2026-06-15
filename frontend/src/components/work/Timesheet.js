import Swal from 'sweetalert2';
import React, { useState } from 'react';
import { Table, Button, Badge, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';


export default function Timesheet({ workLogs, onWorkLogsChange }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic
  const filteredLogs = workLogs.filter(log => {
    let matchesSearch = true;
    if (searchTerm) {
      matchesSearch = log.workDone.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (log.project && log.project.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    let matchesFilter = true;
    if (filter === 'mine') {
      matchesFilter = log.userId === user?.id || log.userId?._id === user?.id;
    } else if (filter === 'pending') {
      matchesFilter = log.approvalStatus === 'PENDING';
    }

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED': return <Badge bg="success">Completed</Badge>;
      case 'IN_PROGRESS': return <Badge bg="primary">In Progress</Badge>;
      case 'BLOCKED': return <Badge bg="danger">Blocked</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getApprovalBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="wm-badge wm-badge-success"><i className="fas fa-check"></i> Approved</span>;
      case 'REJECTED': return <span className="wm-badge wm-badge-danger"><i className="fas fa-times"></i> Rejected</span>;
      case 'PENDING': default: return <span className="wm-badge wm-badge-warning"><i className="fas fa-clock"></i> Pending</span>;
    }
  };

  const handleApprove = async (logId, status) => {
    try {
      await api.put(`/api/work-logs/${logId}/approve`, { status });
      Swal.fire({ icon: 'success', title: 'Success', text: `Work log ${status.toLowerCase(, timer: 2000, showConfirmButton: false })}`);
      
      // Update local state
      const updatedLogs = workLogs.map(log => 
        log._id === logId ? { ...log, approvalStatus: status } : log
      );
      onWorkLogsChange(updatedLogs);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update approval status' });
    }
  };

  const isManager = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);

  return (
    <div className="timesheet-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex gap-3 align-items-center">
          <Form.Control 
            type="text" 
            placeholder="Search work logs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{width: '250px', borderRadius: '8px'}}
          />
          <Form.Select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{width: '150px', borderRadius: '8px'}}
          >
            <option value="all">All Logs</option>
            <option value="mine">My Logs</option>
            {isManager && <option value="pending">Pending Approval</option>}
          </Form.Select>
        </div>
        <Button variant="primary" style={{borderRadius: '8px', background: 'var(--wm-primary)', border: 'none'}}>
          <i className="fas fa-plus me-2"></i>Log Work
        </Button>
      </div>

      <div className="timesheet-container">
        <Table className="wm-table" responsive hover>
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Project / Category</th>
              <th>Work Done</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Approval</th>
              {isManager && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log._id}>
                  <td>
                    <div style={{fontWeight: 600, color: 'var(--wm-text-primary)'}}>
                      {new Date(log.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem'
                      }}>
                        {log.userId?.firstName?.[0] || 'U'}{log.userId?.lastName?.[0] || ''}
                      </div>
                      <div>
                        <div style={{fontWeight: 600, fontSize: '0.9rem'}}>{log.userId?.firstName} {log.userId?.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{fontWeight: 600, color: '#4f46e5'}}>{log.project || 'General'}</span>
                    <div style={{fontSize: '0.8rem', color: 'var(--wm-text-secondary)'}}>{log.category}</div>
                  </td>
                  <td>
                    <div style={{maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={log.workDone}>
                      {log.workDone}
                    </div>
                  </td>
                  <td><span style={{fontWeight: 600}}>{log.hoursSpent}</span>h</td>
                  <td>{getStatusBadge(log.status)}</td>
                  <td>{getApprovalBadge(log.approvalStatus || 'PENDING')}</td>
                  {isManager && (
                    <td>
                      {(!log.approvalStatus || log.approvalStatus === 'PENDING') && (
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-success" style={{padding: '0.2rem 0.5rem'}} onClick={() => handleApprove(log._id, 'APPROVED')}>
                            <i className="fas fa-check"></i>
                          </Button>
                          <Button size="sm" variant="outline-danger" style={{padding: '0.2rem 0.5rem'}} onClick={() => handleApprove(log._id, 'REJECTED')}>
                            <i className="fas fa-times"></i>
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isManager ? 8 : 7} className="text-center py-5">
                  <div style={{color: 'var(--wm-text-secondary)'}}>
                    <i className="fas fa-clipboard-list fs-2 mb-3 d-block"></i>
                    <p>No work logs found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

