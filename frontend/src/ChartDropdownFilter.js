import React, { useState } from 'react';
import './ChartDropdownFilter.css';

const ChartDropdownFilter = ({ 
  title,
  filterOptions, // Ensure this is always an array
  initialValue,
  onFilterChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Ensure filterOptions is a valid array before accessing it
  const safeFilterOptions = Array.isArray(filterOptions) ? filterOptions : [];
  
  const [selectedValue, setSelectedValue] = useState(
    initialValue || (safeFilterOptions.length > 0 ? safeFilterOptions[0].value : '')
  );

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    setSelectedValue(option.value);
    setIsOpen(false);
    
    // Call the parent's callback with the selected value
    if (onFilterChange) {
      onFilterChange(option.value);
    }
  };

  // Find the selected option's label for display
  const selectedOption = safeFilterOptions.find(option => option.value === selectedValue) || 
                         (safeFilterOptions.length > 0 ? safeFilterOptions[0] : null);

  return (
    <div className="chart-dropdown-filter">
      {title && <span className="filter-title">{title}:</span>}
      
      <div className="dropdown-container">
        <button 
          className="dropdown-button" 
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
        
        {isOpen && (
          <div className="dropdown-menu">
            {safeFilterOptions.map(option => (
              <div 
                key={option.value} 
                className={`dropdown-item ${selectedValue === option.value ? 'selected' : ''}`}
                onClick={() => handleOptionClick(option)}
              >
                {option.label}
                {selectedValue === option.value && <span className="check-mark">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartDropdownFilter;