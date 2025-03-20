import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundaryTemplate from './ErrorBoundary.jsx';

/**
 * ErrorBoundary component - catches JavaScript errors in the component tree,
 * logs errors, and displays a fallback UI instead of crashing the application
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({ errorInfo });
    
    // Call the optional onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Call the optional onReset prop if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI using template
      return (
        <ErrorBoundaryTemplate
          errorMessage={this.props.errorMessage}
          errorDetails={this.state.error?.toString()}
          showDetails={this.props.showDetails}
          resetable={this.props.resetable}
          resetButtonText={this.props.resetButtonText}
          onReset={this.handleReset}
        />
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  errorMessage: PropTypes.string,
  showDetails: PropTypes.bool,
  resetable: PropTypes.bool,
  resetButtonText: PropTypes.string,
  onError: PropTypes.func,
  onReset: PropTypes.func
};

ErrorBoundary.defaultProps = {
  errorMessage: 'An error occurred while loading this component',
  showDetails: false,
  resetable: true,
  resetButtonText: 'Try Again'
};

export default ErrorBoundary; 