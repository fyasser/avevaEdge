import React, { useState, useMemo } from 'react';

function DataTable({ tableData = [], searchTerm, setSearchTerm, rowsPerPage, setRowsPerPage, currentPage, setCurrentPage }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      if (key === 'Time_Stamp') {
        return direction === 'ascending' 
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      }
      return direction === 'ascending' 
        ? a[key] - b[key]
        : b[key] - a[key];
    });
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let processed = tableData.filter((row) =>
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    if (sortConfig.key) {
      processed = sortData(processed, sortConfig.key, sortConfig.direction);
    }
    
    return processed;
  }, [tableData, searchTerm, sortConfig]);

  if (!tableData || tableData.length === 0) {
    return <div className="table-responsive">No data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search in all columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-aveva-primary focus:border-aveva-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="rows-select" className="text-sm text-gray-600">Rows per page:</label>
          <select
            id="rows-select"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="form-select rounded-md border-gray-300 focus:ring-aveva-primary focus:border-aveva-primary"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={99999}>All</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => requestSort('Time_Stamp')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Timestamp {sortConfig.key === 'Time_Stamp' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => requestSort('rTotalQ')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Total Q {sortConfig.key === 'rTotalQ' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => requestSort('rTotalQPercentage')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Total Q Percentage {sortConfig.key === 'rTotalQPercentage' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(row.Time_Stamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                    {row.rTotalQ.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                    {row.rTotalQPercentage.toFixed(2)}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {Math.ceil(processedData.length / rowsPerPage)}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage * rowsPerPage >= processedData.length}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default DataTable;