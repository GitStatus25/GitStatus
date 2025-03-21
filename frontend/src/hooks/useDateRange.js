import { useState, useEffect, useRef } from 'react';
import api from '../services/api.js';

/**
 * Custom hook for managing date range functionality
 * Handles fetching commit date ranges based on repository, branches, and authors
 * with caching and debouncing
 */
export const useDateRange = (repository, branches, authors, repositoryValid) => {
  const [dateRange, setDateRange] = useState({
    firstCommitDate: null,
    lastCommitDate: null
  });
  const [isLoadingDateRange, setIsLoadingDateRange] = useState(false);
  
  // Caching mechanism for API calls
  const apiCache = useRef({
    dateRanges: {}
  });
  
  // Track component mount state
  const isMountedRef = useRef(true);
  
  // Debounce timer
  const dateRangeDebounceTimer = useRef(null);
  
  // Set mounted flag
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Update date range when branches or authors change
  useEffect(() => {
    const updateDateRange = async () => {
      if (!repository || !repositoryValid || !branches.length) {
        return;
      }
      
      try {
        setIsLoadingDateRange(true);
        const branchNames = branches.map(branch => typeof branch === 'object' ? branch.name : branch);
        
        // Create a cache key based on repository, branches and authors
        const cacheKey = `${repository}:${branchNames.sort().join(',')}:${authors.sort().join(',')}`;
        
        let newDateRange;
        
        // Check if we have cached results
        if (apiCache.current.dateRanges[cacheKey]) {
          newDateRange = apiCache.current.dateRanges[cacheKey];
        } else {
          // Fetch from API if not cached - don't use abort signal
          // to ensure request completes even after unmount
          newDateRange = await api.getDateRange(repository, branchNames, authors);
          
          // Cache the results
          apiCache.current.dateRanges[cacheKey] = newDateRange;
        }
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setDateRange(newDateRange);
        }
      } catch (err) {
        console.error('Error fetching date range:', err);
        // Don't update state if aborted or unmounted
        if (err.name !== 'AbortError' && !err.canceled && isMountedRef.current) {
          // Error state handling can go here if needed
        }
      } finally {
        // Only update loading state if still mounted
        if (isMountedRef.current) {
          setIsLoadingDateRange(false);
        }
      }
    };
    
    // Clear any existing debounce timer
    if (dateRangeDebounceTimer.current) {
      clearTimeout(dateRangeDebounceTimer.current);
    }
    
    // Set a new debounce timer
    dateRangeDebounceTimer.current = setTimeout(updateDateRange, 300);
    
    // Clean up the timer on component unmount
    return () => {
      if (dateRangeDebounceTimer.current) {
        clearTimeout(dateRangeDebounceTimer.current);
      }
    };
  }, [repository, branches, authors, repositoryValid]);
  
  // Function to validate and adjust dates according to date range
  const getAdjustedDates = (startDate, endDate) => {
    const adjustedDates = {
      startDate,
      endDate
    };
    
    // If start date is before first commit date, update it
    if (dateRange.firstCommitDate && (!startDate || new Date(startDate) < new Date(dateRange.firstCommitDate))) {
      adjustedDates.startDate = new Date(dateRange.firstCommitDate);
    }
    
    // If end date is after last commit date, update it
    if (dateRange.lastCommitDate && (!endDate || new Date(endDate) > new Date(dateRange.lastCommitDate))) {
      adjustedDates.endDate = new Date(dateRange.lastCommitDate);
    }
    
    return adjustedDates;
  };
  
  return {
    dateRange,
    isLoadingDateRange,
    getAdjustedDates
  };
};

export default useDateRange; 