import React, { useRef, useEffect } from 'react';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { format } from 'date-fns';
import { 
  registerChart, 
  unregisterChart,
  patchChartInstance,
  installGlobalErrorPrevention
} from './utils/chartInstanceManager';

// Install global error prevention once when this module is imported
installGlobalErrorPrevention();

const ReportChart = ({ 
  data, 
  type = 'bar', 
  xField = 'Time_Stamp', 
  yField = 'rTotalQ', 
  title = '',
  style = {},
  options = {}
}) => {
  const chartRef = useRef(null);
  const chartId = useRef(null);
  const componentId = `ReportChart-${xField}-${yField}`;

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

  // Prepare chart data based on input data
  const prepareChartData = () => {
    // Handle empty data
    if (!data || data.length === 0) {
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
    
    let chartData;
    
    if (type === 'line') {
      chartData = {
        labels: data.map(item => format(new Date(item[xField]), 'MMM dd HH:mm')),
        datasets: [{
          label: title || `${yField} Over Time`,
          data: data.map(item => item[yField]),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 7,
        }]
      };
    } else if (type === 'bar') {
      chartData = {
        labels: data.map(item => format(new Date(item[xField]), 'MMM dd HH:mm')),
        datasets: [{
          label: title || yField,
          data: data.map(item => item[yField]),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }]
      };
    } else if (type === 'doughnut') {
      // Get unique categories and count values
      const categories = {};
      data.forEach(item => {
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
            'rgba(75, 192, 192, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
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
          data: data.map(item => ({ 
            x: item[xField],
            y: item[yField],
            timestamp: format(new Date(item.Time_Stamp), 'MMM dd HH:mm')
          })),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBorderColor: 'rgba(75, 192, 192, 1)',
          pointHoverBackgroundColor: '#fff',
        }]
      };
    }
    
    return chartData;
  };

  // Common chart options with good defaults
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 200, // Reduce resize events frequency
    animation: {
      duration: 0 // Disable animation to prevent resize issues
    },
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      }
    },
    scales: type !== 'doughnut' ? {
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
    <div style={{ width: '100%', height: '300px', ...style }}>
      {renderChart()}
    </div>
  );
};

export default ReportChart;