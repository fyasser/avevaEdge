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

  // Debugging logs
  useEffect(() => {
    console.log(`ChartDropdownFilter (${title}): Filter options updated`, { 
      filterOptionsLength: filterOptions?.length,
      initialValue,
      selectedValue
    });
    
    if (filterOptions && filterOptions.length > 0) {
      // If there's an initialValue and it exists in options, use it
      if (initialValue) {
        const initialOption = filterOptions.find(option => option.value === initialValue);
        if (initialOption) {
          setSelectedValue(initialOption.value);
          console.log(`ChartDropdownFilter (${title}): Setting initial value:`, initialOption);
        }
      } else {
        // Otherwise use the first option as default
        setSelectedValue(filterOptions[0].value);
        console.log(`ChartDropdownFilter (${title}): Using first option as default:`, filterOptions[0]);
      }
    }
  }, [filterOptions, initialValue, title]);

  const handleOptionSelect = (option) => {
    console.log(`ChartDropdownFilter (${title}): Option selected:`, option);
    
    setSelectedValue(option.value);
    setIsOpen(false);
    
    // After setting state, directly call onFilterChange to pass the selection to parent
    console.log(`ChartDropdownFilter (${title}): Calling onFilterChange with:`, option.value);
    
    // Check that onFilterChange exists and is a function before calling it
    if (typeof onFilterChange === 'function') {
      onFilterChange(option.value);
    } else {
      console.error(`ChartDropdownFilter (${title}): onFilterChange is not a function`, onFilterChange);
    }
  };

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