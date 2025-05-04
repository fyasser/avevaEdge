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

const ChartCarousel = ({ lineChartData, chartData, doughnutChartData, scatterChartData }) => {
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
    // Skip if no filters applied
    if (!chartDateFilter && !chartTimeFilter) {
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
        padding: 10,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            let value = context.parsed;
            
            // Handle different chart types
            if (context.chart.config.type === 'doughnut') {
              value = context.parsed;
              return `${label}: ${value}`;
            } else if (context.chart.config.type === 'scatter') {
              return `${label} (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
            } else {
              value = context.parsed.y;
              return `${label}: ${value.toFixed(2)}`;
            }
          }
        }
      },
      legend: {
        display: true,
        position: 'top',
      },
      // Add a vertical line that follows cursor (for line and bar charts)
      hover: {
        mode: 'index',
        intersect: false
      }
    },
    // Scale options for line, bar, and scatter charts
    scales: title !== 'Distribution' ? {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        beginAtZero: false
      }
    } : undefined // No scales for doughnut charts
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
    height: '600px',
    margin: '0 auto',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden'
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

  // Enhanced line chart data with area fill
  const enhancedLineChartData = filteredChartData.line ? {
    ...filteredChartData.line,
    datasets: filteredChartData.line.datasets.map(dataset => ({
      ...dataset,
      tension: 0.3, // Add curve to the line
      fill: true, // Add area fill
      pointRadius: 3,
      pointHoverRadius: 7, // Enlarged point on hover
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderWidth: 2,
    }))
  } : fallbackChart;

  // Enhanced bar chart data
  const enhancedBarChartData = filteredChartData.bar ? {
    ...filteredChartData.bar,
    datasets: filteredChartData.bar.datasets.map(dataset => ({
      ...dataset,
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)', // Highlight on hover
      hoverBorderColor: 'rgba(75, 192, 192, 1)',
    }))
  } : fallbackChart;

  // Enhanced doughnut chart data for better hover effects
  const enhancedDoughnutChartData = filteredChartData.doughnut ? {
    ...filteredChartData.doughnut,
    datasets: filteredChartData.doughnut.datasets.map(dataset => ({
      ...dataset,
      hoverOffset: 12, // Makes the segment pop out on hover
      borderWidth: 2,
      hoverBorderColor: '#fff',
    }))
  } : fallbackChart;

  // Enhanced scatter chart data
  const enhancedScatterChartData = filteredChartData.scatter ? {
    ...filteredChartData.scatter,
    datasets: filteredChartData.scatter.datasets.map(dataset => ({
      ...dataset,
      pointRadius: 5,
      pointHoverRadius: 8, // Enlarged point on hover
      pointHoverBackgroundColor: '#fff',
      pointBorderColor: 'rgba(75, 192, 192, 1)',
    }))
  } : fallbackChart;

  // Define chart components with proper ref assignment - IMPROVED RENDERING APPROACH
  const charts = [
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
      type: 'bar'
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-aveva-primary mb-4 text-center">{charts[currentIndex].title}</h2>
      
      {/* Add filters at the top of the carousel */}
      <div className="chart-filters-row mb-4 border-b border-gray-200 pb-3">
        <div className="chart-filters-container flex flex-wrap gap-4">
          <ChartDateFilter 
            data={filterData}
            dateField="Time_Stamp"
            onDateFilterChange={handleDateFilterChange}
            title="Date"
          />
          <ChartTimeFilter
            data={filterData}
            dateField="Time_Stamp"
            onTimeFilterChange={handleTimeFilterChange}
            title="Time"
          />
        </div>
      </div>
      
      <div className="w-full h-[630px] mb-4">
        {/* Only render the currently selected chart */}
        {charts[currentIndex].render()}
      </div>
      <div className="flex justify-center gap-4">
        <button 
          onClick={handlePrevious}
          className="px-4 py-2 bg-aveva-primary text-white rounded-md hover:bg-aveva-secondary transition-colors duration-200"
        >
          Previous
        </button>
        <button 
          onClick={handleNext}
          className="px-4 py-2 bg-aveva-primary text-white rounded-md hover:bg-aveva-secondary transition-colors duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ChartCarousel;