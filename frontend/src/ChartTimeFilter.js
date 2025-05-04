import React, { useState, useEffect } from 'react';
import ChartDropdownFilter from './ChartDropdownFilter';
import { format } from 'date-fns';
import './ChartDropdownFilter.css';

const ChartTimeFilter = ({ 
  data, 
  dateField = 'Time_Stamp', 
  onTimeFilterChange,
  title = 'Time Detail' 
}) => {
  const [timeOptions, setTimeOptions] = useState([]);
  const [selectedTimeResolution, setSelectedTimeResolution] = useState('all');
  const [timeValues, setTimeValues] = useState({
    hours: new Set(),
    minutes: new Set(),
    seconds: new Set()
  });
  
  // Extract unique time values from data when component mounts or data changes
  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      // Extract unique time components
      const hours = new Set();
      const minutes = new Set();
      const seconds = new Set();
      
      // Sort data by date/time
      const sortedData = [...data].sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]));
      
      // Extract time components
      sortedData.forEach(item => {
        const dateValue = item[dateField];
        if (dateValue) {
          const date = new Date(dateValue);
          const hour = date.getHours();
          const minute = date.getMinutes();
          const second = date.getSeconds();
          
          hours.add(hour);
          minutes.add(`${hour}:${minute.toString().padStart(2, '0')}`);
          seconds.add(`${hour}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`);
        }
      });
      
      setTimeValues({
        hours,
        minutes,
        seconds
      });
      
      // Create default time resolution options
      updateTimeOptions('all');
    }
  }, [data, dateField]);
  
  // Update available time options based on selected resolution
  const updateTimeOptions = (resolution) => {
    let options = [{ value: 'all', label: 'All Times' }];
    
    if (resolution === 'hour') {
      Array.from(timeValues.hours).sort((a, b) => a - b).forEach(hour => {
        options.push({
          value: `hour-${hour}`,
          label: format(new Date().setHours(hour, 0, 0, 0), 'ha')  // More compact: 3PM instead of 3:00 PM
        });
      });
    } 
    else if (resolution === 'minute') {
      Array.from(timeValues.minutes).sort().forEach(timeStr => {
        const [hour, minute] = timeStr.split(':').map(Number);
        options.push({
          value: `minute-${timeStr}`,
          label: format(new Date().setHours(hour, minute, 0, 0), 'h:mm')  // More compact: 3:30 instead of 3:30 PM
        });
      });
    }
    else if (resolution === 'second') {
      Array.from(timeValues.seconds).sort().forEach(timeStr => {
        const [hour, minute, second] = timeStr.split(/[.:]/); // Split by either : or .
        options.push({
          value: `second-${timeStr}`,
          label: format(new Date().setHours(Number(hour), Number(minute), Number(second), 0), 'h:mm:ss')  // More compact: 3:30:45 instead of 3:30:45 PM
        });
      });
    }
    
    setTimeOptions(options);
  };
  
  // Resolution options for the first dropdown
  const resolutionOptions = [
    { value: 'all', label: 'All Times' },
    { value: 'hour', label: 'By Hour' },
    { value: 'minute', label: 'By Minute' },
    { value: 'second', label: 'By Second' }
  ];
  
  // Handle resolution change
  const handleResolutionChange = (value) => {
    setSelectedTimeResolution(value);
    updateTimeOptions(value);
    
    // If changing back to "all", clear any time filters
    if (value === 'all') {
      onTimeFilterChange({
        type: 'none',
        aggregatePoints: false
      });
      return;
    }
    
    // When selecting a resolution level, automatically set up aggregation
    // without requiring a specific time selection
    onTimeFilterChange({
      type: value, // 'hour', 'minute', or 'second'
      aggregatePoints: true, // Enable automatic data point averaging
      granularity: value // Pass the granularity level
    });
  };
  
  // Handle specific time selection
  const handleTimeValueChange = (value) => {
    if (value === 'all') {
      // When selecting "All Times" but keeping the resolution level,
      // still aggregate but don't filter to a specific time
      onTimeFilterChange({
        type: selectedTimeResolution,
        aggregatePoints: true,
        granularity: selectedTimeResolution
      });
      return;
    }
    
    // Parse the selected time value
    const [type, timeStr] = value.split('-');
    
    let filter;
    if (type === 'hour') {
      const hour = Number(timeStr);
      filter = {
        type: 'hour',
        hour: hour,
        aggregatePoints: true,
        granularity: 'hour'
      };
    } 
    else if (type === 'minute') {
      const [hour, minute] = timeStr.split(':').map(Number);
      filter = {
        type: 'minute',
        hour: hour,
        minute: minute,
        aggregatePoints: true,
        granularity: 'minute'
      };
    }
    else if (type === 'second') {
      const [hour, minute, second] = timeStr.split(/[.:]/);
      filter = {
        type: 'second',
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second),
        aggregatePoints: true,
        granularity: 'second'
      };
    }
    
    onTimeFilterChange(filter);
  };

  return (
    <div className="chart-time-filter">
      <ChartDropdownFilter
        title={title}
        filterOptions={resolutionOptions}
        initialValue="all"
        onFilterChange={handleResolutionChange}
      />
      
      {selectedTimeResolution !== 'all' ? (
        <div className="time-value-filter">
          <ChartDropdownFilter
            title=""
            filterOptions={timeOptions}
            initialValue="all"
            onFilterChange={handleTimeValueChange}
            className="timing-details-dropdown" // Add special class to target this dropdown
          />
        </div>
      ) : (
        // Add an empty placeholder div to maintain spacing when second dropdown isn't shown
        <div className="time-value-filter-placeholder"></div>
      )}
    </div>
  );
};

export default ChartTimeFilter;