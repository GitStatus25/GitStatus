import React from 'react';
import BranchSelectorTemplate from './BranchSelector.jsx';

/**
 * BranchSelector component for selecting repository branches
 * Business logic layer that controls the component's behavior
 */
const BranchSelector = (props) => {
  // This is a pass-through component currently, but if we need
  // to add component-specific business logic in the future, we can add it here
  
  // For author selection, we need to adjust some props
  if (props.branches === props.availableAuthors) {
    return (
      <BranchSelectorTemplate 
        {...props} 
        label="Authors (optional)"
        helperText="Filter by specific authors (leave empty to include all)"
        isRequired={false}
      />
    );
  }
  
  return <BranchSelectorTemplate {...props} />;
};

export default BranchSelector; 