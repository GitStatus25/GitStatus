import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api.js';

/**
 * Custom hook for managing authors selection functionality
 * Handles fetching authors for selected branches with caching and debouncing
 */
export const useAuthorSelection = (repository, branches, repositoryValid) => {
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(false);
  
  // Caching mechanism for API calls
  const apiCache = useRef({
    authors: {}
  });
  
  // Debounce timer
  const authorsDebounceTimer = useRef(null);
  
  // Update authors when branches change
  useEffect(() => {
    const updateAvailableAuthors = async () => {
      if (!repository || !repositoryValid || !branches.length) {
        setAvailableAuthors([]);
        return;
      }
      
      try {
        setIsLoadingAuthors(true);
        const branchNames = branches.map(branch => typeof branch === 'object' ? branch.name : branch);
        
        // Create a cache key based on repository and branches
        const cacheKey = `${repository}:${branchNames.sort().join(',')}`;
        
        // Check if we have cached results
        if (apiCache.current.authors[cacheKey]) {
          setAvailableAuthors(apiCache.current.authors[cacheKey]);
        } else {
          // Fetch from API if not cached
          const authors = await api.getAuthorsForBranches(repository, branchNames);
          
          // Cache the results
          apiCache.current.authors[cacheKey] = authors;
          setAvailableAuthors(authors);
        }
      } catch (err) {
        console.error('Error fetching authors:', err);
        setAvailableAuthors([]);
      } finally {
        setIsLoadingAuthors(false);
      }
    };
    
    // Clear any existing debounce timer
    if (authorsDebounceTimer.current) {
      clearTimeout(authorsDebounceTimer.current);
    }
    
    // Set a new debounce timer
    authorsDebounceTimer.current = setTimeout(updateAvailableAuthors, 300);
    
    // Clean up the timer on component unmount
    return () => {
      if (authorsDebounceTimer.current) {
        clearTimeout(authorsDebounceTimer.current);
      }
    };
  }, [repository, branches, repositoryValid]);
  
  // Function to filter out authors that are no longer available
  const filterSelectedAuthors = (selectedAuthors) => {
    if (!availableAuthors.length) return [];
    
    return selectedAuthors.filter(author => 
      availableAuthors.includes(author)
    );
  };
  
  return {
    availableAuthors,
    isLoadingAuthors,
    filterSelectedAuthors
  };
};

export default useAuthorSelection; 