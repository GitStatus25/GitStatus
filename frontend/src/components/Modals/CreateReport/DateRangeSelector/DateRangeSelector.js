import React from 'react';
import DateRangeSelectorTemplate from './DateRangeSelector.jsx';

/**
 * DateRangeSelector component for selecting date ranges
 * Business logic layer that controls the component's behavior
 */
const DateRangeSelector = (props) => {
  // This is a pass-through component currently, but if we need
  // to add component-specific business logic in the future, we can add it here
  
  // For example, we could add validation logic to ensure startDate <= endDate
  // or transform dates to ensure they are within valid ranges
  
  return <DateRangeSelectorTemplate {...props} />;
};

export default DateRangeSelector; 