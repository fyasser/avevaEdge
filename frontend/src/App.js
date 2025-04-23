import React, { useEffect, useState } from 'react';
import ReportChart from './ReportChart';
import './App.css';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
} from 'chart.js';

import ChartCarousel from './ChartCarousel';
import DataTable from './DataTable';
import FilterOptions from './FilterOptions';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement, 
  RadialLinearScale,
  PointElement, 
  LineElement 
);

function App() {
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [radarChartData, setRadarChartData] = useState(null);
  const [doughnutChartData, setDoughnutChartData] = useState(null);
  const [lineChartData, setLineChartData] = useState(null);
  const [scatterChartData, setScatterChartData] = useState(null);
  const [selectedCharts, setSelectedCharts] = useState({
    radar: false,
    doughnut: false,
    line: false,
    scatter: false,
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('http://localhost:5000/api/trend-data')
      .then((response) => response.json())
      .then((data) => {
        const formattedChartData = {
          labels: data.map((item) => format(new Date(item.Time_Stamp), 'MMM dd HH:mm')), // Minimal timestamp format
          datasets: [
            {
              label: 'Flow',
              data: data.map((item) => item.rTotalQ),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        };
        setChartData(formattedChartData);
        setTableData(data);

        const formattedPieChartData = {
          labels: ['Counter', 'Flow', 'Pressure'],
          datasets: [
            {
              data: [
                data.reduce((sum, item) => sum + item.counter, 0),
                data.reduce((sum, item) => sum + item.rTotalQ, 0),
                data.reduce((sum, item) => sum + item.rTotalQPercentage, 0),
              ],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
              ],
              borderWidth: 1,
            },
          ],
        };
        setRadarChartData(formattedPieChartData);

        const formattedDoughnutChartData = {
          labels: ['counter', 'flow', 'pressure'],
          datasets: [
            {
              data: [
                data.reduce((sum, item) => sum + item.counter, 0),
                data.reduce((sum, item) => sum + item.rTotalQ, 0),
                data.reduce((sum, item) => sum + item.rTotalQPercentage, 0),
              ],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
              ],
            },
          ],
        };

        const formattedLineChartData = {
          labels: data.map((item) => format(new Date(item.Time_Stamp), 'MMM dd HH:mm')), // Minimal timestamp format
          datasets: [
            {
              label: 'Flow Over Time',
              data: data.map((item) => item.rTotalQ),
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: true,
            },
            {
              label: 'Pressure Over Time',
              data: data.map((item) => item.rTotalQPercentage),
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              fill: true,
            },
          ],
        };

        const formattedScatterChartData = {
          datasets: [
            {
              label: 'Flow vs Pressure',
              data: data.map((item) => ({ x: item.rTotalQ, y: item.rTotalQPercentage })),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
          ],
        };

        setDoughnutChartData(formattedDoughnutChartData);
        setLineChartData(formattedLineChartData);
        setScatterChartData(formattedScatterChartData);
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  useEffect(() => {
    return () => {
      Object.keys(ChartJS.instances).forEach((id) => {
        const chart = ChartJS.getChart(id);
        if (chart) {
          chart.destroy();
        }
      });
    };
  }, []);

  useEffect(() => {
    console.log('Chart Data:', chartData);
    console.log('Radar Chart Data:', radarChartData);
    console.log('Doughnut Chart Data:', doughnutChartData);
    console.log('Line Chart Data:', lineChartData);
    console.log('Scatter Chart Data:', scatterChartData);
  }, [chartData, radarChartData, doughnutChartData, lineChartData, scatterChartData]);

  // Temporary static data for testing
  useEffect(() => {
    const staticChartData = {
      labels: ['January', 'February', 'March'],
      datasets: [
        {
          label: 'Static Dataset',
          data: [10, 20, 30],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };

    setChartData(staticChartData);
    setRadarChartData(staticChartData);
    setDoughnutChartData(staticChartData);
    setLineChartData(staticChartData);
    setScatterChartData(staticChartData);
  }, []);

  // Ensure proper rendering by checking all chart data
  if (!chartData || !radarChartData || !doughnutChartData || !lineChartData || !scatterChartData) {
    return <div>Loading charts...</div>;
  }

  // Simplified rendering to test a single chart with static data
  const staticChartData = {
    labels: ['January', 'February', 'March'],
    datasets: [
      {
        label: 'Static Dataset',
        data: [10, 20, 30],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Restored filtering and report download logic
  const handleChartSelection = (event) => {
    const { name, checked } = event.target;
    setSelectedCharts((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateRangeChange = (event) => {
    const { name, value } = event.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const fetchFilteredData = () => {
    const queryParams = new URLSearchParams({
      start: dateRange.start,
      end: dateRange.end,
      radar: selectedCharts.radar,
      doughnut: selectedCharts.doughnut,
      line: selectedCharts.line,
      scatter: selectedCharts.scatter,
    });

    fetch(`http://localhost:5000/api/trend-data?${queryParams.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        const formattedChartData = {
          labels: data.map((item) => format(new Date(item.Time_Stamp), 'MMM dd HH:mm')), // Minimal timestamp format
          datasets: [
            {
              label: 'Flow',
              data: data.map((item) => item.rTotalQ),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        };
        setChartData(formattedChartData);
        setTableData(data);
        // ...existing logic for radar, doughnut, line, and scatter chart data...
      })
      .catch((error) => console.error('Error fetching filtered data:', error));
  };

  function downloadPage() {
    const pageContent = document.documentElement.outerHTML;
    const charts = document.querySelectorAll('.chart-box canvas');
    const table = document.querySelector('.table-container table');

    const staticCharts = Array.from(charts).map((chart) => {
      const img = chart.toDataURL('image/png');
      return `<img src="${img}" alt="Chart" />`;
    }).join('');

    const staticTable = table.outerHTML;

    const fullContent = `
      <html>
      <head>
        <title>Report</title>
      </head>
      <body>
        ${staticCharts}
        ${staticTable}
      </body>
      </html>
    `;

    const blob = new Blob([fullContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, 'report_with_charts.html');
  }

  return (
    <div className="App">
      <header className="App-header" style={{ width: '100%', textAlign: 'center', padding: '20px', backgroundColor: '#4CAF50', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}> Report</h1>
      </header>
      <div className="App-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '20px' }}>
        <div className="App-main-content" style={{ flex: 5, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="carousel-container" style={{ flex: 1, height: '300px', overflow: 'hidden' }}>
            <ChartCarousel
              chartData={chartData}
              radarChartData={radarChartData}
              doughnutChartData={doughnutChartData}
              lineChartData={lineChartData}
              scatterChartData={scatterChartData}
              options={{ responsive: true }}
            />
          </div>
          <div className="table-container" style={{ flex: 1, height: '100px', overflow: 'hidden', width: '100%' }}>
            <DataTable
              tableData={tableData}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </div>
        <div className="App-form" style={{ flex: 1, marginLeft: '10px' }}>
          <FilterOptions
            selectedCharts={selectedCharts}
            handleChartSelection={handleChartSelection}
            dateRange={dateRange}
            handleDateRangeChange={handleDateRangeChange}
            fetchFilteredData={fetchFilteredData}
            downloadPage={downloadPage}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
