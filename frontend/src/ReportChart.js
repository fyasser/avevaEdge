import React, { useRef, useEffect, useState } from 'react';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { format } from 'date-fns';
import { 
  registerChart, 
  unregisterChart,
  patchChartInstance,
  installGlobalErrorPrevention
} from './utils/chartInstanceManager';
import ChartDateFilter from './ChartDateFilter';

// Install global error prevention once when this module is imported
installGlobalErrorPrevention();

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
  const [chartFilteredData, setChartFilteredData] = useState(data); // Data after chart-specific date filter
  const [chartDateFilter, setChartDateFilter] = useState(null); // Chart-specific date filter

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

  // Apply global filters from parent component
  useEffect(() => {
    // Apply date range filter
    let updatedData = data;
    if (dateRange && dateRange.length === 2) { // Ensure dateRange is valid
      const [startDate, endDate] = dateRange;
      // Add validation for start and end dates if necessary
      if (startDate && endDate) {
        updatedData = updatedData.filter(item => {
          const itemDate = new Date(item[xField]);
          return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
        });
      }
    }

    // Apply aggregation filter
    if (aggregation && aggregation !== 'none') {
      const aggregatedData = {};
      updatedData.forEach(item => {
        const itemDate = new Date(item[xField]);
        let key;
        if (aggregation === 'minutes') {
          key = itemDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
        } else if (aggregation === 'hours') {
          key = itemDate.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        } else if (aggregation === 'days') {
          key = itemDate.toISOString().slice(0, 10); // YYYY-MM-DD
        }

        if (!aggregatedData[key]) {
          aggregatedData[key] = { ...item, count: 1 };
        } else {
          aggregatedData[key][yField] += item[yField];
          aggregatedData[key].count += 1;
        }
      });

      updatedData = Object.values(aggregatedData).map(item => ({
        ...item,
        [yField]: item[yField] / item.count // Average the values
      }));
    }

    setFilteredData(updatedData);
  }, [data, dateRange, aggregation, xField, yField]);

  // Apply chart-specific date filter
  useEffect(() => {
    let data = filteredData;
    
    // Apply chart-specific date filter if set
    if (chartDateFilter) {
      data = filteredData.filter(item => {
        const itemDate = new Date(item[xField]);
        return itemDate >= new Date(chartDateFilter.start) && 
               itemDate <= new Date(chartDateFilter.end);
      });
    }
    
    setChartFilteredData(data);
  }, [filteredData, chartDateFilter, xField]);

  // Handle chart-specific date filter changes
  const handleDateFilterChange = (dateFilter) => {
    setChartDateFilter(dateFilter);
  };

  // Prepare chart data based on input data
  const prepareChartData = () => {
    // Handle empty data
    if (!chartFilteredData || chartFilteredData.length === 0) {
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
    
    let chartData;
    
    // Get theme colors based on chart type
    const getThemeColors = () => {
      if (yField === "rTotalQ") { // Flow chart
        return {
          primary: 'rgba(0, 163, 224, 1)', // AVEVA Accent Blue
          background: 'rgba(0, 163, 224, 0.2)',
          hover: 'rgba(0, 163, 224, 0.8)'
        };
      } else if (yField === "rTotalQPercentage") { // Pressure chart
        return {
          primary: 'rgba(255, 99, 132, 1)', // Red for pressure
          background: 'rgba(255, 99, 132, 0.2)',
          hover: 'rgba(255, 99, 132, 0.8)'
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
  
  // Render proper chart type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={chartData} options={chartOptions} ref={handleChartRef} />;
      case 'bar':
        return <Bar data={chartData} options={chartOptions} ref={handleChartRef} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} ref={handleChartRef} />;
      case 'scatter':
        return <Scatter data={chartData} options={chartOptions} ref={handleChartRef} />;
      default:
        return <Bar data={chartData} options={chartOptions} ref={handleChartRef} />;
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
      <div className="chart-header-with-filters">
        <div className="chart-filters">
          <ChartDateFilter 
            data={filteredData} 
            dateField={xField} 
            onDateFilterChange={handleDateFilterChange}
            title="Date"
          />
        </div>
      </div>
      
      <div className="chart-container">
        {renderChart()}
      </div>
    </div>
  );
};

export default ReportChart;