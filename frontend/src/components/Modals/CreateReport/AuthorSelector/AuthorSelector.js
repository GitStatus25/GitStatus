import React from 'react';
import AuthorSelectorTemplate from './AuthorSelector.jsx';

/**
 * AuthorSelector component - Wrapper for the AuthorSelector template
 * Allows for future logic expansion if needed
 */
const AuthorSelector = (props) => {
  return <AuthorSelectorTemplate {...props} />;
};

export default AuthorSelector; 