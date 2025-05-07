import React, { useState, useMemo, useRef, useEffect } from 'react';
import './DataTable.css';
import { aggregateData } from './utils/aggregationUtils'; // Import the aggregation utility

// Function to export data to CSV
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  // Convert data object to CSV string
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      // Handle values that might contain commas or quotes
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      
      // Format dates
      if (header === 'Time_Stamp' && cell) {
        cell = new Date(cell).toLocaleString();
      }
      
      // Format numbers
      if (typeof cell === 'number') {
        cell = cell.toFixed(2);
      }
      
      // Escape quotes and wrap in quotes if needed
      cell = String(cell).replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(',');
  }).join('\n');
  
  // Combine header and rows
  const csvString = `${headerRow}\n${csvRows}`;
  
  // Create a download link and trigger it
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || 'exported_data.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to export data to Excel-compatible CSV
const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) return;
  
  // Excel uses UTF-16 BOM for proper encoding
  const BOM = "\uFEFF";
  
  // Convert data to CSV with BOM for Excel
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      // Handle values that might contain commas or quotes
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      
      // Format dates for Excel
      if (header === 'Time_Stamp' && cell) {
        cell = new Date(cell).toLocaleString();
      }
      
      // Format numbers
      if (typeof cell === 'number') {
        cell = cell.toFixed(2);
      }
      
      // Escape quotes and wrap in quotes if needed
      cell = String(cell).replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(',');
  }).join('\n');
  
  // Combine header and rows with BOM for Excel
  const csvString = `${BOM}${headerRow}\n${csvRows}`;
  
  // Create a download link and trigger it
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || 'exported_data.xlsx');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to get the description for systemFluidState
const getFluidStateDescription = (value) => {
  const numericValue = parseFloat(value);
  // Handle cases where value might be null, undefined, or NaN after parsing
  if (value === null || value === undefined || isNaN(numericValue)) {
    return { description: 'N/A', color: '#bdc3c7' }; // Default for non-numeric or missing
  }

  if (numericValue >= 0 && numericValue <= 25) return { description: 'Low', color: '#e74c3c' }; // Red for Low
  if (numericValue > 25 && numericValue <= 50) return { description: 'Medium', color: '#f39c12' }; // Orange for Medium
  if (numericValue > 50 && numericValue <= 75) return { description: 'High', color: '#2ecc71' }; // Green for High
  if (numericValue > 75 && numericValue <= 100) return { description: 'Very High', color: '#3498db' }; // Blue for Very High
  return { description: 'Undefined', color: '#95a5a6' }; // Grey for out of range
};

