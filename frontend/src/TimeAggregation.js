import React from 'react';

/**
 * Time Aggregation component provides options to view data aggregated by different time intervals
 * 
 * @param {Object} props - Component properties
 * @param {string} props.currentValue - The currently selected aggregation level
 * @param {Function} props.onChange - Callback when aggregation changes
 * @param {Array} props.options - Custom options to display (optional)
 */
const TimeAggregation = ({ currentValue = 'raw', onChange, options }) => {
  // Default time aggregation options if none provided
  const defaultOptions = [
    { value: 'raw', label: 'Raw Data' },
    { value: 'minute', label: 'Per Minute' },
    { value: '5minute', label: '5 Minutes' },
    { value: '15minute', label: '15 Minutes' },
    { value: 'hour', label: 'Hourly' },
    { value: 'day', label: 'Daily' }
  ];

  // Use provided options or defaults
  const aggregationOptions = options || defaultOptions;

  return (
    <div className="time-aggregation">
      <label className="aggregation-label">
        View data:
        <select 
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          className="aggregation-select"
        >
          {aggregationOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default TimeAggregation;