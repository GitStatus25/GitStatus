import { useState, useEffect, useRef } from 'react';
import api from '../services/api.js';

/**
 * Custom hook for repository search functionality
 * Handles searching for repositories with debouncing
 */
export const useRepositorySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Reference to track if component is mounted
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    // Set mounted flag to true
    isMountedRef.current = true;
    
    // Clean up on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Handle repository search
  useEffect(() => {
    const searchRepositories = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        setSearching(true);
        // Don't pass abort signal to ensure requests complete even after unmount
        const repos = await api.searchRepositories(searchQuery);
        
        // Only update state if still mounted
        if (isMountedRef.current) {
          setSearchResults(repos);
        }
      } catch (err) {
        console.error('Repository search error:', err);
        // Only update state if not aborted and still mounted
        if (err.name !== 'AbortError' && !err.canceled && isMountedRef.current) {
          setSearchResults([]);
        }
      } finally {
        // Only update state if still mounted
        if (isMountedRef.current) {
          setSearching(false);
        }
      }
    };
    
    // Debounce search requests
    const timeoutId = setTimeout(() => {
      searchRepositories();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searching
  };
};

export default useRepositorySearch; 