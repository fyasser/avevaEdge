import React from 'react';
import './QuickFilters.css';

const QuickFilters = ({ 
  dataFilters, 
  setDataFilters, 
  dateRange,
  handleDateRangeChange,
  applyFilters 
}) => {
  // Date presets options
  const datePresets = [
    { id: 'today', label: 'Today', value: 'today' },
    { id: 'yesterday', label: 'Yesterday', value: 'yesterday' },
    { id: 'last7days', label: 'Last 7 Days', value: 'last7days' },
    { id: 'last30days', label: 'Last 30 Days', value: 'last30days' },
    { id: 'thisMonth', label: 'This Month', value: 'thisMonth' }
  ];

  // Time aggregation options
  const aggregationOptions = [
    { id: 'none', label: 'No Aggregation', value: 'none' },
    { id: 'minutes', label: 'By Minute', value: 'minutes' },
    { id: 'hours', label: 'By Hour', value: 'hours' },
    { id: 'days', label: 'By Day', value: 'days' }
  ];

  // Field options for the dropdown
  const fieldOptions = [
    { id: 'rTotalQ', label: 'Flow', value: 'rTotalQ' },
    { id: 'rTotalQPercentage', label: 'Pressure', value: 'rTotalQPercentage' },
    { id: 'systemFluidState', label: 'System Fluid State', value: 'systemFluidState' }
  ];

  // Range filter options
  const rangeOptions = [
    { id: 'all', label: 'All Values', value: 'all' },
    { id: 'high', label: 'High Values', value: 'high' },
    { id: 'medium', label: 'Medium Values', value: 'medium' },
    { id: 'low', label: 'Low Values', value: 'low' }
  ];

  // Handle date preset change
  const handleDatePresetChange = (e) => {
    const preset = e.target.value;
    const today = new Date();
    const endDate = new Date().toISOString().split('T')[0];
    let startDate;

    switch(preset) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        break;
      case 'last7days':
        const last7days = new Date();
        last7days.setDate(last7days.getDate() - 7);
        startDate = last7days.toISOString().split('T')[0];
        break;
      case 'last30days':
        const last30days = new Date();
        last30days.setDate(last30days.getDate() - 30);
        startDate = last30days.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        const thisMonth = new Date();
        thisMonth.setDate(1);
        startDate = thisMonth.toISOString().split('T')[0];
        break;
      default:
        return; // No change for invalid presets
    }

    // Update the date range in parent component
    handleDateRangeChange({
      target: { name: 'start', value: startDate }
    });
    handleDateRangeChange({
      target: { name: 'end', value: endDate }
    });
    
    // Immediately apply filters after date range changes
    setTimeout(() => applyFilters(), 10);
  };

  // Handle aggregation change
  const handleAggregationChange = (e) => {
    const newValue = e.target.value;
    setDataFilters({
      ...dataFilters,
      aggregation: newValue
    });
    
    // Immediately apply filters
    setTimeout(() => applyFilters(), 10);
  };

  // Handle filter field change
  const handleFieldChange = (e) => {
    const newValue = e.target.value;
    
    if (newValue === 'all') {
      setDataFilters({
        ...dataFilters,
        filterField: 'rTotalQ', // Default to flow, but don't filter by it
        minValue: '',
        maxValue: '',
        threshold: ''
      });
    } else {
      setDataFilters({
        ...dataFilters,
        filterField: newValue
      });
    }
    
    // Immediately apply filters
    setTimeout(() => applyFilters(), 10);
  };

  // Handle range option change
  const handleRangeChange = (e) => {
    const rangeType = e.target.value;
    const field = dataFilters.filterField || 'rTotalQ';
    
    let minValue = '';
    let maxValue = '';
    
    // Define range values based on field type
    switch(rangeType) {
      case 'high':
        if (field === 'rTotalQ') {
          minValue = '70';
        } else if (field === 'rTotalQPercentage') {
          minValue = '70';
        } else if (field === 'systemFluidState') {
          minValue = '70';
        }
        break;
      case 'medium':
        if (field === 'rTotalQ') {
          minValue = '30';
          maxValue = '70';
        } else if (field === 'rTotalQPercentage') {
          minValue = '30';
          maxValue = '70';
        } else if (field === 'systemFluidState') {
          minValue = '30';
          maxValue = '70';
        }
        break;
      case 'low':
        if (field === 'rTotalQ') {
          maxValue = '30';
        } else if (field === 'rTotalQPercentage') {
          maxValue = '30';
        } else if (field === 'systemFluidState') {
          maxValue = '30';
        }
        break;
      default:
        // For 'all', clear the min/max values
        minValue = '';
        maxValue = '';
    }
    
    setDataFilters({
      ...dataFilters,
      minValue: minValue,
      maxValue: maxValue
    });
    
    // Immediately apply filters
    setTimeout(() => applyFilters(), 10);
  };

  // Helper function to apply the quick filter to the data
  const applyQuickFilter = (field, threshold, operator) => {
    // Filter the data based on selected criteria
    const filteredData = props.data.filter(item => {
      if (field === 'rTotalQ') {
        return operator === 'gt' ? item.rTotalQ > threshold : item.rTotalQ < threshold;
      } else if (field === 'rTotalQPercentage') {
        return operator === 'gt' ? item.rTotalQPercentage > threshold : item.rTotalQPercentage < threshold;
      } else if (field === 'systemFluidState') {
        return operator === 'gt' ? item.systemFluidState > threshold : item.systemFluidState < threshold;
      }
      return true;
    });

    // ... existing code ...
  };

  // Helper function to get dynamic threshold options based on field
  const getThresholdOptions = (field) => {
    if (field === 'rTotalQ') {
      // Flow thresholds
      return [50, 100, 150, 200, 250];
    } else if (field === 'rTotalQPercentage') {
      // Pressure thresholds
      return [25, 50, 75, 90, 95];
    } else if (field === 'systemFluidState') {
      // System Fluid State thresholds (0-4 scale)
      return [1, 2, 3, 4];
    }
    return [50];
  };

  return (
    <div className="quick-filters">
      <div className="filter-group">
        <label>Date Range</label>
        <select 
          onChange={handleDatePresetChange}
          className="filter-select"
          value={dateRange.preset || ''}
        >
          <option value="" disabled>Select date range...</option>
          {datePresets.map(option => (
            <option key={option.id} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label>Aggregation</label>
        <select 
          onChange={handleAggregationChange}
          className="filter-select"
          value={dataFilters.aggregation || 'none'}
        >
          {aggregationOptions.map(option => (
            <option key={option.id} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label>Filter Field</label>
        <select 
          onChange={handleFieldChange}
          className="filter-select"
          value={dataFilters.filterField || 'all'}
        >
          {fieldOptions.map(option => (
            <option key={option.id} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label>Value Range</label>
        <select 
          onChange={handleRangeChange}
          className="filter-select"
          value={'all'}
        >
          {rangeOptions.map(option => (
            <option key={option.id} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default QuickFilters;