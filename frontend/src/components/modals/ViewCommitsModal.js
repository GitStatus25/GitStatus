import React, { useState, useEffect } from 'react';
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
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../contexts/ModalContext';
import DiffViewer from '../../components/DiffViewer';

const ViewCommitsModal = () => {
  const navigate = useNavigate();
  const {
    modalState,
    closeModals,
    openCreateReportModal,
    updateSelectedCommits
  } = useModal();

  const {
    viewCommitsOpen,
    reportData,
    commits,
    selectedCommits: initialSelectedCommits
  } = modalState;

  // Local state
  const [selectedCommits, setSelectedCommits] = useState(initialSelectedCommits || []);
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch user stats when component mounts
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await api.getUserStats();
        setUserStats(response.data);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError('Failed to load user limits. Please try again.');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchUserStats();
  }, []);

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

  // Toggle a commit's selection status
  const toggleCommitSelection = (commitSha) => {
    setSelectedCommits(prev => {
      if (prev.includes(commitSha)) {
        return prev.filter(sha => sha !== commitSha);
      } else {
        return [...prev, commitSha];
      }
    });
  };

  // Toggle select all commits
  const toggleSelectAllCommits = () => {
    if (selectedCommits.length === commits.length) {
      // Deselect all
      setSelectedCommits([]);
    } else {
      // Select all
      setSelectedCommits(commits.map(commit => commit.sha));
    }
  };

  // Toggle expanded commit for viewing diffs
  const toggleExpandCommit = (commitSha) => {
    setExpandedCommit(expandedCommit === commitSha ? null : commitSha);
  };

  // Toggle expanded file in a commit
  const toggleExpandFile = (fileId) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  // Go back to create report modal
  const handleBackToForm = () => {
    // Save selected commits to context
    updateSelectedCommits(selectedCommits);
    openCreateReportModal();
  };

  // Generate report from selected commits
  const generateReport = async () => {
    if (!selectedCommits.length) {
      setError('Please select at least one commit');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get detailed commit info including branch details
      // eslint-disable-next-line no-unused-vars
      const commitsWithInfo = await api.getCommitInfo({
        repository: reportData.repository,
        commitIds: selectedCommits
      });

      // Generate report with selected commits
      const reportParams = {
        repository: reportData.repository,
        branches: reportData.branches.map(branch => 
          typeof branch === 'object' ? branch.name : branch
        ),
        authors: reportData.authors,
        startDate: reportData.startDate ? reportData.startDate.toISOString() : null,
        endDate: reportData.endDate ? reportData.endDate.toISOString() : null,
        title: reportData.title || `${reportData.repository} Report`,
        includeCode: reportData.includeCode,
        commitIds: selectedCommits
      };

      const report = await api.generateReport(reportParams);
      
      // Close modal and navigate to the report view page
      closeModals();
      navigate(`/reports/${report.reportId || report.id}`);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get usage info for current report type
  const getUsageInfo = () => {
    if (!userStats?.plan?.limits || !userStats?.currentUsage) return null;

    const commitCount = selectedCommits.length;
    const { commitsPerStandardReport, commitsPerLargeReport } = userStats.plan.limits;
    const { reportsGenerated } = userStats.currentUsage;

    if (commitCount === 0) return null;

    const isStandard = commitCount <= commitsPerStandardReport;
    const current = isStandard ? reportsGenerated.standard : reportsGenerated.large;
    const limit = isStandard ? userStats.plan.limits.reportsPerMonth : userStats.plan.limits.reportsPerMonth;

    return {
      current,
      limit,
      isStandard
    };
  };

  return (
    <Dialog
      open={viewCommitsOpen}
      onClose={() => updateSelectedCommits(selectedCommits) && closeModals()}
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
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" component="div">Select Commits</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            {selectedCommits.length} of {commits.length} commits selected
          </Typography>
        </Box>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToForm}
            sx={{ mr: 1 }}
          >
            Back to Form
          </Button>
          <IconButton onClick={() => updateSelectedCommits(selectedCommits) && closeModals()} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Select/Deselect All Control - Fixed at the top */}
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            position: 'sticky', 
            top: 0, 
            bgcolor: 'background.paper', 
            zIndex: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
          }}
        >
          <Checkbox
            checked={selectedCommits.length === commits.length && commits.length > 0}
            indeterminate={selectedCommits.length > 0 && selectedCommits.length < commits.length}
            onChange={toggleSelectAllCommits}
            disabled={commits.length === 0}
          />
          <Typography variant="body1">
            {selectedCommits.length === commits.length && commits.length > 0
              ? 'Deselect All'
              : 'Select All'}
          </Typography>
        </Box>

        {/* Scrollable Commit List Container */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {commits.length === 0 ? (
              <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                No commits found for the selected criteria.
              </Typography>
            ) : (
              commits.map((commit) => (
                <React.Fragment key={commit.sha}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => toggleExpandCommit(commit.sha)}
                        aria-label="expand"
                      >
                        <ExpandMoreIcon 
                          sx={{ 
                            transform: expandedCommit === commit.sha ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                          }}
                        />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedCommits.includes(commit.sha)}
                        onChange={() => toggleCommitSelection(commit.sha)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" component="span" fontWeight="bold" sx={{ mr: 1 }}>
                            {commit.sha.substring(0, 7)}
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                            by {commit.author?.name || commit.author?.login || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ color: 'text.secondary' }}>
                            {formatDate(commit.date)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body1"
                          component="span"
                          sx={{ display: 'inline' }}
                        >
                          {commit.message}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Collapse in={expandedCommit === commit.sha} timeout="auto" unmountOnExit>
                    <Box sx={{ pl: 9, pr: 2, pb: 2, width: '100%' }}>
                      {commit.files && commit.files.length > 0 ? (
                        commit.files.map((file, fileIndex) => (
                          <Accordion 
                            key={`${commit.sha}-${fileIndex}`}
                            expanded={!!expandedFiles[`${commit.sha}-${fileIndex}`]}
                            onChange={() => toggleExpandFile(`${commit.sha}-${fileIndex}`)}
                            sx={{ 
                              mb: 1, 
                              width: '100%', 
                              maxWidth: '100%',
                              '& .MuiAccordionDetails-root': {
                                padding: 0,
                                width: '100%',
                                overflowX: 'auto'
                              }
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CodeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2">
                                  {file.filename} {' '}
                                  <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                                    (+{file.additions || 0}, -{file.deletions || 0})
                                  </Typography>
                                </Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                              <DiffViewer patch={file.patch || ''} />
                            </AccordionDetails>
                          </Accordion>
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No file changes available
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                  <Divider component="li" />
                </React.Fragment>
              ))
            )}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
          {getUsageInfo() && (
            <Typography variant="body2" color="text.secondary">
              {getUsageInfo().isStandard ? 'Standard' : 'Large'} Report: {getUsageInfo().current} of {getUsageInfo().limit} used this month
            </Typography>
          )}
        </Box>
        <Box>
          <Button onClick={handleBackToForm} variant="outlined" sx={{ mr: 2 }}>
            Back to Form
          </Button>
          <Tooltip title={getReportTypeInfo().message}>
            <span>
              <Button
                variant="contained"
                color="primary"
                onClick={generateReport}
                disabled={loading || loadingStats || getReportTypeInfo().disabled}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Generating Report...
                  </>
                ) : (
                  getReportTypeInfo().message
                )}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ViewCommitsModal; 