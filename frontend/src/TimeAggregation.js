import React from 'react';
import './TimeAggregation.css';

function TimeAggregation({ aggregationLevel, setAggregationLevel }) {
  // Handle aggregation level change
  const handleAggregationChange = (e) => {
    setAggregationLevel(e.target.value);
  };

  return (
    <div className="time-aggregation-container">
      <h3 className="aggregation-title">Time Aggregation</h3>
      
      <div className="aggregation-options">
        <label className="aggregation-option">
          <input
            type="radio"
            name="aggregationLevel"
            value="minute"
            checked={aggregationLevel === 'minute'}
            onChange={handleAggregationChange}
          />
          <span className="radio-label">Minute</span>
        </label>
        
        <label className="aggregation-option">
          <input
            type="radio"
            name="aggregationLevel"
            value="hour"
            checked={aggregationLevel === 'hour'}
            onChange={handleAggregationChange}
          />
          <span className="radio-label">Hour</span>
        </label>
        
        <label className="aggregation-option">
          <input
            type="radio"
            name="aggregationLevel"
            value="day"
            checked={aggregationLevel === 'day'}
            onChange={handleAggregationChange}
          />
          <span className="radio-label">Day</span>
        </label>
      </div>
      
      <div className="aggregation-info">
        {aggregationLevel === 'minute' && (
          <p>Viewing raw data at minute level</p>
        )}
        {aggregationLevel === 'hour' && (
          <p>Data averaged by hour</p>
        )}
        {aggregationLevel === 'day' && (
          <p>Data averaged by day</p>
        )}
      </div>
    </div>
  );
}

export default TimeAggregation;