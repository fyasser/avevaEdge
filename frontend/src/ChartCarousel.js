import React, { useState } from 'react';
import ReportChart from './ReportChart';
import './App.css';

const ChartCarousel = ({ chartData, radarChartData, doughnutChartData, lineChartData, scatterChartData, options }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reverted to original chart carousel logic
  const charts = [
    { type: 'bar', data: chartData },
    { type: 'radar', data: radarChartData },
    { type: 'doughnut', data: doughnutChartData },
    { type: 'line', data: lineChartData },
    { type: 'scatter', data: scatterChartData },
  ];

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? charts.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === charts.length - 1 ? 0 : prevIndex + 1));
  };

  if (!chartData || !radarChartData || !doughnutChartData || !lineChartData || !scatterChartData) {
    return <div>Loading chart data...</div>;
  }

  // Simplified rendering logic for debugging
  console.log('Rendering chart:', charts[currentIndex]);
  if (!charts[currentIndex].data || (!charts[currentIndex].data.labels && charts[currentIndex].type !== 'scatter') || !charts[currentIndex].data.datasets) {
    console.error('Invalid data for chart:', charts[currentIndex]);
    return <div>No data available for the selected chart.</div>;
  }

  return (
    <div className="chart-carousel">
      <button className="carousel-button" onClick={handlePrevious}>
        &#8592; Previous
      </button>
      <div className="chart-box">
        <ReportChart type={charts[currentIndex].type} data={charts[currentIndex].data} options={options} />
      </div>
      <button className="carousel-button" onClick={handleNext}>
        Next &#8594;
      </button>
    </div>
  );
};

export default ChartCarousel;