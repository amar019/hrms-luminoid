import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from 'react-bootstrap';
import api from '../../utils/api';


const COLUMNS = {
  'ASSIGNED': { id: 'ASSIGNED', title: 'To Do', color: '#6366f1' },
  'IN_PROGRESS': { id: 'IN_PROGRESS', title: 'In Progress', color: '#f59e0b' },
  'REVIEW': { id: 'REVIEW', title: 'Review', color: '#ec4899' },
  'COMPLETED': { id: 'COMPLETED', title: 'Done', color: '#10b981' }
};

export default function TaskBoard({ tasks, onTasksChange }) {
  const [boardData, setBoardData] = useState({});

  useEffect(() => {
    // Initialize board columns
    const initialData = {
      'ASSIGNED': [],
      'IN_PROGRESS': [],
      'REVIEW': [],
      'COMPLETED': []
    };
    
    // Populate with tasks (ignore cancelled)
    tasks.forEach(task => {
      if (initialData[task.status]) {
        initialData[task.status].push(task);
      }
    });

    setBoardData(initialData);
  }, [tasks]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    // Update local state immediately for snappy UI
    const newBoardData = { ...boardData };
    const taskObj = newBoardData[sourceCol].find(t => t._id === draggableId);
    
    // Remove from source
    newBoardData[sourceCol].splice(source.index, 1);
    
    // Add to destination
    taskObj.status = destCol;
    newBoardData[destCol].splice(destination.index, 0, taskObj);
    
    setBoardData(newBoardData);

    // Call API to update status if column changed
    if (sourceCol !== destCol) {
      try {
        await api.put(`/api/tasks/${draggableId}/status`, { status: destCol });
        Swal.fire({ icon: 'success', title: 'Success', text: `Task moved to ${COLUMNS[destCol].title}`, timer: 2000, showConfirmButton: false });
        
        // Update parent state
        const updatedTasks = tasks.map(t => t._id === draggableId ? { ...t, status: destCol } : t);
        onTasksChange(updatedTasks);
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to move task' });
        // Revert on failure (simple reload logic could go here)
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="task-board-container" style={{overflowX: 'auto', paddingBottom: '1rem'}}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board" style={{display: 'flex', gap: '1.5rem', minHeight: '600px'}}>
          {Object.values(COLUMNS).map(column => (
            <div key={column.id} className="kanban-column" style={{background: '#f3f4f6', borderRadius: '12px', minWidth: '320px', width: '320px', display: 'flex', flexDirection: 'column'}}>
              <div className="kanban-column-header" style={{padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#111827'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span style={{width: '12px', height: '12px', borderRadius: '50%', background: column.color}}></span>
                  {column.title}
                </div>
                <Badge bg="secondary" style={{borderRadius: '12px'}}>{boardData[column.id]?.length || 0}</Badge>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      padding: '0 1rem 1rem 1rem',
                      flexGrow: 1,
                      minHeight: '100px',
                      background: snapshot.isDraggingOver ? '#e5e7eb' : 'transparent',
                      transition: 'background 0.2s ease',
                      borderRadius: '0 0 12px 12px'
                    }}
                  >
                    {boardData[column.id]?.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="kanban-task-card"
                            style={{
                              ...provided.draggableProps.style,
                              background: '#fff',
                              borderRadius: '8px',
                              padding: '1rem',
                              marginBottom: '0.75rem',
                              boxShadow: snapshot.isDragging ? '0 10px 25px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
                              border: '1px solid #eef0f4',
                              transform: snapshot.isDragging ? 'rotate(2deg)' : 'none'
                            }}
                          >
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                              <span style={{fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase'}}>{task.project || task.department}</span>
                              <Badge style={{background: getPriorityColor(task.priority), fontSize: '0.65rem'}}>{task.priority}</Badge>
                            </div>
                            <h5 style={{fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827'}}>{task.title}</h5>
                            
                            {task.progressPercent > 0 && (
                              <div style={{marginBottom: '0.75rem'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                                  <span>Progress</span>
                                  <span>{task.progressPercent}%</span>
                                </div>
                                <div style={{height: '4px', background: '#eef0f4', borderRadius: '2px', overflow: 'hidden'}}>
                                  <div style={{height: '100%', width: `${task.progressPercent}%`, background: column.color}}></div>
                                </div>
                              </div>
                            )}

                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'}}>
                              <div style={{display: 'flex'}}>
                                {task.assignedTo?.slice(0, 3).map((emp, i) => (
                                  <div key={emp._id} style={{
                                    width: '24px', height: '24px', borderRadius: '50%', background: '#6366f1', color: '#fff', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 600,
                                    border: '2px solid #fff', marginLeft: i > 0 ? '-8px' : '0'
                                  }}>
                                    {emp.firstName[0]}{emp.lastName[0]}
                                  </div>
                                ))}
                              </div>
                              <div style={{fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                <i className="far fa-clock"></i>
                                {new Date(task.dueDate || task.scheduledDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

