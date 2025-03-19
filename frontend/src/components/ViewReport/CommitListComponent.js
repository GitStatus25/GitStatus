import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import PersonIcon from '@mui/icons-material/Person';

/**
 * Component that displays a table of commits included in a report
 */
const CommitListComponent = ({ commits = [] }) => {
  const theme = useTheme();

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card 
      elevation={2}
      sx={{
        border: '1px solid rgba(255, 255, 255, 0.05)',
        backgroundImage: theme.palette.background.cardGradient,
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <GitHubIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(90deg, #fff, #81d4fa)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              m: 0 
            }}
          >
            Included Commits
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Commit ID</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Author</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Message</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Summary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commits.map((commit) => (
                <TableRow 
                  key={commit.id || commit._id || commit.sha}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.03)'
                    }
                  }}
                >
                  <TableCell sx={{ 
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.875rem'
                  }}>
                    {commit.id?.substring(0, 7) || 
                     commit.sha?.substring(0, 7) || 
                     commit.hash?.substring(0, 7) || 
                     commit.commitId?.substring(0, 7) || 
                     'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} />
                      <Typography variant="body2">
                        {commit.author?.name || commit.author?.login || 'Unknown'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip 
                      title={
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {commit.message || commit.description || 'No message'}
                        </Typography>
                      }
                      arrow
                      placement="top"
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'help'
                        }}
                      >
                        {commit.message || commit.description || 'No message'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {commit.date ? formatDate(commit.date) : 
                     (commit.timestamp ? formatDate(commit.timestamp) : 'No date')}
                  </TableCell>
                  <TableCell>
                    <Tooltip 
                      title={
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {commit.summary || commit.aiSummary || 'No summary available'}
                        </Typography>
                      }
                      arrow
                      placement="top"
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'help'
                        }}
                      >
                        {commit.summary || commit.aiSummary || 'No summary available'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default CommitListComponent; 