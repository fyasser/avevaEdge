import React, { useEffect, useState, useRef } from 'react';
import ReportChart from './ReportChart';
import './App.css';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import io from 'socket.io-client';
import { 
  destroyAllCharts, 
  installGlobalErrorPrevention,
  getFluidStateDescription 
} from './utils/chartInstanceManager';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler, // Added the missing Filler import
} from 'chart.js';

import ChartCarousel from './ChartCarousel';
import DataTable from './DataTable';
import FilterOptions from './FilterOptions';
import InsightGenerator from './InsightGenerator';
import TimeAggregation from './TimeAggregation'; // Add TimeAggregation to the imports near the top of the file
import ChartDateFilter from './ChartDateFilter'; // Add ChartDateFilter import near the top of the file if it's not already there
// Removed import of QuickFilters
import './InsightGenerator.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Install global error prevention as early as possible
installGlobalErrorPrevention();

// Helper function to safely parse numeric values
const parseNumericValue = (value, defaultValue = null) => { // Default to null
  if (value === null || value === undefined || String(value).trim() === '' || String(value).toUpperCase() === 'N/A') {
    return defaultValue;
  }
  const numericValue = parseFloat(String(value).replace(/,/g, '')); // Handle thousands separators if any
  return isNaN(numericValue) ? defaultValue : numericValue;
};

// New helper function to process individual data items
const processDataItem = (item) => {
  // Step 1: Map counter to systemFluidState
  // If item.counter exists, use it.
  // Else, if item.systemFluidState exists, use it.
  // Else, set to null.
  let rawSystemFluidState;
  if (item.counter !== undefined) {
    rawSystemFluidState = item.counter;
  } else if (item.systemFluidState !== undefined) {
    rawSystemFluidState = item.systemFluidState;
  } else {
    rawSystemFluidState = null; // Explicitly null if neither exists
  }

  const mappedItem = {
    ...item, // Spread original item first
    systemFluidState: rawSystemFluidState, // Override systemFluidState with the mapped value
    rNoise: item.cPlant_1_rNoise // Map cPlant_1_rNoise to rNoise
  };

  // Step 2: Parse numeric values including the potentially remapped systemFluidState
  return {
    ...mappedItem,
    rTotalQ: parseNumericValue(mappedItem.rTotalQ, null),
    rTotalQPercentage: parseNumericValue(mappedItem.rTotalQPercentage, null),
    systemFluidState: parseNumericValue(mappedItem.systemFluidState, null),
    rNoise: parseNumericValue(mappedItem.rNoise, null) // Parse rNoise as numeric value
  };
};

