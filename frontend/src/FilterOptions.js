import React from 'react';

function FilterOptions({ selectedCharts, handleChartSelection, dateRange, handleDateRangeChange, fetchFilteredData, downloadPage }) {
  return (
    <div className="App-form" style={{ width: '12.5vw', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <form onSubmit={(e) => { e.preventDefault(); fetchFilteredData(); }}>
        <h2>Filter Options</h2>
        <div>
          <label>
            <input
              type="checkbox"
              name="radar"
              checked={selectedCharts.radar}
              onChange={handleChartSelection}
            />
            Radar Chart
          </label>
          <label>
            <input
              type="checkbox"
              name="doughnut"
              checked={selectedCharts.doughnut}
              onChange={handleChartSelection}
            />
            Doughnut Chart
          </label>
          <label>
            <input
              type="checkbox"
              name="line"
              checked={selectedCharts.line}
              onChange={handleChartSelection}
            />
            Line Chart
          </label>
          <label>
            <input
              type="checkbox"
              name="scatter"
              checked={selectedCharts.scatter}
              onChange={handleChartSelection}
            />
            Scatter Chart
          </label>
        </div>
        <div>
          <label>
            Start Date:
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateRangeChange}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateRangeChange}
            />
          </label>
        </div>
        <button type="submit" onClick={downloadPage} style={{ backgroundColor: 'blue', color: 'white' }}>Generate Report</button>
      </form>
    </div>
  );
}

export default FilterOptions;