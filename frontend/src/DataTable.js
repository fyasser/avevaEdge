import React from 'react';

function DataTable({ tableData, searchTerm, setSearchTerm, rowsPerPage, setRowsPerPage, currentPage, setCurrentPage }) {
  const filteredData = tableData.filter((row) =>
    row.Time_Stamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.counter.toString().includes(searchTerm) ||
    row.rTotalQ.toString().includes(searchTerm) ||
    row.rTotalQPercentage.toString().includes(searchTerm)
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  return (
    <div className="table-container" style={{ width: '100%' }}>
      <h2>Data Table</h2>
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
        >
          <option value={5}>5 rows</option>
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Time Stamp</th>
            <th>Flow</th>
            <th>Pressure</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr key={index}>
              <td>{row.Time_Stamp}</td>
              <td>{row.rTotalQ}</td>
              <td>{row.rTotalQPercentage}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination-controls">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default DataTable;