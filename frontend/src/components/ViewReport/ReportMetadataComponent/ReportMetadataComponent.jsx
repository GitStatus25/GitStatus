import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import './ReportMetadataComponent.css';

const ReportMetadataComponentTemplate = ({ report, formatDate }) => {
  const theme = useTheme();

  return (
    <Card 
      className="metadata-card"
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
            Report Details
          </Typography>
        </Box>
        
        <Divider className="divider" />

        <Box className="metadata-container">
          <Grid container spacing={2}>
            {/* Repository Card */}
            <Grid item xs={12} sm={6}>
              <Paper
                className="metadata-item"
                elevation={0}
              >
                <Box className="metadata-label">
                  <GitHubIcon fontSize="small" className="metadata-icon" />
                  <Typography variant="body2" color="text.secondary">Repository</Typography>
                </Box>
                <Typography variant="h6" className="metadata-value">{report?.repository}</Typography>
              </Paper>
            </Grid>
            
            {/* Authors Card */}
            {report?.allAuthors && report.allAuthors.length > 0 && (
              <Grid item xs={12} sm={6}>
                <Paper
                  className="metadata-item"
                  elevation={0}
                >
                  <Box className="metadata-label">
                    <PersonIcon fontSize="small" className="metadata-icon" />
                    <Typography variant="body2" color="text.secondary">
                      {report.allAuthors.length > 1 ? 'Authors' : 'Author'}
                    </Typography>
                  </Box>
                  <Box className="author-chips">
                    {report.allAuthors.map((author, index) => (
                      <Chip
                        key={index}
                        label={author}
                        size="small"
                        className="author-chip"
                        sx={{ 
                          backgroundColor: 'rgba(77, 171, 245, 0.1)',
                          borderColor: 'rgba(77, 171, 245, 0.3)',
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Date Range Card */}
            <Grid item xs={12} sm={6}>
              <Paper
                className="metadata-item"
                elevation={0}
              >
                <Box className="metadata-label">
                  <CalendarTodayIcon fontSize="small" className="metadata-icon" />
                  <Typography variant="body2" color="text.secondary">Date Range</Typography>
                </Box>
                <Box className="date-range">
                  <Chip
                    label={formatDate(report?.startDate)}
                    size="small"
                    className="date-chip"
                    sx={{ 
                      backgroundColor: 'rgba(77, 171, 245, 0.1)',
                      borderColor: 'rgba(77, 171, 245, 0.3)',
                    }}
                  />
                  <Typography variant="body2" className="date-separator">to</Typography>
                  <Chip
                    label={formatDate(report?.endDate)}
                    size="small"
                    className="date-chip"
                    sx={{ 
                      backgroundColor: 'rgba(77, 171, 245, 0.1)',
                      borderColor: 'rgba(77, 171, 245, 0.3)'
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            
            {/* Branch Card */} 
            <Grid item xs={12} sm={6}>
              <Paper
                className="metadata-item"
                elevation={0}
              >
                <Box className="metadata-label">
                  <PersonIcon fontSize="small" className="metadata-icon" />
                  <Typography variant="body2" color="text.secondary">
                    Branch
                  </Typography>
                </Box>
                <Typography variant="h6" className="metadata-value">
                  {report?.branch || 'main'}
                </Typography>
              </Paper>
            </Grid>
            
            {/* Created Card */}
            <Grid item xs={12} sm={6}>
              <Paper
                className="metadata-item"
                elevation={0}
              >
                <Box className="metadata-label">
                  <AccessTimeIcon fontSize="small" className="metadata-icon" />
                  <Typography variant="body2" color="text.secondary">Created</Typography>
                </Box>
                <Typography variant="h6" className="metadata-value">{formatDate(report?.createdAt)}</Typography>
              </Paper>
            </Grid>
            
            {/* Access Count Card */}
            {report?.accessCount && (
              <Grid item xs={12} sm={6}>
                <Paper
                  className="metadata-item"
                  elevation={0}
                >
                  <Box className="metadata-label">
                    <VisibilityIcon fontSize="small" className="metadata-icon" />
                    <Typography variant="body2" color="text.secondary">Access Count</Typography>
                  </Box>
                  <Typography variant="h6" className="metadata-value">{report.accessCount}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReportMetadataComponentTemplate; 