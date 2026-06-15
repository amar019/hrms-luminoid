import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Container, Row, Col, Card, Form, InputGroup, ListGroup, Badge, Button, Spinner } from 'react-bootstrap';
import api from '../../utils/api';
import ProjectDiscussionRoom from '../../components/ProjectTracker/ProjectDiscussionRoom';

export default function ProjectChatRooms() {
  const { currentProject } = useOutletContext() || {};
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mobile UI toggle: if true, show chat window on mobile screens
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Fetch available discussion rooms
  const fetchRooms = async (showSpinner = false, isInitialLoad = false) => {
    if (showSpinner) setLoading(true);
    try {
      const response = await api.get('/api/project-chat/rooms');
      const roomsData = response.data || [];
      setRooms(roomsData);

      // Auto-select room based on context
      if (isInitialLoad && roomsData.length > 0) {
        if (currentProject && currentProject._id && currentProject._id !== 'general') {
          const contextRoom = roomsData.find(r => r.projectId === currentProject._id);
          if (contextRoom) {
            setSelectedRoom(contextRoom);
          } else {
            setSelectedRoom(roomsData[0]);
          }
        } else {
          // Do not auto-select any room if 'general' or no context
          setSelectedRoom(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch project rooms:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(true, true);
    
    // Poll rooms list every 15 seconds to update member count/last messages previews
    const interval = setInterval(() => {
      fetchRooms(false, false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setMobileShowChat(true);
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
  };

  // Filter rooms list by search term
  const filteredRooms = rooms.filter(room => 
    room.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.projectCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100 py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100" style={{ paddingBottom: '30px' }}>
      
      {/* Page Header - Hidden to match new full height design */}
      <div className="tracker-header mb-3 d-none">
        <div className="tracker-breadcrumbs">
          Projects / Chat Rooms
        </div>
        <h1 className="tracker-title">Project Chat Rooms</h1>
        <p className="text-muted small mb-0 mt-1">
          Separate and isolated discussion rooms for each project you participate in.
        </p>
      </div>

      <div className="px-4 flex-grow-1" style={{ minHeight: 0 }}>
        {rooms.length === 0 ? (
          <Card className="p-5 text-center border shadow-sm">
            <div className="text-muted mb-3">
              <i className="fas fa-comments fs-1 text-secondary"></i>
            </div>
            <h4 className="fw-bold">No Chat Rooms Available</h4>
            <p className="text-muted mx-auto" style={{ maxWidth: '480px' }}>
              You must be a Project Leader, Project Member, Admin, or HR of at least one project to view and participate in discussion rooms.
            </p>
          </Card>
        ) : (
          <Row className="g-3 h-100">
            {/* Sidebar Room List Panel */}
            <Col 
              md={3} 
              className={`h-100 ${mobileShowChat ? 'd-none d-md-block' : 'd-block'}`}
            >
              <Card className="h-100 border-0 shadow-sm overflow-hidden d-flex flex-column bg-white">
                <div className="p-3">
                  <InputGroup className="shadow-sm rounded-3 overflow-hidden border">
                    <InputGroup.Text className="bg-white border-0 text-muted ps-3">
                      <i className="fas fa-search" style={{ fontSize: '13px' }}></i>
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-0 shadow-none ps-2"
                      style={{ fontSize: '13px', backgroundColor: '#FFFFFF', minHeight: '44px' }}
                    />
                    <InputGroup.Text className="bg-white border-0 text-muted pe-3">
                      <Badge bg="light" text="dark" className="border fw-normal px-2 py-1" style={{ fontSize: '11px', borderRadius: '6px' }}>⌘K</Badge>
                    </InputGroup.Text>
                  </InputGroup>
                </div>

                <div className="flex-grow-1 overflow-y-auto px-3 pb-3" style={{ minHeight: 0 }}>
                  <div className="text-muted mb-2 mt-2 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>RECENT</div>
                  <ListGroup variant="flush" className="gap-2">
                    {filteredRooms.map((room) => {
                      const isSelected = selectedRoom?.projectId === room.projectId;
                      return (
                        <ListGroup.Item
                          key={room.projectId}
                          onClick={() => handleSelectRoom(room)}
                          className="d-flex flex-column p-3 border-0 rounded-3 cursor-pointer"
                          style={{ 
                            cursor: 'pointer', 
                            transition: 'all 0.15s ease',
                            backgroundColor: isSelected ? '#E8F5E9' : '#FFFFFF',
                            border: isSelected ? '1px solid #C8E6C9' : '1px solid #F1F5F9'
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="fw-bold text-dark text-truncate d-flex align-items-center gap-2" style={{ fontSize: '14px', maxWidth: '65%' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', flexShrink: 0 }}></span>
                              <span className="text-truncate">{room.projectName}</span>
                            </span>
                            <Badge bg="light" text="secondary" className="px-2 py-1 border fw-semibold flex-shrink-0" style={{ fontSize: '10px', borderRadius: '6px' }}>
                              {room.projectCode}
                            </Badge>
                          </div>
                          
                          <div className="d-flex align-items-center text-muted mb-2" style={{ fontSize: '12px' }}>
                            <i className="fas fa-users me-2"></i> {room.memberCount} Members
                          </div>

                          <div className="d-flex align-items-center justify-content-between">
                            {room.lastMessage ? (
                              <div className="text-muted text-truncate" style={{ fontSize: '12px', maxWidth: '70%' }}>
                                <strong className="text-dark">{room.lastMessage.senderName}:</strong> <span className="ms-1">{room.lastMessage.message}</span>
                              </div>
                            ) : (
                              <div className="text-muted text-truncate style-italic" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                No messages yet
                              </div>
                            )}
                            <div className="text-muted flex-shrink-0" style={{ fontSize: '10px' }}>
                              {room.lastMessage ? new Date(room.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                            </div>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                    {filteredRooms.length === 0 && (
                      <div className="text-center py-4 text-muted small">No matching projects.</div>
                    )}
                  </ListGroup>
                </div>
              </Card>
            </Col>

            {/* Chat Room Area Panel */}
            <Col 
              md={9} 
              className={`h-100 ${mobileShowChat ? 'd-block' : 'd-none d-md-block'}`}
            >
              {selectedRoom ? (
                <div className="d-flex flex-column h-100">
                  {/* Mobile Back navigation button */}
                  <div className="d-md-none mb-2">
                    <Button variant="light" size="sm" className="border d-flex align-items-center gap-1" onClick={handleBackToList}>
                      <i className="fas fa-arrow-left"></i> Back to Rooms List
                    </Button>
                  </div>
                  <ProjectDiscussionRoom
                    projectId={selectedRoom.projectId}
                    projectName={selectedRoom.projectName}
                    projectCode={selectedRoom.projectCode}
                  />
                </div>
              ) : (
                <Card className="h-100 d-flex flex-column align-items-center justify-content-center border-0 shadow-sm p-5 bg-white text-muted">
                  {currentProject && currentProject._id === 'general' ? (
                    <>
                      <i className="fas fa-ban fs-1 mb-3 text-secondary"></i>
                      <h6 className="fw-bold text-dark">No Chat Room for General Tasks</h6>
                      <p className="small text-center mb-0" style={{ maxWidth: '400px' }}>
                        General Tasks are not associated with any specific project and do not have a discussion room. Please select a project chat room from the left panel.
                      </p>
                    </>
                  ) : (
                    <>
                      <i className="far fa-comments fs-1 mb-2"></i>
                      <h6>Select a project chat room</h6>
                      <p className="small text-center mb-0">Choose a project from the left panel to begin discussing updates with your team.</p>
                    </>
                  )}
                </Card>
              )}
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
}
