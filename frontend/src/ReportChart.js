import React, { useRef, useEffect, useState } from 'react';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { format } from 'date-fns';
import { 
  registerChart, 
  unregisterChart,
  patchChartInstance,
  installGlobalErrorPrevention
} from './utils/chartInstanceManager';
import COLORS from './utils/colorConstants'; // Import centralized color definitions
import ChartDateFilter from './ChartDateFilter';
import ChartTimeFilter from './ChartTimeFilter';

// Install global error prevention once when this module is imported
installGlobalErrorPrevention();

const chartContainerStyle = {
  width: '100%',
  height: '100%',
  position: 'relative'
};

const ReportChart = ({ 
  data, 
  type = 'bar', 
  xField = 'Time_Stamp', 
  yField = 'rTotalQ', 
  title = '',
  style = {},
  options = {},
  dateRange = null, // Prop for date range filter (applied via useEffect)
  aggregation = 'none' // Prop for aggregation filter (applied via useEffect)
}) => {
  const chartRef = useRef(null);
  const chartId = useRef(null);
  const componentId = `ReportChart-${xField}-${yField}`;
  const [filteredData, setFilteredData] = useState(data);
  const [chartFilteredData, setChartFilteredData] = useState(data); // Data after chart-specific filters
  const [chartDateFilter, setChartDateFilter] = useState(null); // Chart-specific date filter
  const [chartTimeFilter, setChartTimeFilter] = useState(null); // Chart-specific time filter

  // Handle chart cleanup on unmount or data/type change
  useEffect(() => {
    return () => {
      if (chartId.current) {
        console.log(`ReportChart: Cleaning up chart ${chartId.current}`);
        unregisterChart(chartId.current);
        chartId.current = null;
      }
    };
  }, [data, type]);

  // Handle chart instance registration after component mount
  const handleChartRef = (ref) => {
    // Save reference
    chartRef.current = ref;
    
    // If there's already a chart ID, clean it up first
    if (chartId.current) {
      unregisterChart(chartId.current);
    }
    
    // Register the new chart instance
    if (ref?.chart) {
      chartId.current = registerChart(ref.chart, componentId);
      
      // Apply safety patches
      patchChartInstance(ref.chart);
      console.log(`ReportChart: Registered chart with ID ${chartId.current}`);
    }
  };

  // Fix the useEffect for global filters to correctly handle data
  useEffect(() => {
    console.log(`ReportChart data filtering for ${yField}:`, { 
      originalDataLength: data?.length,
      dateRange,
      aggregation,
      xField,
      yField,
      chartId: componentId
    });
    
    // Check if data is actually available
    if (!data || data.length === 0) {
      console.log(`No initial data for chart ${yField}`);
      setFilteredData([]);
      return;
    }
    
    // Log a sample from original data
    console.log(`Sample data point:`, data[0]);
    
    // Apply date range filter
    let updatedData = [...data]; // Create a copy to avoid reference issues
    
    // Handle both array and object dateRange formats
    let startDate = null;
    let endDate = null;
    
    if (dateRange) {
      if (Array.isArray(dateRange) && dateRange.length === 2) {
        [startDate, endDate] = dateRange;
      } else if (dateRange.start && dateRange.end) {
        // Handle object format with start/end properties
        startDate = dateRange.start;
        endDate = dateRange.end;
      }
    }
    
    // Only apply date range filter if valid date range is provided
    if (startDate && endDate) { 
      console.log(`Filtering with dateRange: ${startDate} to ${endDate}`);
      console.log(`Before date filtering: ${updatedData.length} items`);
      
      // Adjust end date to include the entire day
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        endDate = end.toISOString();
      }
      
      updatedData = updatedData.filter(item => {
        if (!item || !item[xField]) return false;
        
        const itemDate = new Date(item[xField]);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const isInRange = itemDate >= start && itemDate <= end;
        
        // Log some samples for debugging
        if (Math.random() < 0.01) { // Only log ~1% of items to avoid console flood
          console.log(`Date check: ${itemDate.toISOString()} in range ${start.toISOString()} - ${end.toISOString()} = ${isInRange}`);
        }
        
        return isInRange;
      });
      console.log(`After date range filter: ${updatedData.length} items`);
      
      // If we filtered out all data, this is a problem
      if (updatedData.length === 0) {
        console.warn(`Date filter removed ALL data points. Check date formats and ranges.`);
        console.warn(`Start date: ${new Date(startDate).toISOString()}`);
        console.warn(`End date: ${new Date(endDate).toISOString()}`);
        console.warn(`Sample data point date: ${data[0] ? new Date(data[0][xField]).toISOString() : 'N/A'}`);
      }
    } else {
      console.log(`No valid date range provided for ${yField}, using all data`);
    }
  
    // Apply aggregation filter if specified
    if (aggregation && aggregation !== 'none') {
      const aggregatedData = {};
      updatedData.forEach(item => {
        if (!item || !item[xField] || !item[yField]) return; // Skip invalid data points
        
        const itemDate = new Date(item[xField]);
        let key;
        
        // Get the appropriate key based on aggregation level
        if (aggregation === 'minutes') {
          key = itemDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
        } else if (aggregation === 'hours') {
          key = itemDate.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        } else if (aggregation === 'days') {
          key = itemDate.toISOString().slice(0, 10); // YYYY-MM-DD
        }
  
        if (!aggregatedData[key]) {
          aggregatedData[key] = { 
            ...item, 
            count: 1,
            // Ensure we have a valid value for aggregating
            [yField]: typeof item[yField] === 'number' ? item[yField] : 0 
          };
        } else {
          // Safely accumulate values, handling potential null/undefined
          const yValue = typeof item[yField] === 'number' ? item[yField] : 0;
          aggregatedData[key][yField] += yValue;
          aggregatedData[key].count += 1;
        }
      });
  
      // Convert back to array and calculate averages
      updatedData = Object.values(aggregatedData).map(item => ({
        ...item,
        [yField]: item[yField] / item.count // Average the values
      }));
      
      console.log(`After aggregation (${aggregation}): ${updatedData.length} items`);
    }
  
    // Log resulting data before setting state
    if (updatedData.length > 0) {
      console.log(`First filtered item:`, updatedData[0]);
      console.log(`Last filtered item:`, updatedData[updatedData.length-1]);
    }
    
    setFilteredData(updatedData);
    // Also set chartFilteredData directly to bypass chart-specific filtering
    setChartFilteredData(updatedData);
  }, [data, dateRange, aggregation, xField, yField, componentId]);
  
  // Apply chart-specific filters
  useEffect(() => {
    let data = filteredData;
    
    // Apply chart-specific date filter if set
    if (chartDateFilter) {
      data = data.filter(item => {
        const itemDate = new Date(item[xField]);
        return itemDate >= new Date(chartDateFilter.start) && 
               itemDate <= new Date(chartDateFilter.end);
      });
    }
    
    // Apply chart-specific time filter if set
    if (chartTimeFilter) {
      data = data.filter(item => {
        const itemDate = new Date(item[xField]);
        
        if (chartTimeFilter.type === 'hour') {
          return itemDate.getHours() === chartTimeFilter.hour;
        } 
        else if (chartTimeFilter.type === 'minute') {
          return itemDate.getHours() === chartTimeFilter.hour && 
                 itemDate.getMinutes() === chartTimeFilter.minute;
        }
        else if (chartTimeFilter.type === 'second') {
          return itemDate.getHours() === chartTimeFilter.hour && 
                 itemDate.getMinutes() === chartTimeFilter.minute && 
                 itemDate.getSeconds() === chartTimeFilter.second;
        }
        
        return true;
      });
    }
    
    setChartFilteredData(data);
  }, [filteredData, chartDateFilter, chartTimeFilter, xField]);

  // Handle chart-specific date filter changes
  const handleDateFilterChange = (dateFilter) => {
    setChartDateFilter(dateFilter);
  };

  // Handle chart-specific time filter changes
  const handleTimeFilterChange = (timeFilter) => {
    setChartTimeFilter(timeFilter);
  };

  // Add debugging console logs to the prepareChartData function
  const prepareChartData = () => {
    console.log(`ReportChart prepareChartData for ${yField}:`, { 
      componentId,
      dataLength: chartFilteredData?.length,
      sampleDataPoint: chartFilteredData?.[0],
      dateRange,
      aggregation
    });
    
    // Handle empty data
    if (!chartFilteredData || chartFilteredData.length === 0) {
      console.log(`No data available for chart ${yField}`);
      return {
        labels: ['No Data'],
        datasets: [{ 
          label: 'No Data Available',
          data: [0],
          backgroundColor: 'rgba(200, 200, 200, 0.5)',
          borderColor: 'rgba(200, 200, 200, 1)'
        }]
      };
    }
    
    // Sort data by timestamp in ascending order to ensure correct chronological display
    const sortedData = [...chartFilteredData].sort((a, b) => new Date(a[xField]) - new Date(b[xField]));
    console.log(`Sorted data for ${yField}:`, { 
      length: sortedData.length, 
      firstItem: sortedData[0],
      lastItem: sortedData[sortedData.length-1],
      yField,
      yValues: sortedData.slice(0, 3).map(item => item[yField])
    });
    
    let chartData;
    
    // Get theme colors based on chart type
    const getThemeColors = () => {
      if (yField === "rTotalQ") { // Flow chart
        return {
          primary: 'rgba(0, 79, 139, 1)', // AVEVA Accent Blue
          background: 'rgba(150, 197, 214, 0.2)',
          hover: 'rgba(0, 163, 224, 0.8)'
        };
      } else if (yField === "rTotalQPercentage") { // Pressure chart
        return {
          primary: COLORS.PRESSURE_COLOR,
          background: COLORS.PRESSURE_BACKGROUND,
          hover: 'rgba(255, 99, 132, 0.8)'
        };      } else if (yField === "rNoise") { // Noise chart
        return {
          primary: COLORS.NOISE_COLOR,
          background: COLORS.NOISE_BACKGROUND, 
          hover: COLORS.NOISE_HOVER
        };
      } else {
        return {
          primary: 'rgba(75, 192, 192, 1)', // Default teal
          background: 'rgba(75, 192, 192, 0.2)',
          hover: 'rgba(75, 192, 192, 0.8)'
        };
      }
    };
    
    const colors = getThemeColors();
    
    if (type === 'line') {
      // Improve data point distribution by limiting points for dense datasets
      let displayData = sortedData;
      if (sortedData.length > 200) {
        // For very large datasets, sample points for better distribution
        const sampleRate = Math.ceil(sortedData.length / 150);
        displayData = sortedData.filter((_, index) => index % sampleRate === 0);
      }
      
      chartData = {
        labels: displayData.map(item => format(new Date(item[xField]), 'MMM dd HH:mm')),
        datasets: [{
          label: title || `${yField} Over Time`,
          data: displayData.map(item => item[yField]),
          borderColor: colors.primary,
          backgroundColor: colors.background,
          fill: true,
          tension: 0.2, // Reduced tension for more accurate representation
          pointRadius: displayData.length > 100 ? 1 : 2, // Smaller points for dense data
          pointHoverRadius: 7,
          borderWidth: 2,
          pointBackgroundColor: colors.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointHitRadius: 10, // Larger hit area for better user interaction
          spanGaps: true // Connect lines across missing data points
        }]
      };
    } else if (type === 'bar') {
      chartData = {
        labels: sortedData.map(item => format(new Date(item[xField]), 'MMM dd HH:mm')),
        datasets: [{
          label: title || yField,
          data: sortedData.map(item => item[yField]),
          backgroundColor: colors.background,
          borderColor: colors.primary,
          borderWidth: 1,
          hoverBackgroundColor: colors.hover,
          barPercentage: 0.95,
          categoryPercentage: 0.95
        }]
      };
    } else if (type === 'doughnut') {
      // Get unique categories and count values
      const categories = {};
      sortedData.forEach(item => {
        const category = item[xField];
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += parseFloat(item[yField] || 0);
      });
      
      chartData = {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: [
            'rgba(0, 163, 224, 0.8)', // AVEVA blue
            'rgba(255, 99, 132, 0.8)', // Red for pressure
            'rgba(54, 162, 235, 0.8)', // Blue
            'rgba(255, 206, 86, 0.8)', // Yellow
            'rgba(153, 102, 255, 0.8)', // Purple
            'rgba(255, 159, 64, 0.8)' // Orange
          ],
          borderColor: [
            'rgba(0, 163, 224, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1,
          hoverOffset: 12,
        }]
      };
    } else if (type === 'scatter') {
      chartData = {
        datasets: [{
          label: title || `${xField} vs ${yField}`,
          data: sortedData.map(item => ({ 
            x: item[xField],
            y: item[yField],
            timestamp: format(new Date(item.Time_Stamp), 'MMM dd HH:mm')
          })),
          backgroundColor: colors.background,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBorderColor: colors.primary,
          pointHoverBackgroundColor: '#fff',
        }]
      };
    }
    
    return chartData;
  };

  // Common chart options with good defaults
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false, // This should be false to respect container dimensions
    resizeDelay: 200, // Reduce resize events frequency
    animation: {
      duration: 1000, // Smoother animation
      easing: 'easeOutQuart'
    },
    layout: {
      padding: {
        top: 5,
        right: 5,
        bottom: 5,
        left: -10 // More negative padding to extend chart further left
      }
    },
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 10
        }
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      },
      decimation: {
        enabled: true,
        algorithm: 'lttb', // Changed to LTTB (Largest Triangle Three Buckets) for better distribution
        samples: 200 // Limit samples for better distribution
      }
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          maxTicksLimit: 10, // Increased for better distribution
          maxRotation: 45,
          minRotation: 0,
          padding: 4, // Reduced padding
          font: {
            size: 11
          },
          autoSkip: true // Ensure ticks are properly skipped when needed
        },
        offset: false, // Remove extra space on axis
        distribution: 'linear' // Ensure even distribution of points
      },
      y: {
        position: 'left',
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          padding: 2, // Reduced padding
          font: {
            size: 11
          },
          callback: function(value) {
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value;
          }
        },
        beginAtZero: false
      }
    } : undefined, // No scales for doughnut charts
    interaction: {
      mode: 'index',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: false
    }
  };
  
  const chartOptions = { ...defaultOptions, ...options };
  const chartData = prepareChartData();
  
  // Update the chart rendering to simplify and focus on direct rendering
  const renderChart = () => {
    // Create a unique ID for this chart render cycle
    const chartContainerId = `chart-container-${Math.random().toString(36).substr(2, 9)}`;
    
    // Force chart to use available data by checking if we have data and creating a valid structure
    let actualData = chartData;
    
    // Special case: if y values exist but are 0, we might be displaying "No Data Available" incorrectly
    if (chartFilteredData && chartFilteredData.length > 0 && 
        (!actualData.datasets || actualData.datasets[0].label === 'No Data Available')) {
      console.log(`Forcing data rendering for ${yField} with ${chartFilteredData.length} points`);
      
      const colors = {
        primary: yField === "rTotalQPercentage" ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)',
        background: yField === "rTotalQPercentage" ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)',
      };
      
      const sortedData = [...chartFilteredData].sort((a, b) => new Date(a[xField]) - new Date(b[xField]));
      
      actualData = {
        labels: sortedData.map(item => format(new Date(item[xField]), 'MMM dd HH:mm')),
        datasets: [{
          label: title || `${yField} Over Time`,
          data: sortedData.map(item => item[yField]),
          borderColor: colors.primary,
          backgroundColor: colors.background,
          fill: true,
          tension: 0.2,
          pointRadius: 3,
          borderWidth: 2
        }]
      };
    }
    
    // Standard chart rendering based on type with the updated data
    switch (type) {
      case 'line':
        return (
          <div style={chartContainerStyle} id={chartContainerId} key={chartContainerId}>
            <Line data={actualData} options={chartOptions} ref={handleChartRef} />
          </div>
        );
      case 'bar':
        return (
          <div style={chartContainerStyle} id={chartContainerId} key={chartContainerId}>
            <Bar data={actualData} options={chartOptions} ref={handleChartRef} />
          </div>
        );
      case 'doughnut':
        return (
          <div style={chartContainerStyle} id={chartContainerId} key={chartContainerId}>
            <Doughnut data={actualData} options={chartOptions} ref={handleChartRef} />
          </div>
        );
      case 'scatter':
        return (
          <div style={chartContainerStyle} id={chartContainerId} key={chartContainerId}>
            <Scatter data={actualData} options={chartOptions} ref={handleChartRef} />
          </div>
        );
      default:
        return (
          <div style={chartContainerStyle} id={chartContainerId} key={chartContainerId}>
            <Bar data={actualData} options={chartOptions} ref={handleChartRef} />
          </div>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%', 
      height: '400px', // Increased height for better visualization
      maxHeight: '500px', // Increased max height
      overflow: 'hidden',
      position: 'relative',
      ...style
    }}>
      {/* Hide the chart-specific filters that may be restricting data */}
      {/*
      <div className="chart-header-with-filters">
        <div className="chart-filters"></div>
          <ChartDateFilter 
            data={filteredData} 
            dateField={xField} 
            onDateFilterChange={handleDateFilterChange}
            title="Date"
          />
          <ChartTimeFilter 
            data={chartDateFilter ? chartFilteredData : filteredData} 
            dateField={xField} 
            onTimeFilterChange={handleTimeFilterChange}
            title="Time"
          />
        </div>
      </div>
      */}
      
      <div className="chart-container" style={{ width: '100%', height: '100%' }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default ReportChart;