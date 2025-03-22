import React from 'react';
import { Box } from '@mui/material';
import './DiffViewerComponent.css';

const DiffViewerComponentTemplate = ({ patch, theme }) => {
  if (!patch) {
    return (
      <Box className="diff-viewer">
        <Box className="diff-content">
          <Box className="diff-line">
            <Box className="line-content">No diff available</Box>
          </Box>
        </Box>
      </Box>
    );
  }

  const lines = patch.split('\n');

  return (
    <Box className="diff-viewer">
      <Box className="diff-content">
        {lines.map((line, index) => {
          let lineType = '';
          if (line.startsWith('+')) {
            lineType = 'addition';
          } else if (line.startsWith('-')) {
            lineType = 'deletion';
          } else if (line.startsWith('@')) {
            lineType = 'info';
          }

          return (
            <Box key={index} className={`diff-line ${lineType}`}>
              <Box className="line-number">{index + 1}</Box>
              <Box className="line-content">{line.substring(1)}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default DiffViewerComponentTemplate;
