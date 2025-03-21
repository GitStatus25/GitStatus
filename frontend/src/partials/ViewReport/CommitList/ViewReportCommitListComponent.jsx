import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
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
import './ViewReportCommitListComponent.css';

const ViewReportCommitListComponentTemplate = ({ 
  commits = [], 
  formatDate, 
  summaryStatus = 'pending', 
  summaryProgress = 0 
}) => {
  const theme = useTheme();

  // Helper to determine if we should show loading UI
  const isLoading = summaryStatus === 'pending' || summaryStatus === 'waiting' || summaryStatus === 'active';

  return (
    <Card 
      className="commit-list-card"
      sx={{
        backgroundImage: theme.palette.background.cardGradient,
      }}
    >
      <CardContent className="card-content">
        <Box className="card-header">
          <GitHubIcon className="header-icon" sx={{ color: theme.palette.primary.main }} />
          <Typography 
            variant="h5" 
            component="h2" 
            className="header-title"
            sx={{ 
              background: 'linear-gradient(90deg, #fff, #81d4fa)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Included Commits
          </Typography>
          {isLoading && (
            <Box display="flex" alignItems="center" ml={2}>
              <CircularProgress 
                size={24} 
                thickness={5} 
                variant={summaryProgress > 0 ? "determinate" : "indeterminate"}
                value={summaryProgress}
              />
              <Typography variant="body2" color="text.secondary" ml={1}>
                Generating summaries ({summaryProgress}%)
              </Typography>
            </Box>
          )}
        </Box>
        
        <Divider className="divider" />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="table-header-cell">Commit ID</TableCell>
                <TableCell className="table-header-cell">Author</TableCell>
                <TableCell className="table-header-cell">Message</TableCell>
                <TableCell className="table-header-cell">Date</TableCell>
                <TableCell className="table-header-cell">Summary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commits.map((commit) => (
                <TableRow 
                  key={commit.id || commit._id || commit.sha}
                  className="table-row"
                >
                  <TableCell className="commit-id-cell">
                    {commit.id?.substring(0, 7) || 
                     commit.sha?.substring(0, 7) || 
                     commit.hash?.substring(0, 7) || 
                     commit.commitId?.substring(0, 7) || 
                     'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box className="author-container">
                      <PersonIcon className="author-icon" />
                      <Typography variant="body2">
                        {commit.author?.name || commit.author?.login || 'Unknown'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip 
                      title={
                        <Typography variant="body2" className="tooltip-text">
                          {commit.message || commit.description || 'No message'}
                        </Typography>
                      }
                      arrow
                      placement="top"
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        className="truncated-text"
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
                    {isLoading && commit.pendingJobId ? (
                      <Box display="flex" alignItems="center">
                        <CircularProgress size={16} thickness={5} /> 
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          Generating...
                        </Typography>
                      </Box>
                    ) : (
                      <Tooltip 
                        title={
                          <Typography variant="body2" className="tooltip-text">
                            {commit.summary || commit.aiSummary || 'No summary available'}
                          </Typography>
                        }
                        arrow
                        placement="top"
                      >
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          className="truncated-text"
                        >
                          {commit.summary || commit.aiSummary || 'No summary available'}
                        </Typography>
                      </Tooltip>
                    )}
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

export default ViewReportCommitListComponentTemplate; 