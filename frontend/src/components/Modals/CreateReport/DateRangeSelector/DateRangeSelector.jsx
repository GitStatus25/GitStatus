import React from 'react';
import { 
  Grid, 
  FormControl, 
  FormHelperText, 
  Box, 
  CircularProgress, 
  Typography 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import './DateRangeSelector.css';

/**
 * DateRangeSelector component presentation layer
 * Renders the date range selection UI with constraints based on commit history
 */
const DateRangeSelectorTemplate = ({
  startDate,
  endDate,
  dateRange,
  disabled,
  isLoadingDateRange,
  onDateChange,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth className="form-field">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => onDateChange('startDate', newValue)}
              minDate={dateRange?.firstCommitDate ? new Date(dateRange.firstCommitDate) : undefined}
              maxDate={dateRange?.lastCommitDate ? new Date(dateRange.lastCommitDate) : undefined}
              disabled={disabled || isLoadingDateRange}
              className="date-picker-container"
            />
          </LocalizationProvider>
          
          {isLoadingDateRange ? (
            <Box className="date-range-indicator">
              <CircularProgress size={14} className="loading-indicator" />
              <Typography className="date-range-text">
                Loading date range...
              </Typography>
            </Box>
          ) : dateRange?.firstCommitDate ? (
            <FormHelperText className="info-text">
              First commit: {new Date(dateRange.firstCommitDate).toLocaleDateString()}
            </FormHelperText>
          ) : null}
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth className="form-field">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => onDateChange('endDate', newValue)}
              minDate={startDate || (dateRange?.firstCommitDate ? new Date(dateRange.firstCommitDate) : undefined)}
              maxDate={dateRange?.lastCommitDate ? new Date(dateRange.lastCommitDate) : undefined}
              disabled={disabled || isLoadingDateRange}
              className="date-picker-container"
            />
          </LocalizationProvider>
          
          {isLoadingDateRange ? (
            <Box className="date-range-indicator">
              <CircularProgress size={14} className="loading-indicator" />
              <Typography className="date-range-text">
                Loading date range...
              </Typography>
            </Box>
          ) : dateRange?.lastCommitDate ? (
            <FormHelperText className="info-text">
              Last commit: {new Date(dateRange.lastCommitDate).toLocaleDateString()}
            </FormHelperText>
          ) : null}
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default DateRangeSelectorTemplate; 