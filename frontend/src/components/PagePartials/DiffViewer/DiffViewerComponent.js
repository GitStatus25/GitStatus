import React from 'react';
import { useTheme } from '@mui/material';
import DiffViewerComponentTemplate from './DiffViewerComponent.jsx';

/**
 * DiffViewer component that displays code diffs with syntax highlighting
 * @param {string} patch - The patch/diff text from Git
 */
const DiffViewerComponent = ({ patch }) => {
  const theme = useTheme();
  
  // In this simple case, there's not much business logic,
  // but in a more complex component we could handle:
  // - Parsing and formatting the diff
  // - Collapsing/expanding sections
  // - Line highlighting logic
  // - Handling user interactions

  return <DiffViewerComponentTemplate patch={patch} theme={theme} />;
};

export default DiffViewerComponent;
