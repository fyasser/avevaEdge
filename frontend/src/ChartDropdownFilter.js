import React, { useState, useRef, useEffect } from 'react';
import './ChartDropdownFilter.css';

const ChartDropdownFilter = ({ 
  title,
  filterOptions, // Ensure this is always an array
  initialValue,
  onFilterChange,
  className = '' // Add className prop with empty string default
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Ensure filterOptions is a valid array before accessing it
  const safeFilterOptions = Array.isArray(filterOptions) ? filterOptions : [];
  
  const [selectedValue, setSelectedValue] = useState(
    initialValue || (safeFilterOptions.length > 0 ? safeFilterOptions[0].value : '')
  );
  
  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    <div className={`chart-dropdown-filter ${className}`} ref={dropdownRef}>
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
          <div className={`dropdown-menu ${className ? className + '-menu' : ''}`}>
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