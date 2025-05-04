import React, { useState, useEffect } from 'react';
import ChartDropdownFilter from './ChartDropdownFilter';
import { format } from 'date-fns';
import './ChartDropdownFilter.css';

const ChartDateFilter = ({ 
  data, 
  dateField = 'Time_Stamp', 
  onDateFilterChange,
  title = 'Filter by Date' 
}) => {
  const [dateOptions, setDateOptions] = useState([]);
  
  // Extract unique dates from data when component mounts or data changes
  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      // Extract unique dates from the dataset
      const uniqueDates = new Set();
      
      // Sort data by date (newest first)
      const sortedData = [...data].sort((a, b) => new Date(b[dateField]) - new Date(a[dateField]));
      
      // Get unique dates with formatted display values
      sortedData.forEach(item => {
        const dateValue = item[dateField];
        if (dateValue) {
          const date = new Date(dateValue);
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format for unique key
          uniqueDates.add(dateKey);
        }
      });
      
      // Create options array starting with "All Dates" option
      const options = [
        { value: 'all', label: 'All Dates' }
      ];
      
      // Add options for each unique date
      Array.from(uniqueDates).forEach(dateStr => {
        const date = new Date(dateStr);
        options.push({
          value: dateStr,
          label: format(date, 'MMM dd, yyyy')
        });
      });
      
      // Add date range options if multiple dates
      if (uniqueDates.size > 1) {
        const dateArray = Array.from(uniqueDates).sort();
        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lastWeekStr = lastWeekDate.toISOString().split('T')[0];
        
        if (dateArray.length > 7) {
          options.push({ value: 'last7', label: 'Last 7 Days' });
        }
        
        if (dateArray.length > 30) {
          options.push({ value: 'last30', label: 'Last 30 Days' });
        }
      }
      
      setDateOptions(options);
    } else {
      // If no data, just show the "All Dates" option
      setDateOptions([{ value: 'all', label: 'All Dates' }]);
    }
  }, [data, dateField]);
  
  // Handle filter change
  const handleFilterChange = (value) => {
    // If "all" selected, pass null to parent to indicate no filtering
    if (value === 'all') {
      onDateFilterChange(null);
      return;
    }
    
    // Check if it's a preset date range
    if (value === 'last7') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      onDateFilterChange({
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });
      return;
    }
    
    if (value === 'last30') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      onDateFilterChange({
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });
      return;
    }
    
    // Otherwise, it's a specific date
    const selectedDate = new Date(value);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    onDateFilterChange({
      start: selectedDate.toISOString(),
      end: nextDay.toISOString()
    });
  };

  return (
    <div className="chart-date-filter">
      <ChartDropdownFilter
        title={title}
        filterOptions={dateOptions}
        initialValue="all"
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};

export default ChartDateFilter;