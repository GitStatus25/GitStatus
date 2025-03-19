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

/**
 * Component that displays repository and date metadata for a report
 */
const ReportMetadataComponent = ({ report }) => {
  const theme = useTheme();

  // Format date for display
  const formatDate = (dateString) => {
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
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <GitHubIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(90deg, #fff, #81d4fa)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              m: 0 
            }}
          >
            Report Details
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            {/* Repository Card */}
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <GitHubIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">Repository</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>{report?.repository}</Typography>
              </Paper>
            </Grid>
            
            {/* Authors Card */}
            {report?.allAuthors && report.allAuthors.length > 0 && (
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                    <Typography variant="body2" color="text.secondary">
                      {report.allAuthors.length > 1 ? 'Authors' : 'Author'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {report.allAuthors.map((author, index) => (
                      <Chip
                        key={index}
                        label={author}
                        size="small"
                        sx={{ 
                          backgroundColor: 'rgba(77, 171, 245, 0.1)',
                          borderColor: 'rgba(77, 171, 245, 0.3)',
                          borderRadius: '4px',
                          '& .MuiChip-label': {
                            padding: '0 8px'
                          }
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
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">Date Range</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label={formatDate(report?.startDate)}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(77, 171, 245, 0.1)',
                      borderColor: 'rgba(77, 171, 245, 0.3)',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" sx={{ mx: 0.5 }}>to</Typography>
                  <Chip
                    label={formatDate(report?.endDate)}
                    size="small"
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
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <PersonIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">
                    Branch
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {report?.branch || 'main'}
                </Typography>
              </Paper>
            </Grid>
            
            {/* Created Card */}
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <AccessTimeIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">Created</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>{formatDate(report?.createdAt)}</Typography>
              </Paper>
            </Grid>
            
            {/* Access Count Card */}
            {report?.accessCount && (
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <VisibilityIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                    <Typography variant="body2" color="text.secondary">Access Count</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>{report.accessCount}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReportMetadataComponent; 