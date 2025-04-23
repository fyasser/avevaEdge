import React from 'react';
import { Bar, Line, Radar, Doughnut, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportChart = ({ type, data, options }) => {
  // Added debugging logs to verify chart data passed to ReportChart
  console.log('Rendering ReportChart with data:', data);

  // Handle scatter chart data without labels
  if (type === 'scatter' && (!data || !data.datasets)) {
    console.error('Invalid scatter chart data:', data);
    return <div>No data available for the scatter chart.</div>;
  }

  if (!data || (!data.labels && type !== 'scatter') || !data.datasets) {
    console.error('Invalid data passed to ReportChart:', data);
    return <div>No data available for the chart.</div>;
  }

  // Updated chart design to be more minimalistic
  const optionsMinimalistic = {
    responsive: true,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Subtle dark background for tooltips
        titleFont: {
          size: 12,
          family: 'Arial, sans-serif',
        },
        bodyFont: {
          size: 10,
          family: 'Arial, sans-serif',
        },
      },
      legend: {
        display: false, // Removed legend for a cleaner look
      },
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false, // Removed grid lines for minimalism
        },
        title: {
          display: false, // Removed axis title for simplicity
        },
        ticks: {
          color: '#6c757d', // Subtle gray for ticks
          font: {
            size: 10,
            family: 'Arial, sans-serif',
          },
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(200, 200, 200, 0.2)', // Light grid lines
        },
        title: {
          display: false, // Removed axis title for simplicity
        },
        ticks: {
          color: '#6c757d', // Subtle gray for ticks
          font: {
            size: 10,
            family: 'Arial, sans-serif',
          },
        },
      },
    },
  };

  const minimalisticColors = [
    'rgba(78, 115, 223, 0.6)', // Blue
    'rgba(28, 200, 138, 0.6)', // Green
    'rgba(54, 185, 204, 0.6)', // Cyan
    'rgba(246, 194, 62, 0.6)', // Yellow
    'rgba(231, 74, 59, 0.6)', // Red
  ];

  // Apply minimalistic colors to datasets
  if (data && data.datasets) {
    data.datasets.forEach((dataset, index) => {
      dataset.backgroundColor = minimalisticColors[index % minimalisticColors.length];
      dataset.borderColor = minimalisticColors[index % minimalisticColors.length].replace('0.6', '1');
      dataset.borderWidth = 1; // Thinner borders for minimalism
    });
  }

  switch (type) {
    case 'line':
      return <Line data={data} options={optionsMinimalistic} />;
    case 'radar':
      return <Radar data={data} options={options} />;
    case 'doughnut':
      return <Doughnut data={data} options={options} />;
    case 'scatter':
      return <Scatter data={data} options={optionsMinimalistic} />;
    default:
      return <Bar data={data} options={optionsMinimalistic} />;
  }
};

export default ReportChart;