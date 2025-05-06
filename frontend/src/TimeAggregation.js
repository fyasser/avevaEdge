import React from 'react';
import './TimeAggregation.css';

function TimeAggregation({ aggregationLevel = 'none', setAggregationLevel, onAggregationChange }) {
  // Handle aggregation level change
  const handleAggregationChange = (e) => {
    const newLevel = e.target.value;
    
    // Use the callback if provided, otherwise use the setter
    if (onAggregationChange) {
      onAggregationChange(newLevel);
    } else if (setAggregationLevel) {
      setAggregationLevel(newLevel);
    }
  };

  // Check if an option is selected to apply active class
  const isActive = (level) => aggregationLevel === level;

  return (
    <div className="time-aggregation-container">
      <div className="aggregation-title">Time Average</div>
      
      <div className="aggregation-options">
        <label className={`aggregation-option ${isActive('none') ? 'active' : ''}`}>
          <input
            type="radio"
            name="aggregationLevel"
            value="none"
            checked={isActive('none')}
            onChange={handleAggregationChange}
          />
          <span className="radio-label">Raw</span>
        </label>
        
        <label className={`aggregation-option ${isActive('minutes') ? 'active' : ''}`}>
          <input
            type="radio"
            name="aggregationLevel"
            value="minutes"
            checked={isActive('minutes')}
            onChange={handleAggregationChange}
          />
          <span className="radio-label">Min</span>
        </label>
        
        <label className={`aggregation-option ${isActive('hours') ? 'active' : ''}`}>
          <input
            type="radio"
            name="aggregationLevel"
            value="hours"
            checked={isActive('hours')}
            onChange={handleAggregationChange}
          />
          <span className="radio-label">Hour</span>
        </label>
        
        <label className={`aggregation-option ${isActive('days') ? 'active' : ''}`}>
          <input
            type="radio"
            name="aggregationLevel"
            value="days"
            checked={isActive('days')}
            onChange={handleAggregationChange}
          />
          <span className="radio-label">Day</span>
        </label>
      </div>
    </div>
  );
}

export default TimeAggregation;