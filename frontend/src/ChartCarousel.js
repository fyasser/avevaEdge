import React, { useState, useRef, useEffect } from 'react';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  registerChart, 
  unregisterChart, 
  destroyComponentCharts,
  patchChartInstance,
  installGlobalErrorPrevention
} from './utils/chartInstanceManager';
import ChartDateFilter from './ChartDateFilter';
import ChartTimeFilter from './ChartTimeFilter';
import './ChartCarousel.css'; // We'll create this file for custom styling

// Install global error prevention
installGlobalErrorPrevention();

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

// Define a consistent color palette for all charts
const chartColorScheme = {
  primary: 'rgb(9, 56, 92)',       // AVEVA blue
  primaryLight: 'rgba(0, 79, 139, 0.7)', // AVEVA blue lighter
  secondary:'rgb(7, 92, 158)',     // Secondary blue
  secondaryLight: 'rgb(241, 0, 0)',
  accent1: 'rgb(6, 56, 122)',      // Teal
  accent1Light: 'rgba(133, 207, 207, 0.12)',
  accent2: 'rgb(109, 40, 40)',      // Red
  accent2Light: 'rgba(242, 147, 165, 0.88)',
  accent3: 'rgba(255, 159, 64, 1)',      // Orange
  accent3Light: 'rgba(255, 159, 64, 0.4)',
  accent4: 'rgba(153, 102, 255, 1)',     // Purple
  accent4Light: 'rgba(153, 102, 255, 0.4)',
  gridLines: 'rgba(0, 0, 0, 0.07)',
  textColor: 'rgba(45, 55, 72, 1)',
  tooltipBackground: 'rgba(10, 10, 10, 0.9)'
};

