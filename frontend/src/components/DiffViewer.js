import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const DiffBox = styled(Box)(({ theme }) => ({
  fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
  fontSize: '0.85rem',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  overflow: 'auto',
  width: '100%',
  '& .diff-header': {
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.grey[100],
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontWeight: 'bold',
  },
  '& .diff-content': {
    padding: theme.spacing(0),
  },
  '& .diff-line': {
    padding: theme.spacing(0, 1),
    display: 'flex',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  '& .line-number': {
    color: theme.palette.text.secondary,
    paddingRight: theme.spacing(2),
    textAlign: 'right',
    userSelect: 'none',
    borderRight: `1px solid ${theme.palette.divider}`,
    minWidth: '2.5rem',
  },
  '& .line-content': {
    paddingLeft: theme.spacing(2),
    width: '100%',
  },
  '& .addition': {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  '& .deletion': {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  '& .info': {
    backgroundColor: 'rgba(0, 0, 255, 0.05)',
  },
}));

/**
 * DiffViewer component that displays code diffs with syntax highlighting
 * @param {string} patch - The patch/diff text from Git
 */
const DiffViewer = ({ patch }) => {
  if (!patch) {
    return (
      <DiffBox>
        <Box className="diff-content">
          <Box className="diff-line">
            <Box className="line-content">No diff available</Box>
          </Box>
        </Box>
      </DiffBox>
    );
  }

  const lines = patch.split('\n');

  return (
    <DiffBox>
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
              <Box className="line-content">{line}</Box>
            </Box>
          );
        })}
      </Box>
    </DiffBox>
  );
};

export default DiffViewer;
