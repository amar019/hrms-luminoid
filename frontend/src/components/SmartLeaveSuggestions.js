import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Alert } from 'react-bootstrap';
import api from '../utils/api';

const SmartLeaveSuggestions = ({ selectedDates, onDateSelect, userId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDates?.startDate) {
      generateSuggestions();
      checkConflicts();
    }
  }, [selectedDates]);

  const generateSuggestions = () => {
    const startDate = new Date(selectedDates.startDate);
    const suggestions = [];

    // Long weekend suggestions
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek === 1) { // Monday
      suggestions.push({
        type: 'weekend',
        title: 'Long Weekend',
        description: 'Take Friday off for a 4-day weekend',
        dates: {
          startDate: new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: selectedDates.endDate
        },
        icon: 'calendar-week',
        color: 'success'
      });
    }

    // Bridge holiday suggestions
    suggestions.push({
      type: 'bridge',
      title: 'Bridge Holiday',
      description: 'Extend your leave to include nearby holidays',
      dates: {
        startDate: selectedDates.startDate,
        endDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      icon: 'bridge',
      color: 'info'
    });

    // Optimal leave suggestions
    suggestions.push({
      type: 'optimal',
      title: 'Optimal Duration',
      description: 'Recommended leave duration for better work-life balance',
      dates: {
        startDate: selectedDates.startDate,
        endDate: new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      icon: 'lightbulb',
      color: 'warning'
    });

    setSuggestions(suggestions);
  };

  const checkConflicts = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/leave-requests/check-conflicts', {
        startDate: selectedDates.startDate,
        endDate: selectedDates.endDate,
        userId
      });
      setConflicts(response.data.conflicts || []);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smart-suggestions">
      {/* Conflict Warnings */}
      {conflicts.length > 0 && (
        <Alert variant="warning" className="mb-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Team Conflicts Detected:</strong>
          <ul className="mb-0 mt-2">
            {conflicts.map((conflict, index) => (
              <li key={index}>
                {conflict.employeeName} has leave from {new Date(conflict.startDate).toLocaleDateString()} to {new Date(conflict.endDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Smart Suggestions */}
      <Card className="mb-3">
        <Card.Header>
          <i className="fas fa-magic me-2"></i>
          Smart Suggestions
        </Card.Header>
        <Card.Body>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item d-flex align-items-center justify-content-between p-3 border rounded mb-2">
              <div className="d-flex align-items-center">
                <div className={`suggestion-icon bg-${suggestion.color} text-white rounded-circle me-3`}>
                  <i className={`fas fa-${suggestion.icon}`}></i>
                </div>
                <div>
                  <h6 className="mb-1">{suggestion.title}</h6>
                  <small className="text-muted">{suggestion.description}</small>
                  <div className="mt-1">
                    <Badge bg="light" text="dark">
                      {new Date(suggestion.dates.startDate).toLocaleDateString()} - {new Date(suggestion.dates.endDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant={`outline-${suggestion.color}`}
                onClick={() => onDateSelect(suggestion.dates)}
              >
                Apply
              </Button>
            </div>
          ))}
        </Card.Body>
      </Card>
    </div>
  );
};

export default SmartLeaveSuggestions;