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
import './CommitListComponent.css';

const CommitListComponentTemplate = ({ commits = [], formatDate }) => {
  const theme = useTheme();

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

export default CommitListComponentTemplate; 