function DataTable({ tableData = [], searchTerm, setSearchTerm, rowsPerPage, setRowsPerPage, currentPage, setCurrentPage }) {
  const [sortConfig, setSortConfig] = useState({ key: 'Time_Stamp', direction: 'descending' });
  const [expandedRows, setExpandedRows] = useState({});
  const [showSummary, setShowSummary] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState({
    Time_Stamp: true,
    rTotalQ: true,
    rTotalQPercentage: true,
    systemFluidState: true // Correct key for System Fluid State
  });
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [highlightCondition, setHighlightCondition] = useState('none'); // 'none', 'high-flow', 'low-pressure', 'optimal-state'
  const [aggregationLevel, setAggregationLevel] = useState('none'); // 'none', 'minute', 'day', 'month'
  const tableRef = useRef(null);
  const exportDropdownRef = useRef(null);
  const columnSelectorRef = useRef(null);

  // Effect to handle clicks outside of dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target)) {
        setShowColumnSelector(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [columnSelectorRef, exportDropdownRef]); // Added refs to dependency array

  // Calculate table metrics
  const tableMetrics = useMemo(() => {
    if (!tableData || tableData.length === 0) return null;
    
    // Get flow metrics
    const flowValues = tableData.map(row => row.rTotalQ).filter(val => val !== undefined && !isNaN(val));
    const avgFlow = flowValues.length > 0 ? 
      flowValues.reduce((sum, val) => sum + val, 0) / flowValues.length : 0;
    const maxFlow = flowValues.length > 0 ? Math.max(...flowValues) : 0;
    const minFlow = flowValues.length > 0 ? Math.min(...flowValues) : 0;
    
    // Get pressure metrics
    const pressureValues = tableData.map(row => row.rTotalQPercentage).filter(val => val !== undefined && !isNaN(val));
    const avgPressure = pressureValues.length > 0 ? 
      pressureValues.reduce((sum, val) => sum + val, 0) / pressureValues.length : 0;
    const maxPressure = pressureValues.length > 0 ? Math.max(...pressureValues) : 0;
    const minPressure = pressureValues.length > 0 ? Math.min(...pressureValues) : 0;
    
    // Get fluid state metrics
    const fluidStateValues = tableData.map(row => row.systemFluidState).filter(val => val !== undefined && !isNaN(val));
    const avgFluidState = fluidStateValues.length > 0 ? 
      fluidStateValues.reduce((sum, val) => sum + val, 0) / fluidStateValues.length : 0;
      
    return {
      flow: { avg: avgFlow, max: maxFlow, min: minFlow },
      pressure: { avg: avgPressure, max: maxPressure, min: minPressure },
      fluidState: { avg: avgFluidState }
    };
  }, [tableData]);

  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      if (key === 'Time_Stamp') {
        return direction === 'ascending' 
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      }
      
      // Handle undefined or null values
      if (a[key] === undefined || a[key] === null) return direction === 'ascending' ? -1 : 1;
      if (b[key] === undefined || b[key] === null) return direction === 'ascending' ? 1 : -1;
      
      return direction === 'ascending' 
        ? a[key] - b[key]
        : b[key] - a[key];
    });
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let dataToProcess = tableData;

    // Apply aggregation if a level is selected
    if (aggregationLevel !== 'none') {
      dataToProcess = aggregateData(tableData, aggregationLevel);
    }

    let processed = dataToProcess;
    
    // Apply search filter
    if (searchTerm) {
      processed = processed.filter((row) => 
        // Search in Time_Stamp
        new Date(row.Time_Stamp).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Search in rTotalQ
        (row.rTotalQ !== undefined && row.rTotalQ.toString().includes(searchTerm)) ||
        // Search in rTotalQPercentage
        (row.rTotalQPercentage !== undefined && row.rTotalQPercentage.toString().includes(searchTerm)) ||
        // Search in systemFluidState
        (row.systemFluidState !== undefined && row.systemFluidState.toString().includes(searchTerm))
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      // When aggregating, Time_Stamp might be a string like YYYY-MM-DD or YYYY-MM. Adjust sorting if necessary.
      // For now, direct date/string sorting might work for YYYY-MM-DD but might need refinement for month names or mixed formats.
      processed = sortData(processed, sortConfig.key, sortConfig.direction);
    }
    
    return processed;
  }, [tableData, searchTerm, sortConfig, aggregationLevel]); // Added aggregationLevel to dependencies
  
  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };
  
  // Get fluid state description
  const getFluidStateDescription = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return { description: 'Unknown', color: '#999' };
    }
    
    if (value >= 80) {
      return { description: 'Optimal', color: '#16a34a' }; // Green
    } else if (value >= 60) {
      return { description: 'Good', color: '#3b82f6' }; // Blue
    } else if (value >= 40) {
      return { description: 'Acceptable', color: '#f59e0b' }; // Orange
    } else {
      return { description: 'Poor', color: '#dc2626' }; // Red
    }
  };
  
  // Determine if a value is abnormal
  const getValueStatus = (value, field) => {
    if (value === undefined || value === null || !tableMetrics) return 'normal';
    
    if (field === 'rTotalQ') {
      const avg = tableMetrics.flow.avg;
      if (value > avg * 1.2) return 'high';
      if (value < avg * 0.8) return 'low';
    }
    
    if (field === 'rTotalQPercentage') {
      const avg = tableMetrics.pressure.avg;
      if (value > avg * 1.2) return 'high';
      if (value < avg * 0.8) return 'low';
    }
    
    if (field === 'systemFluidState') {
      if (value < 40) return 'low';
      if (value >= 80) return 'high';
    }
    
    return 'normal';
  };
  
  // Calculate trend indicators for a row
  const calculateTrend = (current, previous, field) => {
    if (!current || !previous || current[field] === undefined || previous[field] === undefined) {
      return 'neutral';
    }
    
    const diff = current[field] - previous[field];
    
    if (field === 'rTotalQ' || field === 'rTotalQPercentage') {
      if (diff > 5) return 'up-significant';
      if (diff > 0) return 'up';
      if (diff < -5) return 'down-significant';
      if (diff < 0) return 'down';
    }
    
    if (field === 'systemFluidState') {
      if (diff > 10) return 'up-significant';
      if (diff > 0) return 'up';
      if (diff < -10) return 'down-significant';
      if (diff < 0) return 'down';
    }
    
    return 'neutral';
  };
  
  // Generate badge text
  const getBadgeText = (trend) => {
    switch (trend) {
      case 'up-significant': return 'Rising rapidly';
      case 'up': return 'Rising';
      case 'down-significant': return 'Falling rapidly';
      case 'down': return 'Falling';
      default: return 'Stable';
    }
  };
  
  // Format the date - full or compact
  const formatDate = (dateString, isCompact = false) => {
    const date = new Date(dateString);
    if (isCompact) {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString();
  };

  // Define ALL possible table headers with correct keys and consistent structure
  const allHeadersDefinition = useMemo(() => [
    { key: 'Time_Stamp', label: 'Timestamp', textAlign: 'left' },
    { key: 'rTotalQ', label: 'Flow (m³/h)', textAlign: 'right' },
    { key: 'rTotalQPercentage', label: 'Pressure (kPa)', textAlign: 'right' },
    { key: 'systemFluidState', label: 'System Fluid State', textAlign: 'left' }, // Corrected key from 'counter'
  ], []);

  // Filter headers based on visibility state - this 'headers' variable will be used for rendering
  const headers = useMemo(() => {
    return allHeadersDefinition.filter(header => visibleColumns[header.key]);
  }, [allHeadersDefinition, visibleColumns]);

  // Moved and corrected useMemo for pagination logic
  // This hook calculates the data for the current page and total pages.
  // It must be called unconditionally, before any early returns.
  // It now uses `currentPage` and `rowsPerPage` props.
  const { currentPageData, totalPages } = useMemo(() => {
    // Guard against processedData not being ready or invalid pagination props
    if (!processedData || processedData.length === 0 || !rowsPerPage || rowsPerPage <= 0 || !currentPage || currentPage < 1) {
      return {
        currentPageData: [], // Return empty data if inputs are invalid
        totalPages: 0,
      };
    }
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return {
      currentPageData: processedData.slice(startIndex, endIndex),
      totalPages: Math.ceil(processedData.length / rowsPerPage),
    };
  }, [processedData, currentPage, rowsPerPage]); // Dependencies are props

  if (!tableData || tableData.length === 0) {
    // This early return is now safe as all hooks are called before it.
    return <div className="table-responsive">No data available</div>;
  }

  // The 'memoizedCurrentPage' variable, previously destructured from a useMemo hook,
  // is no longer created here as the hook now directly uses the 'currentPage' prop
  // for its internal calculations, and this specific useMemo focuses on returning
  // paginated data and total pages, not a separate current page value.

  return (
    <div className="enhanced-data-table">
      {/* Table Header with Summary */}
      <div className="table-header">
        <div className="header-top">
          <h2>Data Table</h2>
          <button 
            className="summary-toggle"
            onClick={() => setShowSummary(!showSummary)}
            aria-label={showSummary ? "Hide summary" : "Show summary"}
          >
            {showSummary ? 'Hide Summary' : 'Show Summary'}
          </button>
        </div>
        
        {/* Summary Section */}
        {showSummary && tableMetrics && (
          <div className="data-summary">
            <div className="summary-card">
              <div className="summary-title">Flow</div>
              <div className="summary-value">{tableMetrics.flow.avg.toFixed(2)} m³/h</div>
              <div className="summary-range">
                <span>Min: {tableMetrics.flow.min.toFixed(2)}</span>
                <span>Max: {tableMetrics.flow.max.toFixed(2)}</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Pressure</div>
              <div className="summary-value">{tableMetrics.pressure.avg.toFixed(2)} kPa</div>
              <div className="summary-range">
                <span>Min: {tableMetrics.pressure.min.toFixed(2)}</span>
                <span>Max: {tableMetrics.pressure.max.toFixed(2)}</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-title">System Fluid State</div>
              <div className="summary-value">
                {tableMetrics.fluidState.avg.toFixed(2)}
                <span className="fluid-state-label">
                  {getFluidStateDescription(tableMetrics.fluidState.avg).description}
                </span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Records</div>
              <div className="summary-value">{tableData.length}</div>
              <div className="summary-detail">
                Showing: {processedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).length}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="table-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search in all columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <div className="search-results">
              Found {processedData.length} of {tableData.length} records
              {processedData.length === 0 && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
        <div className="table-actions">
          {/* Column Selector */}
          <div className="dropdown" ref={columnSelectorRef}>
            <button 
              className="action-button"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              aria-label="Toggle column visibility"
              title="Show/hide columns"
            >
              <span className="button-icon">⚙️</span>
              <span className="button-text">Columns</span>
            </button>
            {showColumnSelector && (
              <div className="dropdown-menu column-selector show"> {/* Added 'show' class */}
                <h4>Show/Hide Columns</h4>
                <div className="column-options">
                  <label className="column-option">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns.Time_Stamp}
                      onChange={() => setVisibleColumns(prev => ({ 
                        ...prev, 
                        Time_Stamp: !prev.Time_Stamp
                      }))}
                    />
                    Timestamp
                  </label>
                  <label className="column-option">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns.rTotalQ}
                      onChange={() => setVisibleColumns(prev => ({ 
                        ...prev, 
                        rTotalQ: !prev.rTotalQ
                      }))}
                    />
                    Flow (m³/h)
                  </label>
                  <label className="column-option">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns.rTotalQPercentage}
                      onChange={() => setVisibleColumns(prev => ({ 
                        ...prev, 
                        rTotalQPercentage: !prev.rTotalQPercentage
                      }))}
                    />
                    Pressure (kPa)
                  </label>
                  <label className="column-option">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns.systemFluidState}
                      onChange={() => setVisibleColumns(prev => ({ 
                        ...prev, 
                        systemFluidState: !prev.systemFluidState
                      }))}
                    />
                    System Fluid State
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Time Aggregation Selector */}
          <div className="dropdown">
            <button
              className="action-button"
              onClick={() => document.getElementById('aggregation-dropdown').classList.toggle('show')}
              aria-label="Select time aggregation"
              title="Aggregate data by time"
            >
              <span className="button-icon">⏱️</span>
              <span className="button-text">Aggregate</span>
            </button>
            <div id="aggregation-dropdown" className="dropdown-menu">
              <button
                className={`dropdown-item ${aggregationLevel === 'none' ? 'active' : ''}`}
                onClick={() => { setAggregationLevel('none'); document.getElementById('aggregation-dropdown').classList.remove('show'); }}
              >
                Raw Data
              </button>
              <button
                className={`dropdown-item ${aggregationLevel === 'minute' ? 'active' : ''}`}
                onClick={() => { setAggregationLevel('minute'); document.getElementById('aggregation-dropdown').classList.remove('show'); }}
              >
                Average per Minute
              </button>
              <button
                className={`dropdown-item ${aggregationLevel === 'day' ? 'active' : ''}`}
                onClick={() => { setAggregationLevel('day'); document.getElementById('aggregation-dropdown').classList.remove('show'); }}
              >
                Average per Day
              </button>
              <button
                className={`dropdown-item ${aggregationLevel === 'month' ? 'active' : ''}`}
                onClick={() => { setAggregationLevel('month'); document.getElementById('aggregation-dropdown').classList.remove('show'); }}
              >
                Average per Month
              </button>
            </div>
          </div>
          
          {/* Export Data */}
          <div className="dropdown" ref={exportDropdownRef}>
            <button 
              className="action-button"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              aria-label="Export data"
              title="Export data"
            >
              <span className="button-icon">📥</span>
              <span className="button-text">Export</span>
            </button>
            {exportDropdownOpen && (
              <div className="dropdown-menu show"> {/* Added 'show' class */}
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    exportToCSV(processedData, `data_export_${new Date().toISOString().split('T')[0]}.csv`);
                    setExportDropdownOpen(false);
                  }}
                >
                  Export as CSV
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    exportToExcel(processedData, `data_export_${new Date().toISOString().split('T')[0]}.xlsx`);
                    setExportDropdownOpen(false);
                  }}
                >
                  Export as Excel
                </button>
                <div className="dropdown-divider"></div>
                <div className="dropdown-subheader">Export Options:</div>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    exportToCSV(tableData, `full_data_export_${new Date().toISOString().split('T')[0]}.csv`);
                    setExportDropdownOpen(false);
                  }}
                >
                  Export All Data (CSV)
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    const currentPageData = processedData.slice(
                      (currentPage - 1) * rowsPerPage, 
                      currentPage * rowsPerPage
                    );
                    exportToCSV(currentPageData, `page_${currentPage}_data_export_${new Date().toISOString().split('T')[0]}.csv`);
                    setExportDropdownOpen(false);
                  }}
                >
                  Export Current Page Only
                </button>
              </div>
            )}
          </div>
          
          
          {/* Rows Per Page */}
          <div className="rows-select">
            <label htmlFor="rows-per-page">Rows:</label>
            <select
              id="rows-per-page"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>,
      {/* Enhanced Data Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="expand-column"></th>
              {headers.map(header => (
                <th key={header.key} style={{ textAlign: header.textAlign || 'left' }}> {/* Apply textAlign from header config */}
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentPageData // Use currentPageData which is already paginated
              .map((row, index, currentPageRowsArray) => { // currentPageRowsArray is currentPageData
                const rowId = `${currentPage}-${index}`; // Unique ID for the row
                const isExpanded = expandedRows[rowId] || false;
                const previousRow = index > 0 ? currentPageRowsArray[index - 1] : null;
                
                // Calculate trends
                const flowTrend = calculateTrend(row, previousRow, 'rTotalQ');
                const pressureTrend = calculateTrend(row, previousRow, 'rTotalQPercentage');
                const fluidStateTrend = calculateTrend(row, previousRow, 'systemFluidState');
                
                // Get status for coloring
                const flowStatus = getValueStatus(row.rTotalQ, 'rTotalQ');
                const pressureStatus = getValueStatus(row.rTotalQPercentage, 'rTotalQPercentage');
                const fluidState = getFluidStateDescription(row.systemFluidState);
                
                return (
                  <React.Fragment key={rowId}>
                    <tr 
                      key={rowId} // Corrected: Was rowIndex, now uses defined rowId.
                      className={`data-row ${expandedRows[rowId] ? 'expanded' : ''} ${aggregationLevel !== 'none' ? 'aggregated-row' : ''}`} // Corrected: Was expandedRowIndex === rowIndex, now uses expandedRows[rowId]
                      onClick={(e) => { e.stopPropagation(); toggleRowExpansion(rowId); }} // Corrected: Was rowIndex, now uses rowId. Added stopPropagation.
                    >
                      <td className="expand-cell">
                        <button 
                          className="expand-button"
                          onClick={(e) => { e.stopPropagation(); toggleRowExpansion(rowId); }} // Added stopPropagation for consistency
                          aria-label={isExpanded ? "Hide details" : "Show details"}
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </td>
                      {headers.map(header => {
                        const value = row[header.key];
                        // Determine cell style based on header config or data type
                        let cellStyle = { textAlign: header.textAlign || 'left' }; 

                        if (header.key === 'systemFluidState') {
                          const { description, color } = getFluidStateDescription(value);
                          const rawValueDisplay = (value === null || value === undefined || isNaN(parseFloat(value)))
                                                  ? 'N/A' 
                                                  : parseFloat(value).toFixed(2);
                          return (
                            <td key={header.key} style={cellStyle} className="system-fluid-state-cell">
                              <span 
                                className="fluid-state-indicator"
                                style={{ backgroundColor: description === 'N/A' ? 'transparent' : color }}
                              ></span>
                              {description} 
                              {aggregationLevel !== 'none' && <span className="avg-value-label">(Avg: {rawValueDisplay})</span>}
                              {aggregationLevel === 'none' && <span className="raw-value-label">({rawValueDisplay})</span>} 
                            </td>
                          );
                        } else if (header.key === 'Time_Stamp') {
                          let displayTimestamp = 'N/A';
                          let aggregationLabel = '';
                          if (value) {
                            const date = new Date(value);
                            if (aggregationLevel === 'minute') {
                              displayTimestamp = date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                              aggregationLabel = '(Minute Avg)';
                            } else if (aggregationLevel === 'day') {
                              displayTimestamp = date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
                              aggregationLabel = '(Day Avg)';
                            } else if (aggregationLevel === 'month') {
                              // For month, value might be YYYY-MM string from aggregation
                              if (typeof value === 'string' && value.includes('-')) {
                                const [year, month] = value.split('-');
                                displayTimestamp = new Date(year, month -1).toLocaleDateString([], { year: 'numeric', month: 'long' });
                              } else {
                                displayTimestamp = date.toLocaleDateString([], { year: 'numeric', month: 'long' });
                              }
                              aggregationLabel = '(Month Avg)';
                            } else {
                              displayTimestamp = date.toLocaleString();
                            }
                          }
                          return (
                            <td key={header.key} style={cellStyle} className="timestamp-cell">
                              {displayTimestamp} 
                              {aggregationLevel !== 'none' && <span className="aggregation-period-label">{aggregationLabel}</span>}
                              {row.aggregated_count && aggregationLevel !== 'none' && 
                                <span className="aggregated-count-badge prominent">
                                  {row.aggregated_count} records
                                </span>
                              }
                            </td>
                          );
                        } else if (typeof value === 'number') {
                          cellStyle.textAlign = header.textAlign || 'right'; 
                          return (
                            <td key={header.key} style={cellStyle} className="numeric-cell">
                              {value.toFixed(2)}
                              {aggregationLevel !== 'none' && <span className="avg-marker">avg</span>}
                            </td>
                          );
                        } else if (value === null || value === undefined) {
                           // Handle null or undefined values explicitly, ensuring alignment from header is used
                          return (
                            <td key={header.key} style={cellStyle}>
                              N/A
                            </td>
                          );
                        }
                        // Default alignment for other types (e.g., strings)
                        return (
                          <td key={header.key} style={cellStyle}>
                            {String(value)}
                          </td>
                        );
                      })}
                    </tr>
                    
                    {isExpanded && (
                      <tr className="details-row">
                        <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1}>
                          <div className="row-details">
                            <div className="details-header">
                              <h4>
                                Details for {aggregationLevel === 'none' 
                                  ? formatDate(row.Time_Stamp) 
                                  : `${row.Time_Stamp_display || row.Time_Stamp} ${row.Time_Stamp_aggregation_label || ''}`}
                              </h4>
                              {aggregationLevel !== 'none' && row.aggregated_count && 
                                <span className="aggregated-records-info prominent">
                                  (Aggregated from {row.aggregated_count} records)
                                </span>
                              }
                              <div className="details-actions">
                                <button 
                                  className="details-action-button" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportToCSV([row], `data_point_${new Date(row.Time_Stamp).toISOString().split('T')[0]}.csv`);
                                  }}
                                  title="Export this record"
                                >
                                  <span role="img" aria-label="Export">📤</span> Export
                                </button>
                              </div>
                            </div>
                            
                            <div className="details-metrics-overview">
                              {/* Flow, Pressure, and Fluid State high-level indicators */}
                              <div className={`metric-pill ${flowStatus}`}>
                                <span className="metric-label">Flow:</span>
                                <span className="metric-value">{row.rTotalQ?.toFixed(2) || 'N/A'}</span>
                                <span className="metric-unit">m³/h</span>
                              </div>
                              <div className={`metric-pill ${pressureStatus}`}>
                                <span className="metric-label">Pressure:</span>
                                <span className="metric-value">{row.rTotalQPercentage?.toFixed(2) || 'N/A'}</span>
                                <span className="metric-unit">kPa</span>
                              </div>
                              <div className="metric-pill" style={{ backgroundColor: `${fluidState.color}25`, borderColor: fluidState.color }}>
                                <span className="metric-label">Fluid State:</span>
                                <span className="metric-value" style={{ color: fluidState.color }}>{row.systemFluidState?.toFixed(1) || 'N/A'}</span>
                                <span className="metric-unit">{fluidState.description}</span>
                              </div>
                            </div>
                            
                            <div className="details-grid">
                              <div className="detail-card">
                                <div className="detail-card-header">
                                  <h5>Flow Analysis</h5>
                                  <div className={`trend-badge trend-badge-${flowTrend}`}>
                                    {getBadgeText(flowTrend)}
                                  </div>
                                </div>
                                <div className="detail-value">
                                  <div className="detail-main-value">
                                    <span className="primary">{row.rTotalQ?.toFixed(2) || 'N/A'} m³/h</span>
                                    {flowTrend !== 'neutral' && (
                                      <span className={`trend-arrow trend-${flowTrend}`}></span>
                                    )}
                                  </div>
                                  
                                  {tableMetrics && row.rTotalQ !== undefined && (
                                    <>
                                      <div className="comparison-bar-container">
                                        <div className="min-max-labels">
                                          <span className="min-label">Min: {tableMetrics.flow.min.toFixed(1)}</span>
                                          <span className="max-label">Max: {tableMetrics.flow.max.toFixed(1)}</span>
                                        </div>
                                        <div className="comparison-bar">
                                          <div 
                                            className="avg-marker"
                                            style={{ 
                                              left: `${Math.min(100, Math.max(0, (tableMetrics.flow.avg - tableMetrics.flow.min) / 
                                                (tableMetrics.flow.max - tableMetrics.flow.min) * 100))}%` 
                                            }}
                                            title={`Average: ${tableMetrics.flow.avg.toFixed(2)}`}
                                          ></div>
                                          <div 
                                            className={`value-marker ${flowStatus}`}
                                            style={{ 
                                              left: `${Math.min(100, Math.max(0, (row.rTotalQ - tableMetrics.flow.min) / 
                                                (tableMetrics.flow.max - tableMetrics.flow.min) * 100))}%` 
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    
                                      <div className="metric-comparison">
                                        <span className="label">vs. Average:</span>
                                        <span className={`value ${flowStatus}`}>
                                          {((row.rTotalQ / tableMetrics.flow.avg - 1) * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                      
                                      <div className="position-indicator">
                                        {row.rTotalQ > tableMetrics.flow.avg ? (
                                          <span className="above-indicator">Above average</span>
                                        ) : (
                                          <span className="below-indicator">Below average</span>
                                        )}
                                      </div>
                                      
                                      <div className="insights">
                                        {(() => { // Wrap IIFE in a block to avoid direct rendering of its result
                                          let flow_insights; // Declare variable
                                          if (row.rTotalQ > tableMetrics.flow.max * 0.9) {
                                            flow_insights = "Flow is near maximum capacity. Check system pressure.";
                                          } else if (row.rTotalQ < tableMetrics.flow.min * 1.1) {
                                            flow_insights = "Flow is near minimum threshold. Check for blockages.";
                                          } else if (flowTrend === 'up-significant') {
                                            flow_insights = "Flow is increasing rapidly. Monitor system stability.";
                                          } else if (flowTrend === 'down-significant') {
                                            flow_insights = "Flow is decreasing rapidly. Check for system issues.";
                                          } else {
                                            flow_insights = "Flow is within normal operational range.";
                                          }
                                          return <p>{flow_insights}</p>; // Render the insight
                                        })()}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="detail-card">
                                <div className="detail-card-header">
                                  <h5>Pressure Analysis</h5>
                                  <div className={`trend-badge trend-badge-${pressureTrend}`}>
                                    {getBadgeText(pressureTrend)}
                                  </div>
                                </div>
                                <div className="detail-value">
                                  <div className="detail-main-value">
                                    <span className="primary">{row.rTotalQPercentage?.toFixed(2) || 'N/A'} kPa</span>
                                    {pressureTrend !== 'neutral' && (
                                      <span className={`trend-arrow trend-${pressureTrend}`}></span>
                                    )}
                                  </div>
                                  
                                  {tableMetrics && row.rTotalQPercentage !== undefined && (
                                    <>
                                      <div className="comparison-bar-container">
                                        <div className="min-max-labels">
                                          <span className="min-label">Min: {tableMetrics.pressure.min.toFixed(1)}</span>
                                          <span className="max-label">Max: {tableMetrics.pressure.max.toFixed(1)}</span>
                                        </div>
                                        <div className="comparison-bar">
                                          <div 
                                            className="avg-marker"
                                            style={{ 
                                              left: `${Math.min(100, Math.max(0, (tableMetrics.pressure.avg - tableMetrics.pressure.min) / 
                                                (tableMetrics.pressure.max - tableMetrics.pressure.min) * 100))}%` 
                                            }}
                                            title={`Average: ${tableMetrics.pressure.avg.toFixed(2)}`}
                                          ></div>
                                          <div 
                                            className={`value-marker ${pressureStatus}`}
                                            style={{ 
                                              left: `${Math.min(100, Math.max(0, (row.rTotalQPercentage - tableMetrics.pressure.min) / 
                                                (tableMetrics.pressure.max - tableMetrics.pressure.min) * 100))}%` 
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                      
                                      <div className="metric-comparison">
                                        <span className="label">vs. Average:</span>
                                        <span className={`value ${pressureStatus}`}>
                                          {((row.rTotalQPercentage / tableMetrics.pressure.avg - 1) * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                      
                                      <div className="position-indicator">
                                        {row.rTotalQPercentage > tableMetrics.pressure.avg ? (
                                          <span className="above-indicator">Above average</span>
                                        ) : (
                                          <span className="below-indicator">Below average</span>
                                        )}
                                      </div>
                                      
                                      <div className="insights">
                                        {(() => { // Wrap IIFE in a block
                                          let pressure_insights; // Declare variable
                                          if (row.rTotalQPercentage > tableMetrics.pressure.max * 0.9) {
                                            pressure_insights = "Pressure is near maximum capacity. Check system for potential issues.";
                                          } else if (row.rTotalQPercentage < tableMetrics.pressure.min * 1.1) {
                                            pressure_insights = "Pressure is near minimum threshold. Check pump functionality.";
                                          } else if (pressureTrend === 'up-significant') {
                                            pressure_insights = "Pressure is increasing rapidly. Check for restrictions.";
                                          } else if (pressureTrend === 'down-significant') {
                                            pressure_insights = "Pressure is decreasing rapidly. Check for leaks.";
                                          } else {
                                            pressure_insights = "Pressure is within normal operational range.";
                                          }
                                          return <p>{pressure_insights}</p>; // Render the insight
                                        })()}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="detail-card">
                                <div className="detail-card-header">
                                  <h5>System Fluid State Analysis</h5>
                                  <div className={`trend-badge trend-badge-${fluidStateTrend}`}>
                                    {getBadgeText(fluidStateTrend)}
                                  </div>
                                </div>
                                <div className="detail-value">
                                  <div className="detail-main-value">
                                    <span className="primary" style={{ color: fluidState.color }}>
                                      {row.systemFluidState?.toFixed(1) || 'N/A'} - {fluidState.description}
                                    </span>
                                    {fluidStateTrend !== 'neutral' && (
                                      <span className={`trend-arrow trend-${fluidStateTrend}`}></span>
                                    )}
                                  </div>
                                  
                                  {tableMetrics && row.systemFluidState !== undefined && (
                                    <div className="fluid-state-details">
                                      <div className="state-gauge-container">
                                        <div className="state-gauge-labels">
                                          <span className="poor">Poor</span>
                                          <span className="acceptable">Acceptable</span>
                                          <span className="good">Good</span>
                                          <span className="optimal">Optimal</span>
                                        </div>
                                        <div className="state-gauge">
                                          <div className="state-gauge-segments">
                                            <div className="segment poor"></div>
                                            <div className="segment acceptable"></div>
                                            <div className="segment good"></div>
                                            <div className="segment optimal"></div>
                                          </div>
                                          <div 
                                            className="state-marker" 
                                            style={{ 
                                              left: `${Math.min(100, row.systemFluidState)}%`,
                                              borderColor: fluidState.color
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                      
                                      <div className="metric-comparison">
                                        <span className="label">vs. Average:</span>
                                        <span className={row.systemFluidState > tableMetrics.fluidState.avg ? 'text-success' : 'text-danger'}>
                                          {((row.systemFluidState / tableMetrics.fluidState.avg - 1) * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                      
                                      <div className="position-indicator">
                                        {row.systemFluidState > tableMetrics.fluidState.avg ? (
                                          <span className="above-indicator">Above average</span>
                                        ) : (
                                          <span className="below-indicator">Below average</span>
                                        )}
                                      </div>
                                      
                                      <div className="insights">
                                        {(() => { // Wrap IIFE in a block
                                          let fluid_state_insights; // Declare variable
                                          if (row.systemFluidState >= 80) {
                                            fluid_state_insights = "System fluid state is optimal. Maintain current operating conditions.";
                                          } else if (row.systemFluidState >= 60) {
                                            fluid_state_insights = "System fluid state is good. Minor adjustments may improve performance.";
                                          } else if (row.systemFluidState >= 40) {
                                            fluid_state_insights = "System fluid state is acceptable but needs attention.";
                                          } else {
                                            fluid_state_insights = "System fluid state is poor. Immediate action required.";
                                          }
                                          return <p>{fluid_state_insights}</p>; // Render the insight
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="detail-card correlations">
                                <h5>Data Point Analysis</h5>
                                <div className="correlations-content">
                                  <div className="correlation-insight">
                                    <h6>Flow-Pressure Correlation</h6>
                                    {(() => {
                                      const flowRatio = row.rTotalQ / tableMetrics.flow.avg;
                                      const pressureRatio = row.rTotalQPercentage / tableMetrics.pressure.avg;
                                      const difference = Math.abs(flowRatio - pressureRatio);
                                      
                                      if (difference > 0.3) {
                                        return (
                                          <div className="correlation-warning">
                                            <span className="warning-icon">⚠️</span>
                                            <span>
                                              Flow and pressure values show significant deviation from normal correlation patterns.
                                              {flowRatio > pressureRatio 
                                                ? " Flow is high relative to pressure." 
                                                : " Pressure is high relative to flow."}
                                            </span>
                                          </div>
                                        );
                                      } else if (difference > 0.15) {
                                        return (
                                          <div className="correlation-notice">
                                            <span className="notice-icon">ℹ️</span>
                                            <span>
                                              Flow and pressure values show slight deviation from normal correlation.
                                              Consider monitoring system for changes.
                                            </span>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="correlation-normal">
                                            <span className="normal-icon">✓</span>
                                            <span>
                                              Flow and pressure values are within normal correlation ranges.
                                              System appears to be operating normally.
                                            </span>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                  
                                  <div className="system-recommendation">
                                    <h6>System Recommendation</h6>
                                    <div className="recommendation-content">
                                      {(() => {
                                        const issues = [];
                                        
                                        if (flowStatus === 'high') issues.push("high flow");
                                        if (flowStatus === 'low') issues.push("low flow");
                                        if (pressureStatus === 'high') issues.push("high pressure");
                                        if (pressureStatus === 'low') issues.push("low pressure");
                                        if (row.systemFluidState < 40) issues.push("poor fluid state");
                                        
                                        if (issues.length > 0) {
                                          return (
                                            <>
                                              <p className="recommendation-alert">
                                                System attention required due to: {issues.join(", ")}.
                                              </p>
                                              <p>
                                                Recommended action: 
                                                {issues.includes("high flow") && " Check for excessive demand or system misconfiguration."}
                                                {issues.includes("low flow") && " Inspect for blockages or restrictions in flow path."}
                                                {issues.includes("high pressure") && " Verify pressure relief mechanisms are functioning."}
                                                {issues.includes("low pressure") && " Check pump operation and system for leaks."}
                                                {issues.includes("poor fluid state") && " Schedule maintenance for fluid quality improvement."}
                                              </p>
                                            </>
                                          );
                                        } else {
                                          return (
                                            <p className="recommendation-normal">
                                              System is operating within normal parameters. No action required.
                                            </p>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="page-button prev"
        >
          Previous
        </button>
        
        <div className="page-info">
          Page {currentPage} of {Math.max(1, Math.ceil(processedData.length / rowsPerPage))}
          <span className="record-count">
            ({processedData.length} records)
          </span>
        </div>
        
        <button
          onClick={() => setCurrentPage((prev) => 
            prev < Math.ceil(processedData.length / rowsPerPage) ? prev + 1 : prev
          )}
          disabled={currentPage >= Math.ceil(processedData.length / rowsPerPage)}
          className="page-button next"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default DataTable;