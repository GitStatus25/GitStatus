import { useState, useEffect } from 'react';
import api from '../services/api.js';

/**
 * Custom hook for repository search functionality
 * Handles searching for repositories with debouncing
 */
export const useRepositorySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Handle repository search
  useEffect(() => {
    const searchRepositories = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        setSearching(true);
        const repos = await api.searchRepositories(searchQuery);
        setSearchResults(repos);
      } catch (err) {
        console.error('Repository search error:', err);
      } finally {
        setSearching(false);
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