const ChartCarousel = ({ lineChartData, chartData, doughnutChartData, scatterChartData, aggregation = 'none', selectedCharts = null }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselKey, setCarouselKey] = useState(Date.now());
  const chartRefs = useRef({
    line: null,
    bar: null,
    doughnut: null,
    scatter: null
  });
  const chartIds = useRef({
    line: null,
    bar: null,
    doughnut: null,
    scatter: null
  });
  const componentId = 'ChartCarousel';
  
  // State for filter management
  const [chartDateFilter, setChartDateFilter] = useState(null);
  const [chartTimeFilter, setChartTimeFilter] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    date: false,
    time: false
  });
  const [showFilters, setShowFilters] = useState(true);
  const [filteredChartData, setFilteredChartData] = useState({
    line: lineChartData,
    bar: chartData,
    doughnut: doughnutChartData,
    scatter: scatterChartData
  });
  
  // Debug logging for incoming data structure
  useEffect(() => {
    console.log("ChartCarousel received new data:");
    if (lineChartData && lineChartData.datasets && lineChartData.datasets.length > 0) {
      console.log("Line chart sample:", lineChartData.datasets[0].data.slice(0, 2));
    }
    if (scatterChartData && scatterChartData.datasets && scatterChartData.datasets.length > 0) {
      console.log("Scatter chart sample:", scatterChartData.datasets[0].data.slice(0, 2));
    }
  }, [lineChartData, chartData, doughnutChartData, scatterChartData]);
  
  // Clean up chart instances before unmounting
  useEffect(() => {
    return () => {
      console.log('ChartCarousel: Component will unmount, cleaning up charts');
      destroyComponentCharts(componentId);
      Object.keys(chartRefs.current).forEach(key => {
        chartRefs.current[key] = null;
      });
      Object.keys(chartIds.current).forEach(key => {
        chartIds.current[key] = null;
      });
    };
  }, []);
  
  // Function to clean up chart instances
  const cleanupCharts = () => {
    console.log('ChartCarousel: Cleaning up all charts');
    Object.entries(chartIds.current).forEach(([chartType, chartId]) => {
      if (chartId) {
        try {
          unregisterChart(chartId);
          console.log(`ChartCarousel: Successfully unregistered ${chartType} chart with ID ${chartId}`);
        } catch (err) {
          console.warn(`ChartCarousel: Error unregistering ${chartType} chart:`, err.message);
        }
        chartIds.current[chartType] = null;
        chartRefs.current[chartType] = null;
      }
    });
    
    setCarouselKey(Date.now());
  };
  
  // Force chart refresh when the data changes
  useEffect(() => {
    console.log('ChartCarousel: Data changed, refreshing charts');
    setFilteredChartData({
      line: lineChartData,
      bar: chartData,
      doughnut: doughnutChartData,
      scatter: scatterChartData
    });
    cleanupCharts();
  }, [lineChartData, chartData, doughnutChartData, scatterChartData]);

  // Cleanup previous chart when changing to a new chart
  useEffect(() => {
    const chartTypes = ['line', 'bar', 'doughnut', 'scatter'];
    
    chartTypes.forEach((type, index) => {
      if (index !== currentIndex && chartIds.current[type]) {
        console.log(`ChartCarousel: Cleaning up hidden ${type} chart`);
        unregisterChart(chartIds.current[type]);
        chartIds.current[type] = null;
      }
    });
  }, [currentIndex]);

  // Get timestamp from a data point based on chart type
  const getTimestamp = (dataPoint, chartType) => {
    if (!dataPoint) return null;
    
    // Check known timestamp fields - App.js formats these differently per chart type
    if (chartType === 'line' || chartType === 'bar') {
      // Get index from labels array instead of from the data point
      return null; // We'll handle these differently
    } else if (chartType === 'scatter') {
      // Scatter plot has timestamp property in the data
      if (dataPoint.timestamp) return dataPoint.timestamp;
    } 
    
    // Fallbacks for any chart type
    if (dataPoint.Time_Stamp) return dataPoint.Time_Stamp;
    if (dataPoint.timestamp) return dataPoint.timestamp;
    if (typeof dataPoint.x === 'string') return dataPoint.x;
    if (dataPoint.t) return dataPoint.t;
    
    return null;
  };

  // Apply filters to all chart data
  useEffect(() => {
    // Update active filter states
    setActiveFilters({
      date: !!chartDateFilter,
      time: !!chartTimeFilter && chartTimeFilter.type !== 'none'
    });

    // Skip if no filters applied
    if (!chartDateFilter && (!chartTimeFilter || chartTimeFilter.type === 'none')) {
      console.log('ChartCarousel: No filters active, using original data');
      setFilteredChartData({
        line: lineChartData,
        bar: chartData,
        doughnut: doughnutChartData,
        scatter: scatterChartData
      });
      return;
    }
    
    console.log('ChartCarousel: Applying filters', { chartDateFilter, chartTimeFilter });
    
    try {
      // Define the data types and their source data
      const chartTypes = {
        line: lineChartData,
        bar: chartData,
        doughnut: doughnutChartData,
        scatter: scatterChartData
      };

      // Create new filtered chart data objects
      const newFilteredData = {};
      
      // Process each chart type
      Object.entries(chartTypes).forEach(([type, data]) => {
        if (!data || !data.datasets) {
          newFilteredData[type] = data;
          return;
        }

        // Deep copy the chart data
        const chartDataCopy = JSON.parse(JSON.stringify(data));
        
        // Handle time-based filtering differently based on chart type
        if (type === 'line' || type === 'bar') {
          // These charts use labels array for timestamps and datasets for values
          if (chartDataCopy.labels && Array.isArray(chartDataCopy.labels)) {
            // Create a mask of which indices to keep
            const keepIndices = [];
            
            // Filter labels based on date/time
            chartDataCopy.labels.forEach((label, index) => {
              let keep = true;
              
              // Try to parse the label as a date
              const labelDate = new Date(label);
              if (!isNaN(labelDate.getTime())) {
                // Apply date filter if present
                if (chartDateFilter) {
                  const startDate = new Date(chartDateFilter.start);
                  const endDate = new Date(chartDateFilter.end);
                  
                  if (labelDate < startDate || labelDate > endDate) {
                    keep = false;
                  }
                }
                
                // Apply time filter if present
                if (keep && chartTimeFilter && chartTimeFilter.type !== 'none') {
                  if (chartTimeFilter.type === 'hour' && chartTimeFilter.hour !== undefined) {
                    if (labelDate.getHours() !== chartTimeFilter.hour) {
                      keep = false;
                    }
                  } else if (chartTimeFilter.type === 'minute' && 
                      chartTimeFilter.hour !== undefined && 
                      chartTimeFilter.minute !== undefined) {
                    if (labelDate.getHours() !== chartTimeFilter.hour || 
                        labelDate.getMinutes() !== chartTimeFilter.minute) {
                      keep = false;
                    }
                  } else if (chartTimeFilter.type === 'second' && 
                      chartTimeFilter.hour !== undefined && 
                      chartTimeFilter.minute !== undefined &&
                      chartTimeFilter.second !== undefined) {
                    if (labelDate.getHours() !== chartTimeFilter.hour || 
                        labelDate.getMinutes() !== chartTimeFilter.minute || 
                        labelDate.getSeconds() !== chartTimeFilter.second) {
                      keep = false;
                    }
                  }
                }
              }
              
              if (keep) {
                keepIndices.push(index);
              }
            });
            
            // Filter labels
            chartDataCopy.labels = keepIndices.map(i => chartDataCopy.labels[i]);
            
            // Filter all datasets
            chartDataCopy.datasets = chartDataCopy.datasets.map(dataset => {
              return {
                ...dataset,
                data: keepIndices.map(i => dataset.data[i])
              };
            });
            
            console.log(`ChartCarousel: ${type} chart filtered - kept ${keepIndices.length} of ${data.labels.length} points`);
          }
        } else if (type === 'scatter') {
          // Scatter charts have timestamps inside each data point
          chartDataCopy.datasets = chartDataCopy.datasets.map(dataset => {
            if (Array.isArray(dataset.data)) {
              const originalLength = dataset.data.length;
              
              const filteredData = dataset.data.filter(point => {
                // Try to get timestamp from the data point
                const timestamp = getTimestamp(point, 'scatter');
                if (!timestamp) return true; // Keep points without timestamp
                
                const pointDate = new Date(timestamp);
                if (isNaN(pointDate.getTime())) return true; // Keep points with invalid dates
                
                // Apply date filter if present
                if (chartDateFilter) {
                  const startDate = new Date(chartDateFilter.start);
                  const endDate = new Date(chartDateFilter.end);
                  
                  if (pointDate < startDate || pointDate > endDate) {
                    return false;
                  }
                }
                
                // Apply time filter if present
                if (chartTimeFilter && chartTimeFilter.type !== 'none') {
                  if (chartTimeFilter.type === 'hour' && chartTimeFilter.hour !== undefined) {
                    if (pointDate.getHours() !== chartTimeFilter.hour) {
                      return false;
                    }
                  } else if (chartTimeFilter.type === 'minute' && 
                      chartTimeFilter.hour !== undefined && 
                      chartTimeFilter.minute !== undefined) {
                    if (pointDate.getHours() !== chartTimeFilter.hour || 
                        pointDate.getMinutes() !== chartTimeFilter.minute) {
                      return false;
                    }
                  } else if (chartTimeFilter.type === 'second' && 
                      chartTimeFilter.hour !== undefined && 
                      chartTimeFilter.minute !== undefined &&
                      chartTimeFilter.second !== undefined) {
                    if (pointDate.getHours() !== chartTimeFilter.hour || 
                        pointDate.getMinutes() !== chartTimeFilter.minute || 
                        pointDate.getSeconds() !== chartTimeFilter.second) {
                      return false;
                    }
                  }
                }
                
                return true;
              });
              
              console.log(`ChartCarousel: ${type} chart filtered - kept ${filteredData.length} of ${originalLength} points`);
              
              return {
                ...dataset,
                data: filteredData
              };
            }
            return dataset;
          });
        }
        
        // Doughnut charts don't typically have time filtering - leave as is
        if (type === 'doughnut') {
          newFilteredData[type] = data;
        } else {
          newFilteredData[type] = chartDataCopy;
        }
      });
      
      setFilteredChartData(newFilteredData);
      cleanupCharts(); // Force chart regeneration
      
    } catch (error) {
      console.error('ChartCarousel: Error filtering data', error);
      // Fallback to original data on error
      setFilteredChartData({
        line: lineChartData,
        bar: chartData,
        doughnut: doughnutChartData,
        scatter: scatterChartData
      });
    }
  }, [chartDateFilter, chartTimeFilter, lineChartData, chartData, doughnutChartData, scatterChartData]);

  // Function to reset filters
  const handleResetFilters = () => {
    setChartDateFilter(null);
    setChartTimeFilter(null);
    // Force chart regeneration
    cleanupCharts();
  };

  // Handle date filter changes
  const handleDateFilterChange = (dateFilter) => {
    console.log('ChartCarousel: Date filter changed:', dateFilter);
    setChartDateFilter(dateFilter);
  };

  // Handle time filter changes
  const handleTimeFilterChange = (timeFilter) => {
    console.log('ChartCarousel: Time filter changed:', timeFilter);
    setChartTimeFilter(timeFilter);
  };

  // Extract and normalize data for filter dropdowns
  const getDataForFilters = () => {
    const result = [];
    
    // Extract timestamps from line/bar chart labels
    if (lineChartData && lineChartData.labels) {
      lineChartData.labels.forEach(label => {
        const date = new Date(label);
        if (!isNaN(date.getTime())) {
          result.push({
            Time_Stamp: date.toISOString()
          });
        }
      });
    }
    
    // Extract timestamps from scatter data points
    if (scatterChartData && scatterChartData.datasets) {
      scatterChartData.datasets.forEach(dataset => {
        if (dataset.data) {
          dataset.data.forEach(point => {
            if (point.timestamp) {
              result.push({
                Time_Stamp: point.timestamp
              });
            }
          });
        }
      });
    }
    
    return result;
  };

  // Common chart options with cursor features
  const getCommonOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100, // Add delay to prevent too many resize events
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 0 // Disable initial animation to prevent resize issues
    },
    onResize: (chart, size) => {
      // Add additional safety check on resize
      if (!chart.canvas || !document.body.contains(chart.canvas)) {
        console.warn('ChartCarousel: Resize prevented on detached canvas');
        return;
      }
    },
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: 6, // Reduced padding to move chart up
      },
      tooltip: {
        backgroundColor: chartColorScheme.tooltipBackground,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: chartColorScheme.primary,
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const segmentLabel = context.label || ''; // Label of the segment/data point
            let valueLabel;

            if (context.chart.config.type === 'doughnut') {
              // Display the parsed numerical value for doughnut charts
              valueLabel = context.parsed;
              return `${segmentLabel}: ${valueLabel}`;
            } else if (context.chart.config.type === 'scatter') {
              valueLabel = `(${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
              const datasetLabel = context.dataset.label || '';
              return `${datasetLabel}${segmentLabel ? (': ' + segmentLabel) : ''}: ${valueLabel}`;
            } else {
              valueLabel = context.parsed.y !== undefined ? context.parsed.y.toFixed(2) : 'N/A';
              const datasetLabel = context.dataset.label || '';
              return `${datasetLabel}${segmentLabel ? (': ' + segmentLabel) : ''}: ${valueLabel}`;
            }
          }
        }
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          padding: 15, // Reduced padding to move chart up
          boxWidth: 12,
          usePointStyle: true
        },
        margin: 8 // Reduced margin to move chart up
      },
      // Add a vertical line that follows cursor (for line and bar charts)
      hover: {
        mode: 'index',
        intersect: false
      },
      crosshair: {
        line: {
          color: 'rgba(0, 0, 0, 0.3)',
          width: 1,
          dashPattern: [5, 5]
        }
      }
    },
    // Scale options for line, bar, and scatter charts
    scales: title !== 'Distribution' ? {
      x: {
        grid: {
          display: true,
          color: chartColorScheme.gridLines
        },
        ticks: {
          maxTicksLimit: 8, // Reduced number of ticks
          maxRotation: 0, // No rotation to save vertical space
          padding: 5,
          font: {
            size: 10 // Smaller font size
          }
        },
        border: {
          width: 1
        }
      },
      y: {
        grid: {
          display: true,
          color: chartColorScheme.gridLines
        },
        beginAtZero: false,
        ticks: {
          padding: 5,
          font: {
            size: 10 // Smaller font size
          },
          callback: function(value) {
            // Shorten large numbers
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value;
          }
        },
        border: {
          width: 1
        }
      }
    } : undefined, // No scales for doughnut charts
    // Add more padding to entire chart
    layout: {
      padding: {
        left: 5,
        right: 10,
        top: 0, // Reduced top padding
        bottom: 35 // Increased bottom padding to push content upward
      }
    }
  });

  // Register a new chart instance with our manager
  const registerChartInstance = (chartInstance, chartType) => {
    if (!chartInstance) {
      console.log(`ChartCarousel: No chart instance for ${chartType}`);
      return;
    }
    
    console.log(`ChartCarousel: Registering ${chartType} chart instance`);
    
    // First unregister any existing chart of this type
    if (chartIds.current[chartType]) {
      unregisterChart(chartIds.current[chartType]);
    }
    
    // Register new chart and store ID
    const chartId = registerChart(chartInstance, componentId);
    chartIds.current[chartType] = chartId;
    
    // Apply safety patches to chart instance
    patchChartInstance(chartInstance);
    
    console.log(`ChartCarousel: Registered ${chartType} chart with ID ${chartId}`);
  };

  // Setup chart reference handlers with registration
  const setLineChartRef = (ref) => { 
    chartRefs.current.line = ref;
    if (ref?.chart) {
      registerChartInstance(ref.chart, 'line');
    }
  };
  
  const setBarChartRef = (ref) => { 
    chartRefs.current.bar = ref;
    if (ref?.chart) {
      registerChartInstance(ref.chart, 'bar');
    }
  };
  
  const setDoughnutChartRef = (ref) => { 
    chartRefs.current.doughnut = ref;
    if (ref?.chart) {
      registerChartInstance(ref.chart, 'doughnut');
    }
  };
  
  const setScatterChartRef = (ref) => { 
    chartRefs.current.scatter = ref;
    if (ref?.chart) {
      registerChartInstance(ref.chart, 'scatter');
    }
  };

  const chartStyle = {
    width: '100%',
    height: '450px',  // Reduced height to ensure chart fits
    margin: '0 auto',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'visible'  // Keep visible overflow to prevent cutting off
  };

  const fallbackChart = {
    labels: ['No Data Available'],
    datasets: [{
      label: 'No Data',
      data: [0],
      backgroundColor: 'rgba(200, 200, 200, 0.5)',
      borderColor: 'rgba(200, 200, 200, 1)',
    }]
  };

  // Enhanced line chart data with improved styling and area fill
  const enhancedLineChartData = filteredChartData.line ? {
    ...filteredChartData.line,
    datasets: filteredChartData.line.datasets.map((dataset, index) => {
      // Assign colors based on dataset index
      const colorSet = index === 0 
        ? { main: chartColorScheme.accent1, light: chartColorScheme.accent1Light }
        : { main: chartColorScheme.accent2, light: chartColorScheme.accent2Light };
      
      return {
        ...dataset,
        borderColor: colorSet.main,
        backgroundColor: colorSet.light,
        borderWidth: 2,
        tension: 0.3, // Add curve to the line
        fill: true, // Add area fill
        pointRadius: 4,
        pointHoverRadius: 7, // Enlarged point on hover
        pointBackgroundColor: colorSet.main,
        pointHoverBackgroundColor: '#fff',
        pointBorderColor: colorSet.main,
        pointHoverBorderColor: colorSet.main,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
      };
    })
  } : fallbackChart;

  // Enhanced bar chart data with improved styling
  const enhancedBarChartData = filteredChartData.bar ? {
    ...filteredChartData.bar,
    datasets: filteredChartData.bar.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: chartColorScheme.secondary,
      borderColor: chartColorScheme.primary,
      borderWidth: 1,
      borderRadius: 3, // Rounded corners on bars
      hoverBackgroundColor: chartColorScheme.secondaryLight,
      hoverBorderColor: chartColorScheme.primary,
      hoverBorderWidth: 2,
      // Add a subtle shadow effect
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      shadowBlur: 2,
      shadowColor: 'rgba(0, 0, 0, 0.2)'
    }))
  } : fallbackChart;

  // Enhanced doughnut chart data for better hover effects and consistent colors
  const enhancedDoughnutChartData = filteredChartData.doughnut ? {
    ...filteredChartData.doughnut,
    datasets: filteredChartData.doughnut.datasets.map(dataset => {
      return {
        ...dataset,
        backgroundColor: [
          chartColorScheme.primary,         // AVEVA blue for System Fluid State
          chartColorScheme.accent1,         // Teal for Flow
          chartColorScheme.accent2,         // Red for Pressure
        ],
        hoverBackgroundColor: [
          chartColorScheme.primaryLight,
          chartColorScheme.accent1Light,
          chartColorScheme.accent2Light,
        ],
        borderColor: '#ffffff',
        hoverOffset: 15,                    // Makes the segment pop out on hover
        borderWidth: 2,
        hoverBorderColor: '#ffffff',
        borderRadius: 4,                    // Rounded corners on segments
      };
    })
  } : fallbackChart;

  // Enhanced scatter chart data with consistent styling
  const enhancedScatterChartData = filteredChartData.scatter ? {
    ...filteredChartData.scatter,
    datasets: filteredChartData.scatter.datasets.map(dataset => ({
      ...dataset,
      // Color points based on efficiency (using our consistent color scheme)
      backgroundColor: Array.isArray(dataset.data) ? 
        dataset.data.map(point => {
          const efficiency = point.efficiency || 0;
          if (efficiency > 75) {
            return chartColorScheme.primary; // High efficiency - AVEVA blue
          } else if (efficiency > 50) {
            return chartColorScheme.accent1; // Medium efficiency - teal
          } else if (efficiency > 25) {
            return chartColorScheme.accent3; // Low efficiency - orange
          } else {
            return chartColorScheme.accent2; // Very low efficiency - red
          }
        }) : 
        chartColorScheme.accent1,
      pointRadius: Array.isArray(dataset.data) ? 
        dataset.data.map(point => Math.max(4, Math.min(10, (point.efficiency || 0) / 10))) : 
        5,
      pointHoverRadius: Array.isArray(dataset.data) ? 
        dataset.data.map(point => Math.max(6, Math.min(12, (point.efficiency || 0) / 8))) : 
        8,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      pointHoverBorderWidth: 2,
      pointHoverBackgroundColor: '#ffffff'
    }))
  } : fallbackChart;

  // Define chart components with proper ref assignment - IMPROVED RENDERING APPROACH
  const allCharts = [
    {
      title: 'Line Chart',
      render: () => (
        <div style={chartStyle} key={`line-container-${carouselKey}`}>
          <Line 
            key={`line-${carouselKey}`}
            ref={setLineChartRef}
            data={enhancedLineChartData} 
            options={getCommonOptions('Line Chart')} 
          />
        </div>
      ),
      type: 'line'
    },
    {
      title: 'Bar Chart',
      render: () => (
        <div style={chartStyle} key={`bar-container-${carouselKey}`}>
          <Bar 
            key={`bar-${carouselKey}`}
            ref={setBarChartRef}
            data={enhancedBarChartData} 
            options={getCommonOptions('Bar Chart')} 
          />
        </div>
      ),
      type: 'radar'  // Note: In FilterOptions it's called 'radar' but we render a Bar chart
    },
    {
      title: 'Distribution',
      render: () => (
        <div style={chartStyle} key={`doughnut-container-${carouselKey}`}>
          <Doughnut 
            key={`doughnut-${carouselKey}`}
            ref={setDoughnutChartRef}
            data={enhancedDoughnutChartData} 
            options={getCommonOptions('Distribution')} 
          />
        </div>
      ),
      type: 'doughnut'
    },
    {
      title: 'Scatter Plot',
      render: () => (
        <div style={chartStyle} key={`scatter-container-${carouselKey}`}>
          <Scatter 
            key={`scatter-${carouselKey}`}
            ref={setScatterChartRef}
            data={enhancedScatterChartData} 
            options={getCommonOptions('Scatter Plot')} 
          />
        </div>
      ),
      type: 'scatter'
    }
  ];
  
  // Filter charts based on selectedCharts prop
  const charts = selectedCharts 
    ? allCharts.filter(chart => selectedCharts[chart.type]) 
    : allCharts;

  const handlePrevious = () => {
    // Clean up current chart instance before switching
    const currentChartType = ['line', 'bar', 'doughnut', 'scatter'][currentIndex];
    const chartId = chartIds.current[currentChartType];
    
    if (chartId) {
      console.log(`ChartCarousel: Unregistering current ${currentChartType} chart before switching`);
      unregisterChart(chartId);
      chartIds.current[currentChartType] = null;
    }
    
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? charts.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    // Clean up current chart instance before switching
    const currentChartType = ['line', 'bar', 'doughnut', 'scatter'][currentIndex];
    const chartId = chartIds.current[currentChartType];
    
    if (chartId) {
      console.log(`ChartCarousel: Unregistering current ${currentChartType} chart before switching`);
      unregisterChart(chartId);
      chartIds.current[currentChartType] = null;
    }
    
    setCurrentIndex((prevIndex) => 
      prevIndex === charts.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Get the collected data points for the filters
  const filterData = getDataForFilters();

  return (
    <div className="chart-carousel bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-aveva-primary mb-4 text-center">{charts[currentIndex].title}</h2>
      
      {/* Filter controls header */}
      <div className="filter-controls-header flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-700">
          Chart Filters
          {(activeFilters.date || activeFilters.time) && (
            <span className="ml-2 text-sm text-green-600 font-normal">
              ({Object.values(activeFilters).filter(Boolean).length} active)
            </span>
          )}
        </h3>
        <div className="filter-buttons">
          <button 
            className="text-sm text-gray-600 hover:text-aveva-primary mr-3"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {(activeFilters.date || activeFilters.time) && (
            <button 
              className="text-sm text-red-600 hover:text-red-800"
              onClick={handleResetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Add enhanced filters section */}
      {showFilters && (
        <div className="chart-filters-container mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex flex-wrap gap-6">
            <div className={`filter-item ${activeFilters.date ? 'filter-active' : ''}`}>
              <ChartDateFilter 
                key={`date-filter-${!!chartDateFilter}`}
                data={filterData}
                dateField="Time_Stamp"
                onDateFilterChange={handleDateFilterChange}
                title="Date Filter"
              />
              {activeFilters.date && chartDateFilter && (
                <div className="filter-indicator">
                  <span className="text-xs text-green-600">
                    {new Date(chartDateFilter.start).toLocaleDateString()} - 
                    {new Date(chartDateFilter.end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className={`filter-item ${activeFilters.time ? 'filter-active' : ''}`}>
              <ChartTimeFilter
                key={`time-filter-${!!chartTimeFilter}`}
                data={filterData}
                dateField="Time_Stamp"
                onTimeFilterChange={handleTimeFilterChange}
                title="Time Filter"
              />
              {activeFilters.time && chartTimeFilter && (
                <div className="filter-indicator">
                  <span className="text-xs text-green-600">
                    {chartTimeFilter.type === 'hour' ? `Hour: ${chartTimeFilter.hour}` :
                     chartTimeFilter.type === 'minute' ? `${chartTimeFilter.hour}:${chartTimeFilter.minute}` :
                     chartTimeFilter.type === 'second' ? `${chartTimeFilter.hour}:${chartTimeFilter.minute}:${chartTimeFilter.second}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Data aggregation info */}
            {aggregation && aggregation !== 'none' && (
              <div className="filter-item">
                <div className="filter-title">Data Aggregation:</div>
                <div className="text-sm font-medium text-aveva-primary">
                  {aggregation === 'minutes' ? 'By Minute' : 
                   aggregation === 'hours' ? 'Hourly' : 
                   aggregation === 'days' ? 'Daily' : 'None'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Chart data status indicator */}
      {(activeFilters.date || activeFilters.time) && (
        <div className="data-status-indicator mb-2 text-sm flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          <span className="text-gray-700">
            Showing filtered data
            {filteredChartData[charts[currentIndex].type]?.datasets[0]?.data?.length && (
              <span> ({filteredChartData[charts[currentIndex].type]?.datasets[0]?.data?.length} data points)</span>
            )}
          </span>
        </div>
      )}
      
      <div className="chart-container w-full h-[480px] mb-4 relative">
        {/* Chart render */}
        {charts[currentIndex].render()}
        
        {/* No data overlay */}
        {(filteredChartData[charts[currentIndex].type]?.datasets[0]?.data?.length === 0 ||
         (filteredChartData[charts[currentIndex].type]?.labels?.length === 0 && 
          charts[currentIndex].type !== 'scatter')) && (
          <div className="no-data-overlay absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
            <div className="text-center">
              <div className="text-5xl text-gray-300 mb-2">📊</div>
              <h3 className="text-xl font-medium text-gray-600">No Data Available</h3>
              <p className="text-sm text-gray-500 mt-2">Try adjusting or clearing your filters</p>
              <button 
                className="mt-4 px-4 py-2 bg-aveva-primary text-white rounded-md hover:bg-aveva-secondary transition-colors duration-200"
                onClick={handleResetFilters}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Chart navigation */}
      <div className="chart-navigation flex justify-between items-center">
        <button 
          onClick={handlePrevious}
          className="chart-nav-btn flex items-center px-4 py-2 bg-aveva-primary text-white rounded-md hover:bg-aveva-secondary transition-colors duration-200"
        >
          <span className="mr-2">←</span>
          Previous Chart
        </button>
        
        <div className="chart-indicators flex gap-1">
          {charts.map((chart, index) => (
            <button 
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-aveva-primary scale-125' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to ${chart.title}`}
            />
          ))}
        </div>
        
        <button 
          onClick={handleNext}
          className="chart-nav-btn flex items-center px-4 py-2 bg-aveva-primary text-white rounded-md hover:bg-aveva-secondary transition-colors duration-200"
        >
          Next Chart
          <span className="ml-2">→</span>
        </button>
      </div>
    </div>
  );
};

export default ChartCarousel;