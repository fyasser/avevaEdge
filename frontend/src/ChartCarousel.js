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
  
  // Clean up chart instances before unmounting
  useEffect(() => {
    return () => {
      console.log('ChartCarousel: Component will unmount, cleaning up charts');
      // Destroy all chart instances when component unmounts
      destroyComponentCharts(componentId);
      // Reset all chart references
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
    // Clean up chart instances using chart instance manager
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
    
    // Force regeneration of the chart components
    setCarouselKey(Date.now());
  };
  
  // Force chart refresh when the data changes
  useEffect(() => {
    console.log('ChartCarousel: Data changed, refreshing charts');
    cleanupCharts();
  }, [lineChartData, chartData, doughnutChartData, scatterChartData]);

  // Cleanup previous chart when changing to a new chart
  useEffect(() => {
    const chartTypes = ['line', 'bar', 'doughnut', 'scatter'];
    
    // Only cleanup non-visible charts to prevent memory leaks
    chartTypes.forEach((type, index) => {
      // If this chart is not currently visible and has an ID, unregister it
      if (index !== currentIndex && chartIds.current[type]) {
        console.log(`ChartCarousel: Cleaning up hidden ${type} chart`);
        unregisterChart(chartIds.current[type]);
        chartIds.current[type] = null;
        // Don't set chartRef to null as it's a React ref
      }
    });
  }, [currentIndex]);

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
  const enhancedLineChartData = lineChartData ? {
    ...lineChartData,
    datasets: lineChartData.datasets.map(dataset => ({
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
  const enhancedBarChartData = chartData ? {
    ...chartData,
    datasets: chartData.datasets.map(dataset => ({
      ...dataset,
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)', // Highlight on hover
      hoverBorderColor: 'rgba(75, 192, 192, 1)',
    }))
  } : fallbackChart;

  // Enhanced doughnut chart data for better hover effects
  const enhancedDoughnutChartData = doughnutChartData ? {
    ...doughnutChartData,
    datasets: doughnutChartData.datasets.map(dataset => ({
      ...dataset,
      hoverOffset: 12, // Makes the segment pop out on hover
      borderWidth: 2,
      hoverBorderColor: '#fff',
    }))
  } : fallbackChart;

  // Enhanced scatter chart data
  const enhancedScatterChartData = scatterChartData ? {
    ...scatterChartData,
    datasets: scatterChartData.datasets.map(dataset => ({
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-aveva-primary mb-4 text-center">{charts[currentIndex].title}</h2>
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