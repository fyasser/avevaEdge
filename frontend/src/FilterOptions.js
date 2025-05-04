import React, { useState, useEffect } from 'react';
import './FilterOptions.css';

function FilterOptions({ selectedCharts, handleChartSelection, dateRange, handleDateRangeChange, fetchFilteredData, downloadPage }) {
  // State for tab navigation instead of expanded/collapsed sections
  const [activeTab, setActiveTab] = useState('charts');

  // State for additional filters
  const [additionalFilters, setAdditionalFilters] = useState({
    minValue: '',
    maxValue: '',
    filterField: 'rTotalQ', // Default to flow field
    threshold: '',
    comparisonOperator: 'gt' // Default to greater than
  });

  // State for aggregation filter
  const [aggregation, setAggregation] = useState('none');

  // State for filter status and activity
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const [filterTimestamp, setFilterTimestamp] = useState(null);

  // Define quick preset date ranges
  const datePresets = [
    { name: 'Today', start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { name: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { name: 'Last 30 Days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { name: 'This Month', start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] }
  ];

  // Handle additional filter changes
  const handleAdditionalFilterChange = (e) => {
    setAdditionalFilters({
      ...additionalFilters,
      [e.target.name]: e.target.value
    });
    setFilterApplied(false); // Mark filters as changed but not applied
  };

  // Handle aggregation changes
  const handleAggregationChange = (e) => {
    setAggregation(e.target.value);
    setFilterApplied(false);
  };

  // Apply date preset
  const applyDatePreset = (preset) => {
    handleDateRangeChange({
      target: { name: 'start', value: preset.start }
    });
    handleDateRangeChange({
      target: { name: 'end', value: preset.end }
    });
    setFilterApplied(false); // Mark filters as changed but not applied
  };

  // Reset all filters to default
  const resetFilters = () => {
    // Reset chart selection (all selected)
    const resetCharts = {
      radar: true,
      doughnut: true,
      line: true,
      scatter: true
    };
    
    // Apply reset to all chart types
    Object.keys(resetCharts).forEach(chart => {
      handleChartSelection({
        target: { name: chart, checked: true }
      });
    });
    
    // Reset date range to last 7 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    handleDateRangeChange({
      target: { name: 'start', value: startDate }
    });
    handleDateRangeChange({
      target: { name: 'end', value: endDate }
    });
    
    // Reset additional filters and aggregation
    setAdditionalFilters({
      minValue: '',
      maxValue: '',
      filterField: 'rTotalQ',
      threshold: '',
      comparisonOperator: 'gt'
    });
    setAggregation('none');

    // Apply the reset filters immediately
    setTimeout(() => {
      applyFilters();
    }, 100);
  };

  // Apply filters and fetch data
  const applyFilters = () => {
    setIsFiltering(true);
    // Include the aggregation setting in the additionalFilters object
    fetchFilteredData({
      ...additionalFilters,
      aggregation: aggregation
    });
    setFilterApplied(true);
    setFilterTimestamp(new Date());
    
    // Clear filtering status after a short delay
    setTimeout(() => {
      setIsFiltering(false);
    }, 1500);
  };

  // Handle Generate Report button click
  const handleGenerateReport = () => {
    downloadPage(additionalFilters);
  };

  // Effect to check if date range is valid
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      if (end < start) {
        // If end date is before start date, adjust end date
        const newEnd = new Date(start);
        newEnd.setDate(start.getDate() + 1); // Set end date to day after start date
        handleDateRangeChange({
          target: { 
            name: 'end', 
            value: newEnd.toISOString().split('T')[0]
          }
        });
      }
    }
  }, [dateRange.start, dateRange.end]);

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'charts':
        return (
          <div className="tab-content">
            <div className="chart-options">
              <div className="checkbox-grid">
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    name="line"
                    checked={selectedCharts.line}
                    onChange={(e) => {
                      handleChartSelection(e);
                      setFilterApplied(false);
                    }}
                  />
                  <span>Line Chart</span>
                </label>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    name="doughnut"
                    checked={selectedCharts.doughnut}
                    onChange={(e) => {
                      handleChartSelection(e);
                      setFilterApplied(false);
                    }}
                  />
                  <span>Distribution</span>
                </label>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    name="radar"
                    checked={selectedCharts.radar}
                    onChange={(e) => {
                      handleChartSelection(e);
                      setFilterApplied(false);
                    }}
                  />
                  <span>Bar Chart</span>
                </label>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    name="scatter"
                    checked={selectedCharts.scatter}
                    onChange={(e) => {
                      handleChartSelection(e);
                      setFilterApplied(false);
                    }}
                  />
                  <span>Scatter Chart</span>
                </label>
              </div>
              
              <div className="button-row">
                <button 
                  type="button" 
                  onClick={() => {
                    ['radar', 'doughnut', 'line', 'scatter'].forEach(chart => {
                      handleChartSelection({
                        target: { name: chart, checked: true }
                      });
                    });
                    setFilterApplied(false);
                  }}
                  className="text-button"
                >
                  Select All
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    ['radar', 'doughnut', 'line', 'scatter'].forEach(chart => {
                      handleChartSelection({
                        target: { name: chart, checked: false }
                      });
                    });
                    setFilterApplied(false);
                  }}
                  className="text-button"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'date':
        return (
          <div className="tab-content">
            <div className="date-range-options">
              <div className="date-presets">
                {datePresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyDatePreset(preset)}
                    className="preset-button"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              
              <div className="date-inputs">
                <div className="form-field">
                  <label>Start:</label>
                  <input
                    type="date"
                    name="start"
                    value={dateRange.start}
                    onChange={(e) => {
                      handleDateRangeChange(e);
                      setFilterApplied(false);
                    }}
                  />
                </div>
                <div className="form-field">
                  <label>End:</label>
                  <input
                    type="date"
                    name="end"
                    value={dateRange.end}
                    onChange={(e) => {
                      handleDateRangeChange(e);
                      setFilterApplied(false);
                    }}
                  />
                </div>
              </div>
              
              {dateRange.start && dateRange.end && new Date(dateRange.end) < new Date(dateRange.start) && (
                <div className="validation-error">End date must be after start date</div>
              )}
            </div>
          </div>
        );
        
      case 'filters':
        return (
          <div className="tab-content">
            <div className="data-filter-options">
              <div className="filter-row">
                <div className="form-field">
                  <label>Aggregation:</label>
                  <select
                    name="aggregation"
                    value={aggregation}
                    onChange={handleAggregationChange}
                  >
                    <option value="none">None</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              <div className="filter-row">
                <div className="form-field">
                  <label>Filter Field:</label>
                  <select
                    name="filterField"
                    value={additionalFilters.filterField}
                    onChange={handleAdditionalFilterChange}
                  >
                    <option value="rTotalQ">Flow</option>
                    <option value="rTotalQPercentage">Pressure</option>
                    <option value="systemFluidState">System Fluid State</option>
                  </select>
                </div>
                
                <div className="range-inputs">
                  <div className="form-field">
                    <label>Min:</label>
                    <input
                      type="number"
                      name="minValue"
                      value={additionalFilters.minValue}
                      onChange={handleAdditionalFilterChange}
                      placeholder="Min"
                    />
                  </div>
                  <div className="form-field">
                    <label>Max:</label>
                    <input
                      type="number"
                      name="maxValue"
                      value={additionalFilters.maxValue}
                      onChange={handleAdditionalFilterChange}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
              
              <div className="threshold-container">
                <div className="form-field">
                  <label>Threshold Alert:</label>
                  <div className="threshold-inputs">
                    <input
                      type="number"
                      name="threshold"
                      value={additionalFilters.threshold}
                      onChange={handleAdditionalFilterChange}
                      placeholder="Value"
                      className="threshold-input"
                    />
                    <select 
                      name="comparisonOperator"
                      value={additionalFilters.comparisonOperator}
                      onChange={handleAdditionalFilterChange}
                      className="comparison-select"
                    >
                      <option value="gt">&gt;</option>
                      <option value="lt">&lt;</option>
                    </select>
                  </div>
                </div>
                <div className="filter-help">
                  Alert when {additionalFilters.filterField === 'rTotalQ' ? 'Flow' : 
                            additionalFilters.filterField === 'rTotalQPercentage' ? 'Pressure' : 
                            'System Fluid State'} is 
                  {additionalFilters.comparisonOperator === 'gt' ? ' greater than' : ' less than'}
                  {additionalFilters.threshold ? ` ${additionalFilters.threshold}` : ' threshold'}
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="filter-panel compact">
      <form onSubmit={(e) => { 
        e.preventDefault(); 
        applyFilters();
      }}>
        <div className="filter-header">
          <h2 className="filter-panel-title">Filter Panel</h2>
          
          {filterApplied && filterTimestamp && (
            <div className={`filter-status ${isFiltering ? 'filtering' : 'applied'}`}>
              <span className="status-icon">
                {isFiltering ? '⟳' : '✓'}
              </span>
              <span className="status-text">
                {isFiltering 
                  ? 'Applying...' 
                  : `Applied at ${filterTimestamp.toLocaleTimeString()}`}
              </span>
            </div>
          )}
        </div>
        
        <div className="tabs-container">
          <div className="tab-navigation">
            <button
              type="button"
              className={`tab-button ${activeTab === 'charts' ? 'active' : ''}`}
              onClick={() => setActiveTab('charts')}
            >
              <span className="material-icons tab-icon">pie_chart</span>
              <span>Charts</span>
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'date' ? 'active' : ''}`}
              onClick={() => setActiveTab('date')}
            >
              <span className="material-icons tab-icon">calendar_today</span>
              <span>Date Range</span>
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'filters' ? 'active' : ''}`}
              onClick={() => setActiveTab('filters')}
            >
              <span className="material-icons tab-icon">filter_list</span>
              <span>Data Filters</span>
            </button>
          </div>
          
          {renderTabContent()}
        </div>

        <div className="action-buttons">
          <button 
            type="submit"
            className={`primary-button ${!filterApplied || isFiltering ? 'highlight-button' : ''}`}
            disabled={isFiltering}
          >
            {isFiltering ? 'Applying...' : 'Apply Filters'}
          </button>
          
          <button 
            type="button"
            onClick={handleGenerateReport}
            className="accent-button"
          >
            Generate Report
          </button>
          
          <button 
            type="button"
            onClick={resetFilters}
            className="secondary-button"
            disabled={isFiltering}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

export default FilterOptions;