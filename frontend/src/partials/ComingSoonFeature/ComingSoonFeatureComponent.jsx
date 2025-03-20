import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import PropTypes from 'prop-types';
import './ComingSoonFeatureComponent.css';

/**
 * A reusable component to display features that are coming soon
 * 
 * @param {Object} props
 * @param {string} props.title - The name of the upcoming feature
 * @param {string} [props.description] - Optional description of the feature
 * @param {React.ReactNode} [props.icon] - Optional icon component
 * @param {string} [props.learnMoreUrl] - Optional URL for "Learn More" link
 * @param {Object} [props.sx] - Optional MUI sx prop for additional styling
 */
const ComingSoonFeatureComponent = ({ 
  title, 
  description, 
  icon, 
  learnMoreUrl,
  sx = {} 
}) => {
  return (
    <Paper 
      className="coming-soon-feature"
      elevation={0}
      sx={{ 
        p: 3, 
        textAlign: 'center',
        position: 'relative',
        ...sx
      }}
    >
      <Chip 
        label="Coming Soon" 
        color="primary" 
        className="coming-soon-badge"
      />
      
      <Box className="feature-content">
        {icon && (
          <Box className="feature-icon-container">
            {icon}
          </Box>
        )}
        
        <Typography variant="h6" className="feature-title">
          {title}
        </Typography>
        
        {description && (
          <Typography variant="body2" className="feature-description">
            {description}
          </Typography>
        )}
        
        {learnMoreUrl && (
          <Typography 
            variant="body2" 
            component="a" 
            href={learnMoreUrl} 
            target="_blank"
            className="learn-more-link"
          >
            Learn more
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

ComingSoonFeatureComponent.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.node,
  learnMoreUrl: PropTypes.string,
  sx: PropTypes.object
};

export default ComingSoonFeatureComponent;