function App() {  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [doughnutChartData, setDoughnutChartData] = useState(null);
  const [lineChartData, setLineChartData] = useState(null);
  const [scatterChartData, setScatterChartData] = useState(null);
  const [chartRenderKey, setChartRenderKey] = useState(Date.now()); // Key for forcing chart rerenders
  const [selectedCharts, setSelectedCharts] = useState({
    bar: true,
    doughnut: true,
    line: true,
    scatter: true
  });
  
  // Initialize with empty date range to prevent auto-loading
  const [dateRange, setDateRange] = useState({ 
    start: '', 
    end: '' 
  });
  
  const [dataFilters, setDataFilters] = useState({
    filterField: 'rTotalQ',
    minValue: '',
    maxValue: '',
    threshold: '',
    comparisonOperator: 'gt',
    aggregation: 'none' // Ensure aggregation is part of dataFilters state
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);  // Don't start loading until user initiates it
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track if user has loaded data

  const [metrics, setMetrics] = useState({
    totalFlow: 0,
    totalPressure: 0,
    activeSensors: 0,
    systemEfficiency: '0%',
    averageNoise: '0.00' // Added average noise metric
  });

  // Add this state management for chart-specific aggregation levels
  const [chartAggregationLevels, setChartAggregationLevels] = useState({
    pressure: 'none',
    flow: 'none',
    noise: 'none' // Add noise to chartAggregationLevels state
  });

  // Add state for chart-specific date filters
  const [chartDateFilters, setChartDateFilters] = useState({
    pressure: null,
    flow: null,
    noise: null // Add noise to chartDateFilters state
  });

  // Reference to socket.io connection
  const socketRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Set up Socket.IO connection for real-time data updates
  useEffect(() => {
    // Initialize Socket.IO connection
    socketRef.current = io('http://localhost:5000');
      // Connection event
    socketRef.current.on('connect', () => {
      console.log('Connected to server via Socket.IO');
      setIsConnected(true);
      
      // Send minimal filter settings to get some initial data for the chart carousel
      // Use a small timeout to ensure connection is fully established
      setTimeout(() => {
        sendFilterSettings();
      }, 500);
    });
    
    // Disconnection event
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });
    
    // Add a log to verify if rNoise data is received correctly
    socketRef.current.on('initial-data', (data) => {
      console.log('Received initial data:', data.length, 'records');
    
      if (data.length > 0) {
        console.log('Sample data record:', data[0]);
        console.log('rNoise values in data:', data.map(item => item.cPlant_1_rNoise)); // Log rNoise values
    
        const processedData = data.map(processDataItem); // Process data
        console.log('Sample processed data record:', processedData[0]);
        console.log('Processed rNoise values:', processedData.map(item => item.rNoise)); // Log processed rNoise values
        
        updateAllChartData(processedData);
        setLastUpdate(new Date());
        setTableData(processedData);
        setInitialLoadComplete(true);
      } else {
        console.log('No data returned from server for the selected filters');
        // Clear any existing data when filters return no results
        setTableData([]);
        // Set empty chart data
        setEmptyChartData();
      }
    
      setIsLoading(false);
    });
    
    // Handle new data updates
    socketRef.current.on('new-data', (newData) => {
      if (newData.length > 0) {
        console.log('Received new data:', newData.length, 'records');
        const processedNewData = newData.map(processDataItem); // Process new data items

        // Update the table data with new records
        setTableData(prevData => {
          // Combine new data with existing, avoiding duplicates by using a Map
          const dataMap = new Map();
          
          // Add existing data to map (keyed by timestamp)
          // Assuming prevData is already processed
          prevData.forEach(item => {
            const key = new Date(item.Time_Stamp).getTime();
            dataMap.set(key, item);
          });
          
          // Add/overwrite with new processed data
          processedNewData.forEach(item => {
            const key = new Date(item.Time_Stamp).getTime();
            dataMap.set(key, item);
          });
          
          // Convert back to array and sort by timestamp (newest first)
          const updatedData = Array.from(dataMap.values())
            .sort((a, b) => new Date(b.Time_Stamp) - new Date(a.Time_Stamp));
            
          // Update all charts with the new combined and processed data
          updateAllChartData(updatedData);
          setLastUpdate(new Date());
          
          return updatedData;
        });
      }
    });
    
    // Clean up socket connection on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  // Helper function to send current filter settings to the server
  const sendFilterSettings = () => {
    if (socketRef.current && socketRef.current.connected) {
      // Combine all filter settings (include date range even if not fully set)
      const filters = {
        ...dateRange,
        ...dataFilters,
        selectedCharts
      };
      
      // Send to server
      socketRef.current.emit('update-filters', filters);
      console.log('Sent filter settings to server:', filters);
    } else {
      console.warn('Socket not connected, cannot send filter settings');
    }
  };

  // Function to set empty chart data structures
  const setEmptyChartData = () => {
    // Empty bar chart
    setChartData({
      labels: [],
      datasets: [{
        label: 'Flow',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      }]
    });
      // Empty doughnut chart
    setDoughnutChartData({      labels: ['System Fluid State', 'Flow', 'Pressure', 'Noise'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',  // Blue for System Fluid State
          'rgba(75, 192, 192, 0.6)',  // Green for Flow
          'rgba(255, 99, 132, 0.6)',  // Red for Pressure
          'rgba(255, 193, 7, 0.6)',   // Yellow for Noise (AVEVA warning yellow)
        ],
      }]
    });
      // Empty line chart
    setLineChartData({
      labels: [],
      datasets: [
        {
          label: 'Flow',
          data: [],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        },
        {
          label: 'Pressure',
          data: [],
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
        },        {
          label: 'Noise',
          data: [],
          borderColor: 'rgba(255, 193, 7, 1)',
          backgroundColor: 'rgba(255, 193, 7, 0.2)',
          fill: true,
        }
      ]
    });
      // Empty scatter chart
    setScatterChartData({
      datasets: [
        {
          label: 'Flow vs Pressure (size: System Fluid State)',
          data: [],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {          label: 'Flow vs Noise',
          data: [],
          backgroundColor: 'rgba(255, 193, 7, 0.7)', // Yellow for noise
          pointRadius: 3,
          pointHoverRadius: 5,
          hidden: false // Changed to visible by default
        },
      ]
    });
    
    // Reset metrics
    setMetrics({
      totalFlow: '0.00',
      totalPressure: '0.00',
      activeSensors: 0,
      systemEfficiency: '0.00',
      averageNoise: '0.00' // Added average noise metric
    });
  };
  // Initialize with empty charts and send initial filter settings
  useEffect(() => {
    setEmptyChartData();
    
    // Send initial filter settings to populate the carousel
    // Add a small delay to ensure socket connection is established
    const initialDataTimer = setTimeout(() => {
      if (socketRef.current && socketRef.current.connected) {
        sendFilterSettings();
      }
    }, 1000);
    
    return () => clearTimeout(initialDataTimer);
  }, []);

  // Function to update all chart types with new data
  const updateAllChartData = (data) => {
    console.log("updateAllChartData called with data:", {
      dataLength: data?.length,
      firstItem: data?.[0],
      lastItem: data?.length > 0 ? data[data.length - 1] : null
    });

    // Ensure data is not empty
    if (!data || data.length === 0) {
      console.log('No data to update charts');
      setEmptyChartData();
      return;
    }
  
    // Data is already processed (counter mapped to systemFluidState, and parsed).
    // No need for an additional mapping step here.
  
    // Sort data by timestamp in ascending order for proper chart display
    const sortedData = [...data].sort((a, b) => new Date(a.Time_Stamp) - new Date(b.Time_Stamp));
  
    // Sample data points if there are too many (prevent chart from growing indefinitely)
    const maxPoints = 150; // Maximum number of data points to display
    let displayData = sortedData;
    
    if (sortedData.length > maxPoints) {
      const sampleRate = Math.ceil(sortedData.length / maxPoints);
      displayData = sortedData.filter((_, index) => index % sampleRate === 0);
      console.log(`Sampling data from ${sortedData.length} to ${displayData.length} points`);
    }
  
  // Update Bar Chart data
    const formattedChartData = {
      labels: displayData.map((item) => format(new Date(item.Time_Stamp), 'MMM dd HH:mm')),
      datasets: [
        {
          label: 'Flow',
          data: displayData.map((item) => {
            // Ensure we have valid numeric data
            const value = parseFloat(item.rTotalQ);
            return isNaN(value) ? null : value;
          }),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(75, 192, 192, 1)'
        },
        {
          label: 'Pressure',
          data: displayData.map((item) => {
            // Ensure we have valid numeric data
            const value = parseFloat(item.rTotalQPercentage);
            return isNaN(value) ? null : value;
          }),
          backgroundColor: 'rgba(255, 99, 133, 0.23)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(255, 99, 132, 1)'
        },
        {          label: 'Noise',
          data: displayData.map((item) => {
            // Ensure we have valid numeric data
            const value = parseFloat(item.rNoise);
            return isNaN(value) ? null : value;
          }),
          backgroundColor: 'rgba(255, 193, 7, 0.8)', /* Changed to AVEVA warning yellow */
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(255, 193, 7, 1)'
        }
      ],
    };
    setChartData(formattedChartData);
      // Update Doughnut Chart data - renamed sensors to System Efficiency
    const formattedDoughnutChartData = {
      labels: ['System Fluid State', 'Flow', 'Pressure', 'Noise'],
      datasets: [
        {
          data: [
            displayData.reduce((sum, item) => sum + item.systemFluidState, 0),
            displayData.reduce((sum, item) => sum + item.rTotalQ, 0),
            displayData.reduce((sum, item) => sum + item.rTotalQPercentage, 0),
            displayData.reduce((sum, item) => sum + (item.rNoise || 0), 0),
          ],          backgroundColor: [
            'rgba(54, 162, 235, 0.6)', // Blue for System Efficiency
            'rgba(75, 192, 192, 0.6)', // Green for Flow
            'rgba(255, 99, 132, 0.6)', // Red for Pressure
            'rgba(255, 193, 7, 0.6)', // Yellow for Noise (AVEVA warning yellow)
          ],
        },
      ],
    };
    setDoughnutChartData(formattedDoughnutChartData);
    
    // Update Line Chart data with renamed labels and removing System Efficiency
    const formattedLineChartData = {
      labels: displayData.map((item) => format(new Date(item.Time_Stamp), 'MMM dd HH:mm')),
      datasets: [
        {
          label: 'Flow',
          data: displayData.map((item) => item.rTotalQ),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        },
        {
          label: 'Pressure',
          data: displayData.map((item) => item.rTotalQPercentage),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(243, 181, 197, 0.67)',
          fill: true,
        },
        {          label: 'Noise',
          data: displayData.map((item) => item.rNoise),
          borderColor: 'rgba(255, 193, 7, 1)', // Changed to AVEVA warning yellow
          backgroundColor: 'rgba(255, 193, 7, 0.2)',
          fill: true,
        }
      ],
    };
    setLineChartData(formattedLineChartData);
      // Update Scatter Chart data to compare Flow vs Pressure with System Efficiency as point size
    // Create two scatter chart datasets - one for the original comparison and one for noise
    const formattedScatterChartData = {
      datasets: [
        {
          label: 'Flow vs Pressure (size: System Fluid State)',
          data: displayData.map((item) => ({
            x: item.rTotalQ,
            y: item.rTotalQPercentage,
            r: Math.max(3, Math.min(10, item.systemFluidState / 10)), // Size based on System Fluid State (scaled)
            efficiency: item.systemFluidState,
            noise: item.rNoise, // Include noise data for tooltip
            timestamp: format(new Date(item.Time_Stamp), 'MMM dd HH:mm:ss')
          })),
          backgroundColor: displayData.map(item => {
            // Color points based on efficiency (more efficient = more blue)
            const efficiency = item.systemFluidState;
            if (efficiency > 75) {
              return 'rgba(0, 153, 255, 0.7)'; // High efficiency - blue
            } else if (efficiency > 50) {
              return 'rgba(46, 204, 113, 0.7)'; // Medium efficiency - green
            } else if (efficiency > 25) {
              return 'rgba(255, 195, 0, 0.7)'; // Low efficiency - yellow
            } else {
              return 'rgba(255, 87, 51, 0.7)'; // Very low efficiency - red
            }
          }),
          pointRadius: displayData.map(item => Math.max(3, Math.min(10, item.systemFluidState / 10))),
          pointHoverRadius: displayData.map(item => Math.max(5, Math.min(15, item.systemFluidState / 8))),
        },
        {          label: 'Flow vs Noise',
          data: displayData.map((item) => ({
            x: item.rTotalQ,
            y: item.rNoise,
            r: 3, // Fixed size for noise points
            timestamp: format(new Date(item.Time_Stamp), 'MMM dd HH:mm:ss')
          })),
          backgroundColor: 'rgba(255, 193, 7, 0.7)', // Changed to AVEVA warning yellow
          pointRadius: 3,
          pointHoverRadius: 5,
          hidden: false // Show by default, can be toggled via legend
        },
      ],
    };
    setScatterChartData(formattedScatterChartData);
    
    // Calculate and update metrics
    const avgFlow = displayData.length > 0 ?
      displayData.reduce((sum, item) => sum + (item.rTotalQ || 0), 0) / displayData.length : 0;
    const avgPressure = displayData.length > 0 ?
      displayData.reduce((sum, item) => sum + (item.rTotalQPercentage || 0), 0) / displayData.length : 0;
    const avgSystemFluidState = displayData.length > 0 ? 
      displayData.reduce((sum, item) => sum + (item.systemFluidState || 0), 0) / displayData.length : 0;
    const avgNoise = displayData.length > 0 ?
      displayData.reduce((sum, item) => sum + (item.rNoise || 0), 0) / displayData.length : 0;
    
    setMetrics({
      totalFlow: avgFlow.toFixed(2),
      totalPressure: avgPressure.toFixed(2),
      systemEfficiency: isNaN(avgSystemFluidState) ? '0.00%' : avgSystemFluidState.toFixed(2),
      activeSensors: displayData.reduce((max, item) => Math.max(max, item.systemFluidState || 0), 0), // Use max systemFluidState as sensor count
      averageNoise: isNaN(avgNoise) ? '0.00' : avgNoise.toFixed(2) // Add average noise metric
    });
  };

  // Updated to fetch data based on current filter settings
  const fetchFilteredData = (additionalFilters = {}) => {
    // Validate date range before fetching
    if (!dateRange.start || !dateRange.end) {
      alert('Please select both start and end dates to load data.');
      return;
    }
    
    // Use our chart instance manager to properly clean up all chart instances
    // This prevents "Cannot read properties of null (reading 'ownerDocument')" errors
    destroyAllCharts();
    
    // Force chart rerenders with a new key
    setChartRenderKey(Date.now());
    
    setIsLoading(true);
    
    // If socket is connected, use socket for data updates
    if (socketRef.current && socketRef.current.connected) {
      // Update client filter settings
      const combinedFilters = {
        ...dateRange,
        ...dataFilters,
        ...additionalFilters,
        selectedCharts
      };
      
      // Send to server
      socketRef.current.emit('update-filters', combinedFilters);
      console.log('Sent updated filter settings to server via socket:', combinedFilters);
    } else {
      // Fall back to REST API if socket not available
      console.log('Socket not available, using REST API for filtered data');
      
      // Build query parameters with date range and filters
      const queryParams = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end
      });
      
      // Add filter field settings
      const filters = { ...dataFilters, ...additionalFilters };
      
      if (filters.filterField) {
        queryParams.append('filterField', filters.filterField);
      }
      
      if (filters.minValue) {
        queryParams.append('minValue', filters.minValue);
      }
      
      if (filters.maxValue) {
        queryParams.append('maxValue', filters.maxValue);
      }
      
      if (filters.threshold) {
        queryParams.append('threshold', filters.threshold);
        queryParams.append('comparisonOperator', filters.comparisonOperator || 'gt');
      }
      
      // Add selected charts if needed for backend filtering
      Object.entries(selectedCharts).forEach(([chart, isSelected]) => {
        if (isSelected) {
          queryParams.append(chart, 'true');
        }
      });

      fetch(`http://localhost:5000/api/trend-data?${queryParams.toString()}`)
        .then((response) => response.json())
        .then((apiData) => {
          // Process data using the new utility function
          const processedData = apiData.map(processDataItem);

          setTableData(processedData); 
          updateAllChartData(processedData); // Pass the already processed data
          
          setIsLoading(false);
          setInitialLoadComplete(true);
          setLastUpdate(new Date());
        })
        .catch((error) => {
          console.error('Error fetching filtered data:', error);
          setIsLoading(false);
        });
    }
  };

  // Handle chart selection
  const handleChartSelection = (event) => {
    const { name, checked } = event.target;
    setSelectedCharts((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle date range changes
  const handleDateRangeChange = (event) => {
    const { name, value } = event.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  // Handle additional filter changes
  const handleAdditionalFilterChange = (filterData) => {
    // Update the dataFilters state with all received filter data, including aggregation
    setDataFilters({
      ...dataFilters,
      ...filterData
    });
  };

  // This function will handle aggregation changes for individual charts
  const handleChartAggregationChange = (chartType, level) => {
    setChartAggregationLevels(prev => ({
      ...prev,
      [chartType]: level
    }));
    
    // Force chart rerenders when aggregation changes
    setChartRenderKey(Date.now());
  };

  // Function to handle chart-specific date filter changes
  const handleChartDateFilterChange = (chartType, dateFilter) => {
    console.log(`Chart date filter change for ${chartType}:`, dateFilter);
    
    setChartDateFilters(prev => {
      const updated = {
        ...prev,
        [chartType]: dateFilter
      };
      console.log(`Updated chartDateFilters:`, updated);
      return updated;
    });
    
    // Force chart rerenders when date filter changes
    setChartRenderKey(Date.now());
  };

  // Download page as HTML report
  function downloadPage(additionalFilters) {
    // Get the current date/time for the report
    const reportDate = new Date().toLocaleString();
    
    // Get all visible charts
    const charts = document.querySelectorAll('.chart-box canvas, .carousel-content canvas');
    const chartImages = Array.from(charts).map((chart, index) => {
      const img = chart.toDataURL('image/png');
      const chartTitle = chart.closest('.chart-box')?.querySelector('h3')?.textContent || 
                        `Chart ${index + 1}`;
      
      return `
        <div class="report-chart" id="chart-${index}">
          <div class="chart-header">
            <h3>${chartTitle}</h3>
            <div class="chart-actions">
              <button class="btn-expand" onclick="expandChart('chart-${index}')">
                <span class="icon">⛶</span>
              </button>
            </div>
          </div>
          <div class="chart-body">
            <img src="${img}" alt="${chartTitle}" style="max-width: 100%; height: auto;"/>
          </div>
        </div>
      `;
    }).join('');
    
    // Get the table content
    const table = document.querySelector('.data-table table');
    const tableHTML = table ? table.outerHTML.replace('<table', '<table id="data-table" class="interactive-table"') : '<p>No table data available</p>';
    
    // Create filter summary section
    const filterSummary = `
      <div class="filter-summary">
        <h3>Filter Settings</h3>
        <table class="filter-table">
          <tr>
            <th>Setting</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Date Range</td>
            <td>${dateRange.start} to ${dateRange.end}</td>
          </tr>
          <tr>
            <td>Chart Types</td>
            <td>${Object.entries(selectedCharts)
              .filter(([_, isSelected]) => isSelected)
              .map(([chartType]) => chartType.charAt(0).toUpperCase() + chartType.slice(1))
              .join(', ') || 'None'}</td>
          </tr>
          ${additionalFilters ? `
          <tr>
            <td>Filter Field</td>
            <td>${additionalFilters.filterField}</td>
          </tr>
          ${additionalFilters.minValue ? `
          <tr>
            <td>Min Value</td>
            <td>${additionalFilters.minValue}</td>
          </tr>` : ''}
          ${additionalFilters.maxValue ? `
          <tr>
            <td>Max Value</td>
            <td>${additionalFilters.maxValue}</td>
          </tr>` : ''}
          ${additionalFilters.threshold ? `
          <tr>
            <td>Threshold</td>
            <td>${additionalFilters.threshold} ${additionalFilters.comparisonOperator === 'gt' ? '>' : '<'}</td>
          </tr>` : ''}` : ''}
        </table>
      </div>
    `;
    
    // Create metrics summary
    const metricsSummary = `
      <div class="metrics-summary">
        <h3>Summary Metrics</h3>
        <table class="metrics-table">
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Total Flow</td>
            <td>${metrics.totalFlow}</td>
          </tr>
          <tr>
            <td>Total Pressure</td>
            <td>${metrics.totalPressure}</td>
          </tr>
          <tr>
            <td>Active Sensors</td>
            <td>${metrics.activeSensors}</td>
          </tr>
          <tr>
            <td>Last Update</td>
            <td>${lastUpdate ? lastUpdate.toLocaleString() : 'N/A'}</td>
          </tr>
        </table>
      </div>
    `;

    // Create the full report content with CSS for better styling and JavaScript for interactions
    const fullContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AVEVA Data Report</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          :root {
            --primary-color: #004f8b;
            --secondary-color: #0078d4;
            --accent-color: #28a745;
            --light-bg: #f8f9fa;
            --border-color: #ddd;
            --text-color: #333;
            --text-muted: #666;
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: var(--text-color);
            transition: background-color 0.3s;
          }
          
          body.dark-mode {
            background-color: #222;
            color: #eee;
          }
          
          .dark-mode .report-header {
            border-bottom: 2px solid #004f8b;
            background-color: #333;
          }
          
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 10px 20px;
            border-bottom: 2px solid var(--primary-color);
            background-color: var(--light-bg);
            border-radius: 5px;
          }
          
          .report-title {
            font-size: 24px;
            font-weight: bold;
            color: var(--primary-color);
          }
          
          .report-date {
            color: var(--text-muted);
          }
          
          .report-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .report-section {
            margin-bottom: 30px;
            border: 1px solid var(--border-color);
            border-radius: 5px;
            overflow: hidden;
          }
          
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: var(--light-bg);
            cursor: pointer;
            border-bottom: 1px solid var(--border-color);
          }
          
          .dark-mode .section-header {
            background-color: #333;
          }
          
          .section-header h2 {
            margin: 0;
            font-size: 18px;
            color: var(--primary-color);
          }
          
          .dark-mode .section-header h2 {
            color: #0078d4;
          }
          
          .section-content {
            padding: 15px;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
          }
          
          .filter-summary, .metrics-summary {
            margin-bottom: 15px;
            background-color: var(--light-bg);
            padding: 15px;
            border-radius: 5px;
          }
          
          .dark-mode .filter-summary,
          .dark-mode .metrics-summary {
            background-color: #333;
          }
          
          .filter-table, .metrics-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .filter-table th, .filter-table td,
          .metrics-table th, .metrics-table td {
            border: 1px solid var(--border-color);
            padding: 8px;
            text-align: left;
          }
          
          .filter-table th, .metrics-table th {
            background-color: #f0f0f0;
          }
          
          .dark-mode th {
            background-color: #444;
          }
          
          .dark-mode td,
          .dark-mode th {
            border-color: #555;
          }
          
          .report-charts {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 15px;
          }
          
          .report-chart {
            position: relative;
            margin-bottom: 15px;
            border: 1px solid var(--border-color);
            border-radius: 5px;
            overflow: hidden;
            transition: all 0.3s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .report-chart.expanded {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 1000px;
            height: auto;
            max-height: 90vh;
            z-index: 1000;
            background: white;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          }
          
          .dark-mode .report-chart.expanded {
            background: #222;
          }
          
          .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: var(--light-bg);
            border-bottom: 1px solid var(--border-color);
          }
          
          .dark-mode .chart-header {
            background-color: #333;
          }
          
          .chart-header h3 {
            margin: 0;
            font-size: 16px;
          }
          
          .chart-actions .btn-expand {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            color: var(--primary-color);
            padding: 0;
            width: 24px;
            height: 24px;
          }
          
          .chart-body {
            padding: 10px;
            overflow: auto;
          }
          
          .expanded .chart-body {
            height: calc(90vh - 60px);
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .expanded .chart-body img {
            max-height: 100%;
            object-fit: contain;
          }
          
          .overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            z-index: 999;
          }
          
          .overlay.active {
            display: block;
          }
          
          table.interactive-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          
          .interactive-table th, .interactive-table td {
            border: 1px solid var(--border-color);
            padding: 8px;
            text-align: left;
          }
          
          .interactive-table th {
            background-color: #f0f0f0;
            position: sticky;
            top: 0;
            cursor: pointer;
            user-select: none;
          }
          
          .dark-mode .interactive-table th {
            background-color: #444;
          }
          
          .interactive-table th:hover {
            background-color: #e0e0e0;
          }
          
          .dark-mode .interactive-table th:hover {
            background-color: #555;
          }
          
          .interactive-table th::after {
            content: '';
            float: right;
          }
          
          .interactive-table th.sort-asc::after {
            content: '↑';
          }
          
          .interactive-table th.sort-desc::after {
            content: '↓';
          }
          
          .table-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
            align-items: center;
          }
          
          #tableSearch {
            padding: 8px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            min-width: 200px;
          }
          
          .dark-mode #tableSearch {
            background-color: #333;
            color: #eee;
            border-color: #555;
          }
          
          .pagination {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 15px;
            justify-content: center;
          }
          
          .pagination button {
            padding: 5px 10px;
            border: 1px solid var(--border-color);
            background-color: white;
            cursor: pointer;
            border-radius: 3px;
          }
          
          .dark-mode .pagination button {
            background-color: #333;
            color: #eee;
            border-color: #555;
          }
          
          .pagination button.active {
            background-color: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
          }
          
          .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          #rowsPerPage {
            padding: 5px;
            border: 1px solid var(--border-color);
            border-radius: 3px;
          }
          
          .dark-mode #rowsPerPage {
            background-color: #333;
            color: #eee;
            border-color: #555;
          }
          
          .report-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: var(--text-muted);
            padding-top: 10px;
            border-top: 1px solid var(--border-color);
          }
          
          .btn {
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          
          .btn-primary {
            background-color: var(--primary-color);
            color: white;
          }
          
          .btn-secondary {
            background-color: var(--light-bg);
            border: 1px solid var(--border-color);
          }
          
          .dark-mode .btn-secondary {
            background-color: #444;
            color: #eee;
            border-color: #555;
          }
          
          .btn-group {
            display: flex;
            gap: 10px;
          }
          
          .theme-toggle {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 24px;
            color: var(--text-color);
          }
          
          .dark-mode .theme-toggle {
            color: #eee;
          }
          
          @media print {
            .no-print {
              display: none !important;
            }
            
            body {
              padding: 0;
              background-color: white;
              color: black;
            }
            
            .report-chart {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            .report-section {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            .section-content {
              display: block !important;
              max-height: none !important;
            }
            
            table {
              width: 100% !important;
            }
            
            .pagination {
              display: none;
            }
            
            #dataTable tbody tr {
              display: table-row !important;
            }
          }
          
          @media (max-width: 768px) {
            .report-charts {
              grid-template-columns: 1fr;
            }
            
            .report-controls {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .btn-group {
              margin-top: 10px;
              width: 100%;
              justify-content: space-between;
            }
          }
        </style>
      </head>
      <body>
        <div class="overlay" id="overlay"></div>
        <div class="report-container">
          <div class="report-header">
            <div class="report-title">AVEVA Data Report</div>
            <div class="report-date">Generated: ${reportDate}</div>
          </div>
          
          <div class="report-controls no-print">
            <div>
              <button id="toggleTheme" class="theme-toggle" title="Toggle dark/light mode">
                ☀️
              </button>
            </div>
            <div class="btn-group">
              <button class="btn btn-secondary" onclick="expandAllSections()">Expand All</button>
              <button class="btn btn-secondary" onclick="collapseAllSections()">Collapse All</button>
              <button class="btn btn-primary" onclick="window.print()">Print Report</button>
            </div>
          </div>

          <div className="report-section">
            <div className="section-header" onclick="toggleSection('filter-metrics-section')">
              <h2>Filter Settings & Metrics</h2>
              <span className="toggle-icon">▼</span>
            </div>
            <div className="section-content" id="filter-metrics-section" style="display: block;">
              <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                ${filterSummary}
                ${metricsSummary}
              </div>
            </div>
          </div>

          <div className="report-section">
            <div className="section-header" onclick="toggleSection('charts-section')">
              <h2>Charts</h2>
              <span className="toggle-icon">▼</span>
            </div>
            <div className="section-content" id="charts-section" style="display: block;">
              <div className="report-charts">
                ${chartImages}
              </div>
            </div>
          </div>

          <div className="report-section">
            <div className="section-header" onclick="toggleSection('data-table-section')">
              <h2>Data Table</h2>
              <span className="toggle-icon">▼</span>
            </div>
            <div className="section-content" id="data-table-section" style="display: block;">
              <div className="table-controls no-print">
                <input type="text" id="tableSearch" placeholder="Search in table..." onkeyup="filterTable()">
                <div>
                  <label for="rowsPerPage">Rows per page:</label>
                  <select id="rowsPerPage" onchange="changeRowsPerPage()">
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>
              ${tableHTML}
              <div className="pagination no-print" id="pagination"></div>
            </div>
          </div>

          <div className="report-footer">
            &copy; ${new Date().getFullYear()} AVEVA. All rights reserved.
          </div>
        </div>

        <script>
          // Toggle section visibility
          function toggleSection(sectionId) {
            const content = document.getElementById(sectionId);
            const header = content.previousElementSibling;
            const toggleIcon = header.querySelector('.toggle-icon');
            
            if (content.style.display === 'none') {
              content.style.display = 'block';
              toggleIcon.textContent = '▼';
            } else {
              content.style.display = 'none';
              toggleIcon.textContent = '▶';
            }
          }
          
          // Expand/collapse all sections
          function expandAllSections() {
            document.querySelectorAll('.section-content').forEach(section => {
              section.style.display = 'block';
              const toggleIcon = section.previousElementSibling.querySelector('.toggle-icon');
              toggleIcon.textContent = '▼';
            });
          }
          
          function collapseAllSections() {
            document.querySelectorAll('.section-content').forEach(section => {
              section.style.display = 'none';
              const toggleIcon = section.previousElementSibling.querySelector('.toggle-icon');
              toggleIcon.textContent = '▶';
            });
          }
          
          // Expand chart to fullscreen
          function expandChart(chartId) {
            const chart = document.getElementById(chartId);
            const overlay = document.getElementById('overlay');
            
            if (chart.classList.contains('expanded')) {
              chart.classList.remove('expanded');
              overlay.classList.remove('active');
            } else {
              chart.classList.add('expanded');
              overlay.classList.add('active');
            }
          }
          
          // Close expanded chart when clicking outside
          document.getElementById('overlay').addEventListener('click', function() {
            document.querySelectorAll('.report-chart.expanded').forEach(chart => {
              chart.classList.remove('expanded');
            });
            this.classList.remove('active');
          });
          
          // Table sorting functionality
          document.addEventListener('DOMContentLoaded', function() {
            const table = document.getElementById('data-table');
            if (table) {
              const headers = table.querySelectorAll('th');
              headers.forEach((header, index) => {
                header.addEventListener('click', function() {
                  sortTable(index);
                });
              });
              
              // Initialize pagination
              initPagination();
            }
          });
          
          function sortTable(columnIndex) {
            const table = document.getElementById('data-table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.rows);
            const headers = table.querySelectorAll('th');
            const clickedHeader = headers[columnIndex];
            
            // Toggle sort direction
            const isAscending = clickedHeader.classList.contains('sort-asc');
            
            // Clear all sorting classes
            headers.forEach(h => {
              h.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Set new sorting class
            clickedHeader.classList.add(isAscending ? 'sort-desc' : 'sort-asc');
            
            // Sort the rows
            rows.sort((a, b) => {
              const aValue = a.cells[columnIndex].textContent.trim();
              const bValue = b.cells[columnIndex].textContent.trim();
              
              // Check if we're dealing with numbers or dates
              const aNum = parseFloat(aValue.replace(/[^0-9.-]+/g,""));
              const bNum = parseFloat(bValue.replace(/[^0-9.-]+/g,""));
              
              if (!isNaN(aNum) && !isNaN(bNum)) {
                // Sort numerically
                return isAscending ? bNum - aNum : aNum - bNum;
              } else if (aValue.includes('/') || bValue.includes('/')) {
                // Likely a date - try to parse and compare
                try {
                  const aDate = new Date(aValue);
                  const bDate = new Date(bValue);
                  if (!isNaN(aDate) && !isNaN(bDate)) {
                    return isAscending ? bDate - aDate : aDate - bDate;
                  }
                } catch(e) {
                  // Fall back to string comparison
                }
              }
              
              // Default to string comparison
              return isAscending ? 
                bValue.localeCompare(aValue) : 
                aValue.localeCompare(bValue);
            });
            
            // Reorder the rows in the DOM
            rows.forEach(row => {
              tbody.appendChild(row);
            });
            
            // Update pagination
            if (window.currentPage) {
              showPage(window.currentPage);
            }
          }
          
          // Table search functionality
          function filterTable() {
            const input = document.getElementById('tableSearch');
            const filter = input.value.toUpperCase();
            const table = document.getElementById('data-table');
            const tr = table.querySelectorAll('tbody tr');
            
            let visibleCount = 0;
            
            tr.forEach(row => {
              let visible = false;
              const cells = row.querySelectorAll('td');
              
              cells.forEach(cell => {
                if (cell.textContent.toUpperCase().indexOf(filter) > -1) {
                  visible = true;
                }
              });
              
              // Store original visibility state for pagination
              row.dataset.filtered = visible ? 'true' : 'false';
              
              if (visible) {
                visibleCount++;
              }
            });
            
            // Reset and update pagination
            window.currentPage = 1;
            initPagination();
          }
          
          // Table pagination
          function initPagination() {
            const table = document.getElementById('data-table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.rows).filter(row => row.dataset.filtered !== 'false');
            const rowsPerPage = document.getElementById('rowsPerPage').value;
            
            if (rowsPerPage === 'all') {
              // Show all rows
              rows.forEach(row => {
                row.style.display = row.dataset.filtered === 'false' ? 'none' : '';
              });
              
              // Clear pagination
              document.getElementById('pagination').innerHTML = '';
              return;
            }
            
            const pageCount = Math.ceil(rows.length / rowsPerPage);
            
            // Create pagination controls
            const pagination = document.getElementById('pagination');
            pagination.innerHTML = '';
            
            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.textContent = 'Previous';
            prevBtn.disabled = true;
            prevBtn.addEventListener('click', () => {
              showPage(window.currentPage - 1);
            });
            pagination.appendChild(prevBtn);
            
            // Page numbers (simplified if many pages)
            if (pageCount <= 10) {
              for (let i = 1; i <= pageCount; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                  showPage(i);
                });
                pagination.appendChild(pageBtn);
              }
            } else {
              // Show first, current, and last pages with ellipsis
              for (let i = 1; i <= Math.min(3, pageCount); i++) {
                const pageBtn = document.createElement('button');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                  showPage(i);
                });
                pagination.appendChild(pageBtn);
              }
              
              if (pageCount > 3) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
                
                const lastPageBtn = document.createElement('button');
                lastPageBtn.textContent = pageCount;
                lastPageBtn.addEventListener('click', () => {
                  showPage(pageCount);
                });
                pagination.appendChild(lastPageBtn);
              }
            }
            
            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', () => {
              showPage(window.currentPage + 1);
            });
            pagination.appendChild(nextBtn);
            
            // Show first page
            window.currentPage = 1;
            showPage(1);
            
            function showPage(page) {
              const rowsPerPage = document.getElementById('rowsPerPage').value;
              if (rowsPerPage === 'all') return;
              
              const perPage = parseInt(rowsPerPage);
              const filteredRows = Array.from(tbody.rows).filter(row => row.dataset.filtered !== 'false');
              
              const startIndex = (page - 1) * perPage;
              const endIndex = startIndex + perPage;
              
              // Hide all rows first
              Array.from(tbody.rows).forEach(row => {
                row.style.display = 'none';
              });
              
              // Show only rows for current page
              filteredRows.slice(startIndex, endIndex).forEach(row => {
                row.style.display = '';
              });
              
              // Update current page
              window.currentPage = page;
              
              // Update pagination buttons
              const buttons = pagination.querySelectorAll('button');
              buttons.forEach(button => {
                button.classList.remove('active');
                if (button.textContent === page.toString()) {
                  button.classList.add('active');
                }
              });
              
              // Enable/disable previous/next buttons
              const prevBtn = buttons[0];
              const nextBtn = buttons[buttons.length - 1];
              
              prevBtn.disabled = page === 1;
              nextBtn.disabled = page === pageCount;
            }
          }
          
          function changeRowsPerPage() {
            initPagination();
          }
          
          // Theme toggle functionality
          document.getElementById('toggleTheme').addEventListener('click', function() {
            const body = document.body;
            body.classList.toggle('dark-mode');
            
            // Update button text
            this.textContent = body.classList.contains('dark-mode') ? '🌙' : '☀️';
            
            // Store preference in localStorage
            localStorage.setItem('reportTheme', body.classList.contains('dark-mode') ? 'dark' : 'light');
          });
          
          // Check for saved theme preference
          document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('reportTheme');
            const themeToggle = document.getElementById('toggleTheme');
            
            if (savedTheme === 'dark') {
              document.body.classList.add('dark-mode');
              themeToggle.textContent = '🌙';
            }
          });
        </script>
      </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([fullContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `aveva_report_${new Date().getTime()}.html`);
  }

  // Show initial empty state or loading indicator
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading data based on selected filters...</p>
      </div>
    );
  }

  // Main app rendering
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>{isSidebarCollapsed ? '' : 'Reports'}</h2>
          <button 
            className="toggle-button" 
            onClick={toggleSidebar} 
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? '›' : '‹'}
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <span className="material-icons">dashboard</span>
              {!isSidebarCollapsed && <span className="nav-text">Dashboard</span>}
              <a href="/" className="nav-link"></a>
            </li>
            <li>
              <span className="material-icons">settings</span>
              {!isSidebarCollapsed && <span className="nav-text">Settings</span>}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar with connection status */}
        <header className="top-bar">
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
              <span className="material-icons" style={{ marginRight: '5px', color: isConnected ? '#28A745' : '#DC3545' }}>
                {isConnected ? 'sync' : 'sync_disabled'}
              </span>
              <span style={{ fontSize: '14px' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {lastUpdate && `Last update: ${lastUpdate.toLocaleTimeString()}`}
              {!initialLoadComplete && <span style={{ marginLeft: '10px', color: '#007bff' }}>Select dates and apply filters to load data</span>}
            </div> {/* This closes the div with style={{ fontSize: '14px', ... }} */}
          </div> {/* This closes the div with style={{ marginRight: 'auto', ... }} */}
          {/* The erroneous extra </div> that was at error line 1626 has been removed. */}
          <div className="top-bar-icons">
            <span className="material-icons">notifications</span>
            <div className="user-profile">
              <img 
                src="https://randomuser.me/api/portraits/men/75.jpg" 
                alt="User Profile" 
                className="profile-pic" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://ui-avatars.com/api/?name=Admin&background=4c51bf&color=fff';
                }}
              />
              <span className="user-name">Admin</span>
            </div>
          </div>
        </header>

        {/* Metrics Section */}
        <section className="metrics">
          <div className="metric-card">
            <span className="material-icons">water_drop</span>
            <div className="metric-info">
              <h3>Average Flow</h3>
              <p>{metrics.totalFlow} m³/h</p>
            </div>
          </div>
          <div className="metric-card">
            <span className="material-icons">speed</span>
            <div className="metric-info">
              <h3>Average Pressure</h3>
              <p>{metrics.totalPressure} kPa</p>
            </div>
          </div>
          <div className="metric-card">
            <span className="material-icons">trending_up</span>
            <div className="metric-info">
              <h3>System Fluid State</h3>
              <p>{isNaN(parseFloat(metrics.systemEfficiency)) ? 
                'Unknown' : 
                getFluidStateDescription(parseFloat(metrics.systemEfficiency)).description}
              </p>
            </div>
          </div>
          <div className="metric-card">
            <span className="material-icons">volume_up</span>
            <div className="metric-info">
              <h3>Average Noise</h3>
              <p>{metrics.averageNoise} dB</p>
            </div>
          </div>
        </section>
        
        {/* Main Filter Panel - Ensure it receives dataFilters and the handler */}
        <section className="filter-section main-filter-panel">
          <FilterOptions
            selectedCharts={selectedCharts}
            handleChartSelection={handleChartSelection}
            dateRange={dateRange}
            handleDateRangeChange={handleDateRangeChange}
            dataFilters={dataFilters} // Pass the full dataFilters state
            handleAdditionalFilterChange={handleAdditionalFilterChange} // Pass the handler
            fetchFilteredData={fetchFilteredData}
            downloadPage={downloadPage}
          />
        </section>

        {/* Charts Section */}
        <section className="charts">
          {!initialLoadComplete ? (
            <div className="no-data-message">
              <div className="no-data-icon">📊</div>
              <h3>No Data Displayed Yet</h3>
              <p>Use the filter panel to select a date range and apply filters to load data.</p>
            </div>
          ) : tableData.length === 0 ? (
            <div className="no-data-message">
              <div className="no-data-icon">🔍</div>
              <h3>No Data Found</h3>
              <p>No data matched your filter criteria. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              {/* New Engineering Insights Section */}
              <section className="charts-row">
                <InsightGenerator 
                  data={tableData}
                  thresholds={{
                    flowVariation: 10, // More strict for industrial applications
                    pressureThreshold: 75,
                    efficiencyMinimum: 70,
                    suddenChanges: 15
                  }}
                />
              </section>
                {/* First row with Pressure and Flow charts */}
              <div className="charts-row two-column-charts">
                <div className="chart-box">
                  <div className="chart-header">
                    <h3>Pressure Over Time</h3>
                    <div className="chart-controls">
                      <ChartDateFilter 
                        data={tableData}
                        dateField="Time_Stamp"
                        onDateFilterChange={(dateFilter) => handleChartDateFilterChange('pressure', dateFilter)}
                        title="Date"
                      />
                      <TimeAggregation
                        aggregationLevel={chartAggregationLevels.pressure}
                        onAggregationChange={(level) => handleChartAggregationChange('pressure', level)}
                      />
                    </div>
                  </div>                  <ReportChart 
                    data={tableData}
                    type="line"
                    xField="Time_Stamp"
                    yField="rTotalQPercentage" 
                    title="Pressure"
                    style={{ width: '100%', height: '100%', maxWidth: '100%' }}
                    dateRange={chartDateFilters.pressure || (dateRange.start && dateRange.end ? [dateRange.start, dateRange.end] : null)}
                    aggregation={chartAggregationLevels.pressure || 'none'}
                    key={`pressure-chart-${chartRenderKey}-${lastUpdate?.getTime() || Date.now()}`} 
                    options={{
                      plugins: {
                        legend: {
                          display: true,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                        }
                      }
                    }}
                  />
                </div>
                <div className="chart-box">
                  <div className="chart-header">
                    <h3>Flow Over Time</h3>
                    <div className="chart-controls">
                      <ChartDateFilter 
                        data={tableData}
                        dateField="Time_Stamp"
                        onDateFilterChange={(dateFilter) => handleChartDateFilterChange('flow', dateFilter)}
                        title="Date"
                      />
                      <TimeAggregation
                        aggregationLevel={chartAggregationLevels.flow}
                        onAggregationChange={(level) => handleChartAggregationChange('flow', level)}
                      />
                    </div>
                  </div>                  <ReportChart 
                    data={tableData}
                    type="line"
                    xField="Time_Stamp"
                    yField="rTotalQ"
                    title="Flow"
                    style={{ width: '100%', height: '100%', maxWidth: '100%' }}
                    dateRange={chartDateFilters.flow || (dateRange.start && dateRange.end ? [dateRange.start, dateRange.end] : null)}
                    aggregation={chartAggregationLevels.flow || 'none'}
                    key={`flow-chart-${chartRenderKey}-${lastUpdate?.getTime() || Date.now()}`}
                    options={{
                      plugins: {
                        legend: {
                          display: true,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Second row with Noise chart */}
              <div className="charts-row single-chart-row">
                <div className="chart-box">
                  <div className="chart-header">
                    <h3>Noise Over Time</h3>
                    <div className="chart-controls">
                      <ChartDateFilter 
                        data={tableData}
                        dateField="Time_Stamp"
                        onDateFilterChange={(dateFilter) => handleChartDateFilterChange('noise', dateFilter)}
                        title="Date"
                      />
                      <TimeAggregation
                        aggregationLevel={chartAggregationLevels.noise}
                        onAggregationChange={(level) => handleChartAggregationChange('noise', level)}
                      />
                    </div>
                  </div>                  <ReportChart 
                    data={tableData}
                    type="line"
                    xField="Time_Stamp"
                    yField="rNoise"
                    title="Noise"
                    style={{ width: '100%', height: '100%', maxWidth: '100%' }}
                    dateRange={chartDateFilters.noise || (dateRange.start && dateRange.end ? [dateRange.start, dateRange.end] : null)}
                    aggregation={chartAggregationLevels.noise || 'none'}
                    key={`noise-chart-${chartRenderKey}-${lastUpdate?.getTime() || Date.now()}-${JSON.stringify(tableData?.slice(0,3).map(d => d.rNoise)).substring(0, 20)}`}
                    options={{
                      plugins: {
                        legend: {
                          display: true,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="carousel-section">
                <div className="carousel-content" style={{ width: '100%' }}>
                  <ChartCarousel
                    lineChartData={lineChartData}
                    chartData={chartData}
                    doughnutChartData={doughnutChartData}
                    scatterChartData={scatterChartData}
                    aggregation={dataFilters.aggregation || 'none'} 
                    selectedCharts={selectedCharts}
                  />
                </div>
              </div>
            </>
          )}
        </section>

        {/* Data Table Section - Updated to use enhanced DataTable component */}
      <section className="data-table">
        {tableData.length > 0 ? (
          <DataTable
            tableData={tableData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        ) : (
          <div className="no-data-table">
            <p>No data to display. {!initialLoadComplete ? 'Apply filters to load data.' : 'Try adjusting your filter criteria.'}</p>
          </div>
        )}
      </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-left">
              <div className="footer-logo">AVEVA</div>
              <div className="footer-links">
                <a href="#">About</a>
                <a href="#">Contact</a>
                <a href="#">Support</a>
                <a href="#">Privacy Policy</a>
              </div>
            </div>
            <div className="footer-right">
              <div>© {new Date().getFullYear()} AVEVA. All rights reserved.</div>
              <div className="footer-social">
                <span className="material-icons">facebook</span>
                <span className="material-icons">twitter</span>
                <span className="material-icons">linkedin</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;