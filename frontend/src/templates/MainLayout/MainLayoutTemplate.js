import React from 'react';
import PropTypes from 'prop-types';
import { Box, Container } from '@mui/material';
import NavBarComponent from '../../components/NavBar/NavBarComponent';

/**
 * Main layout template for application pages
 * Includes the NavBar and wraps content in a container
 */
const MainLayoutTemplate = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBarComponent />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

MainLayoutTemplate.propTypes = {
  children: PropTypes.node.isRequired
};

export default MainLayoutTemplate; 