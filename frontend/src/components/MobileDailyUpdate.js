import React from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';

const MobileDailyUpdate = ({ show, onHide, task, updateForm, setUpdateForm, onSubmit }) => {
  if (!task) return null;

  return (
    <Modal show={show} onHide={onHide} fullscreen className="d-md-none">
      <Modal.Header closeButton style={{background: '#ffffff', color: '#1a1a1a', border: 'none', borderBottom: '1px solid #e0e0e0'}}>
        <Modal.Title style={{fontSize: '1.1rem', fontWeight: '600'}}>
          Daily Progress Update
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={onSubmit}>
        <Modal.Body style={{padding: '1rem', background: '#f5f5f5'}}>
          {/* Task Info */}
          <div style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'}}>
            <div style={{fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem', color: 'white'}}>{task.title}</div>
            <small style={{color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem'}}>{task.department} • {task.taskType}</small>
          </div>

          {/* Progress Slider */}
          <div style={{background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
            <div style={{textAlign: 'center', marginBottom: '1.25rem'}}>
              <div style={{fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Progress</div>
              <div style={{display: 'inline-block', position: 'relative'}}>
                <svg width="100" height="100" style={{transform: 'rotate(-90deg)'}}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e9ecef" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="42" fill="none" 
                    stroke={updateForm.progressPercent >= 75 ? '#28a745' : updateForm.progressPercent >= 50 ? '#0dcaf0' : updateForm.progressPercent >= 25 ? '#ffc107' : '#dc3545'}
                    strokeWidth="8" strokeDasharray={`${updateForm.progressPercent * 2.64} 264`} strokeLinecap="round"/>
                </svg>
                <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.75rem', fontWeight: '700', color: '#1a1a1a'}}>{updateForm.progressPercent}%</div>
              </div>
            </div>
            <Form.Range 
              min="0" 
              max="100" 
              step="5"
              value={updateForm.progressPercent} 
              onChange={(e) => setUpdateForm({...updateForm, progressPercent: e.target.value})}
              style={{height: '8px'}}
            />
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem'}}>
              <small style={{color: '#999', fontSize: '0.75rem'}}>0%</small>
              <small style={{color: '#999', fontSize: '0.75rem'}}>50%</small>
              <small style={{color: '#999', fontSize: '0.75rem'}}>100%</small>
            </div>
          </div>

          {/* Status & Hours */}
          <div style={{background: 'white', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
            <Form.Group className="mb-3">
              <Form.Label style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1a1a1a'}}>
                Task Status
              </Form.Label>
              <Form.Select 
                value={updateForm.status} 
                onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                style={{fontSize: '0.9rem', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e0e0e0'}}
                required
              >
                <option value="ON_TRACK">✓ On Track</option>
                <option value="NEED_HELP">⚠ Need Help</option>
                <option value="BLOCKED">✗ Blocked</option>
                <option value="COMPLETED">✓ Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1a1a1a'}}>
                Hours Worked
              </Form.Label>
              <Form.Control 
                type="number" 
                step="0.5" 
                min="0" 
                max="12" 
                value={updateForm.hoursSpent} 
                onChange={(e) => setUpdateForm({...updateForm, hoursSpent: e.target.value})}
                placeholder="e.g., 8"
                style={{fontSize: '0.9rem', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e0e0e0'}}
              />
            </Form.Group>
          </div>

          {/* Work Done */}
          <div style={{background: 'white', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
            <Form.Group>
              <Form.Label style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1a1a1a'}}>
                What work did you complete today? <span style={{color: '#dc3545'}}>*</span>
              </Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                value={updateForm.workDone} 
                onChange={(e) => setUpdateForm({...updateForm, workDone: e.target.value})}
                placeholder={task.department === 'Sales' ? "Met 2 clients, gave demo, received order..." : "Completed assigned work, attended meetings..."}
                style={{fontSize: '0.9rem', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e0e0e0', resize: 'none'}}
                required 
              />
            </Form.Group>
          </div>

          {/* Issues (if blocked) */}
          {(updateForm.status === 'BLOCKED' || updateForm.status === 'NEED_HELP') && (
            <div style={{background: '#fff3cd', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', border: '2px solid #ffc107'}}>
              <Form.Group>
                <Form.Label style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#856404'}}>
                  What issues are you facing? <span style={{color: '#dc3545'}}>*</span>
                </Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  value={updateForm.issues} 
                  onChange={(e) => setUpdateForm({...updateForm, issues: e.target.value})}
                  placeholder="Describe the problem or help needed..."
                  style={{fontSize: '0.9rem', padding: '0.75rem', background: 'white', borderRadius: '8px', border: '2px solid #ffc107', resize: 'none'}}
                  required
                />
              </Form.Group>
            </div>
          )}

          {/* Sales Details */}
          {task.department === 'Sales' && (
            <div style={{background: 'white', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
              <div style={{fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a'}}>
                Sales Details (Optional)
              </div>
              <Form.Group className="mb-3">
                <Form.Label style={{fontSize: '0.85rem', fontWeight: 500, color: '#495057'}}>Meeting Result</Form.Label>
                <Form.Select 
                  value={updateForm.visitOutcome} 
                  onChange={(e) => setUpdateForm({...updateForm, visitOutcome: e.target.value})}
                  style={{fontSize: '0.9rem', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e0e0e0'}}
                >
                  <option value="">Select...</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="NEUTRAL">Need Follow-up</option>
                  <option value="NEGATIVE">Not Interested</option>
                  <option value="ORDER_RECEIVED">Got Order</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label style={{fontSize: '0.85rem', fontWeight: 500, color: '#495057'}}>Order Amount</Form.Label>
                <Form.Control 
                  type="number" 
                  value={updateForm.orderValue} 
                  onChange={(e) => setUpdateForm({...updateForm, orderValue: e.target.value})}
                  placeholder="Rs. 0"
                  style={{fontSize: '0.9rem', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e0e0e0'}}
                />
              </Form.Group>
            </div>
          )}

          {/* Next Day Plan */}
          <div style={{background: 'white', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
            <Form.Group>
              <Form.Label style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1a1a1a'}}>
                Plan for Tomorrow
              </Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                value={updateForm.nextDayPlan} 
                onChange={(e) => setUpdateForm({...updateForm, nextDayPlan: e.target.value})}
                placeholder="What will you work on tomorrow?"
                style={{fontSize: '0.9rem', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e0e0e0', resize: 'none'}}
              />
            </Form.Group>
          </div>
        </Modal.Body>

        <Modal.Footer style={{padding: '1rem', background: 'white', borderTop: '1px solid #e0e0e0', position: 'sticky', bottom: 0, gap: '0.5rem'}}>
          <Button 
            variant="light" 
            onClick={onHide}
            style={{flex: 1, padding: '0.75rem', fontSize: '0.9rem', fontWeight: 600, border: '2px solid #e0e0e0', borderRadius: '8px', color: '#495057'}}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            style={{flex: 1, padding: '0.75rem', fontSize: '0.9rem', fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'}}
          >
            <i className="fas fa-paper-plane me-2"></i>Submit
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MobileDailyUpdate;
