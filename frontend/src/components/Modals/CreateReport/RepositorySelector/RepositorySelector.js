import React from 'react';
import RepositorySelectorTemplate from './RepositorySelector.jsx';

/**
 * RepositorySelector component for selecting GitHub repositories
 * Business logic layer that controls the component's behavior
 */
const RepositorySelector = (props) => {
  // This is a pass-through component currently, but if we need
  // to add component-specific business logic in the future, we can add it here
  return <RepositorySelectorTemplate {...props} />;
};

export default RepositorySelector; 