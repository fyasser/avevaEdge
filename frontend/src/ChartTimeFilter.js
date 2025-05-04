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
          label: format(new Date().setHours(hour, 0, 0, 0), 'h:00 a')  // e.g. 3:00 PM
        });
      });
    } 
    else if (resolution === 'minute') {
      Array.from(timeValues.minutes).sort().forEach(timeStr => {
        const [hour, minute] = timeStr.split(':').map(Number);
        options.push({
          value: `minute-${timeStr}`,
          label: format(new Date().setHours(hour, minute, 0, 0), 'h:mm a')  // e.g. 3:30 PM
        });
      });
    }
    else if (resolution === 'second') {
      Array.from(timeValues.seconds).sort().forEach(timeStr => {
        const [hour, minute, second] = timeStr.split(/[.:]/); // Split by either : or .
        options.push({
          value: `second-${timeStr}`,
          label: format(new Date().setHours(Number(hour), Number(minute), Number(second), 0), 'h:mm:ss a')  // e.g. 3:30:45 PM
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
      onTimeFilterChange(null);
    }
  };
  
  // Handle specific time selection
  const handleTimeValueChange = (value) => {
    if (value === 'all') {
      onTimeFilterChange(null);
      return;
    }
    
    // Parse the selected time value
    const [type, timeStr] = value.split('-');
    
    let filter;
    if (type === 'hour') {
      const hour = Number(timeStr);
      filter = {
        type: 'hour',
        hour: hour
      };
    } 
    else if (type === 'minute') {
      const [hour, minute] = timeStr.split(':').map(Number);
      filter = {
        type: 'minute',
        hour: hour,
        minute: minute
      };
    }
    else if (type === 'second') {
      const [hour, minute, second] = timeStr.split(/[.:]/);
      filter = {
        type: 'second',
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second)
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
      
      {selectedTimeResolution !== 'all' && (
        <ChartDropdownFilter
          title=""
          filterOptions={timeOptions}
          initialValue="all"
          onFilterChange={handleTimeValueChange}
        />
      )}
    </div>
  );
};

export default ChartTimeFilter;