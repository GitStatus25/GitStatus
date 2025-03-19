import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Collapse,
  Divider,
  IconButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DiffViewer from '../../DiffViewer';
import './ViewCommitsModalComponent.css';

const ViewCommitsModalComponent = ({
  open,
  commits = [],
  selectedCommits = [],
  expandedCommit,
  expandedFiles = {},
  loading = false,
  error = null,
  userStats = null,
  loadingStats = false,
  onClose,
  onBack,
  onToggleCommitSelection,
  onToggleSelectAllCommits,
  onToggleExpandCommit,
  onToggleExpandFile,
  onGenerateReport
}) => {
  // Calculate if all commits are selected
  const allCommitsSelected = commits.length > 0 && selectedCommits.length === commits.length;
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Determine report type and button state based on selected commits
  const getReportTypeInfo = () => {
    if (!userStats?.plan?.limits) return { disabled: true, message: 'Loading plan limits...' };

    const commitCount = selectedCommits.length;
    const { commitsPerStandardReport, commitsPerLargeReport } = userStats.plan.limits;

    if (commitCount === 0) {
      return { disabled: true, message: 'Select commits to generate a report' };
    }

    if (commitCount <= commitsPerStandardReport) {
      return { disabled: false, message: 'Generate Standard Report' };
    }

    if (commitCount <= commitsPerLargeReport) {
      return { disabled: false, message: 'Generate Large Report' };
    }

    return {
      disabled: true,
      message: `Exceeds maximum commits allowed (${commitsPerLargeReport} commits)`
    };
  };

  // Get usage info for current report type
  const getUsageInfo = () => {
    if (!userStats?.plan?.limits || !userStats?.currentUsage) return null;

    const commitCount = selectedCommits.length;
    const { commitsPerStandardReport, commitsPerLargeReport } = userStats.plan.limits;
    const { reportsGenerated } = userStats.currentUsage;

    if (commitCount === 0) return null;

    const isStandard = commitCount <= commitsPerStandardReport;
    const current = isStandard ? reportsGenerated.standard || 0 : reportsGenerated.large || 0;
    const limit = isStandard ? userStats.plan.limits.reportsPerMonth : userStats.plan.limits.reportsPerMonth;

    return {
      current,
      limit,
      isStandard
    };
  };

  const reportTypeInfo = getReportTypeInfo();
  const usageInfo = getUsageInfo();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          bgcolor: 'background.paper',
          maxHeight: '90vh',
          height: '90vh'
        }
      }}
    >
      <DialogTitle className="modal-title">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" component="div">Select Commits</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            {selectedCommits.length} of {commits.length} commits selected
          </Typography>
        </Box>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mr: 1 }}
          >
            Back to Form
          </Button>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0, overflow: 'hidden' }}>
        <Box className="commit-list-header">
          <Box className="select-all-container">
            <Checkbox
              checked={allCommitsSelected}
              indeterminate={selectedCommits.length > 0 && selectedCommits.length < commits.length}
              onChange={onToggleSelectAllCommits}
              disabled={commits.length === 0}
            />
            <Typography variant="body2">
              {allCommitsSelected ? 'Deselect All' : 'Select All'}
            </Typography>
          </Box>
        </Box>
        
        {error && (
          <Box px={3} py={1}>
            <Typography className="error-message">{error}</Typography>
          </Box>
        )}
        
        <Box className="commits-container">
          <List sx={{ p: 0 }}>
            {commits.map((commit) => (
              <React.Fragment key={commit.sha}>
                <ListItem className="commit-item" sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      checked={selectedCommits.includes(commit.sha)}
                      onChange={() => onToggleCommitSelection(commit.sha)}
                      edge="start"
                    />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" component="span" fontWeight="500" sx={{ mr: 1 }}>
                          {commit.message.split('\n')[0]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="span">
                          {commit.sha.substring(0, 7)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" component="span">
                          {commit.author?.name || "Unknown"} • {formatDate(commit.date)}
                        </Typography>
                        <Typography variant="body2" component="div" color="text.secondary" sx={{ mt: 0.5 }}>
                          <Button
                            size="small"
                            startIcon={<CodeIcon />}
                            onClick={() => onToggleExpandCommit(commit.sha)}
                            sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                          >
                            {commit.files ? `${commit.files.length} files changed` : 'View changes'}
                            <ExpandMoreIcon
                              sx={{
                                ml: 0.5,
                                transform: expandedCommit === commit.sha ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }}
                            />
                          </Button>
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                
                {commit.files && (
                  <Collapse in={expandedCommit === commit.sha} timeout="auto" unmountOnExit>
                    <Box className="commit-details">
                      <List disablePadding>
                        {commit.files.map((file, fileIndex) => (
                          <React.Fragment key={`${commit.sha}-${file.filename}`}>
                            <Accordion
                              expanded={expandedFiles[`${commit.sha}-${file.filename}`] || false}
                              onChange={() => onToggleExpandFile(`${commit.sha}-${file.filename}`)}
                              elevation={0}
                              disableGutters
                              sx={{ backgroundColor: 'transparent' }}
                            >
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{ p: 0 }}
                              >
                                <Typography variant="body2">
                                  {file.filename} {' '}
                                  <Typography component="span" color="text.secondary" variant="body2">
                                    ({file.additions} additions, {file.deletions} deletions)
                                  </Typography>
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ p: 0 }}>
                                <Box className="diff-container">
                                  <DiffViewer
                                    oldCode={file.patch ? file.patch.split('\n').filter(line => 
                                      line.startsWith('-') && !line.startsWith('---')
                                    ).map(line => line.substring(1)).join('\n') : ''}
                                    newCode={file.patch ? file.patch.split('\n').filter(line => 
                                      line.startsWith('+') && !line.startsWith('+++')
                                    ).map(line => line.substring(1)).join('\n') : ''}
                                    language={file.filename.split('.').pop()}
                                  />
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                            {fileIndex < commit.files.length - 1 && <Divider sx={{ my: 1 }} />}
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  </Collapse>
                )}
                
                <Divider />
              </React.Fragment>
            ))}
            
            {commits.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                      No commits found that match your criteria.
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          {usageInfo && (
            <Typography className="usage-info">
              {usageInfo.isStandard ? 'Standard' : 'Large'} reports: {usageInfo.current}/{usageInfo.limit}
            </Typography>
          )}
        </Box>
        <Box className="action-buttons">
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          
          <Tooltip title={reportTypeInfo.disabled ? reportTypeInfo.message : ''}>
            <span>
              <Button
                onClick={onGenerateReport}
                variant="contained"
                color="primary"
                disabled={loading || reportTypeInfo.disabled || loadingStats}
              >
                {loading ? (
                  <>
                    Generating
                    <CircularProgress size={20} className="loading-indicator" />
                  </>
                ) : (
                  reportTypeInfo.message
                )}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ViewCommitsModalComponent;
