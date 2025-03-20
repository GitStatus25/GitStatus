import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching user stats and plan information
 * Can be used in any component that needs to display user limits or usage stats
 */
const useUserStats = () => {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user stats on hook initialization
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const response = await api.getUserStats();
        setUserStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError('Failed to load user limits. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  // Helper to check if user is within plan limits
  const isWithinLimits = (limitType, value) => {
    if (!userStats?.plan?.limits) return false;
    
    const { limits } = userStats.plan;
    
    switch (limitType) {
      case 'standardReport':
        return value <= limits.commitsPerStandardReport;
      case 'largeReport':
        return value <= limits.commitsPerLargeReport;
      case 'monthlyReports':
        const current = userStats.currentMonthStats.reports.standard + 
                       userStats.currentMonthStats.reports.large;
        return current < limits.reportsPerMonth;
      default:
        return false;
    }
  };

  return {
    userStats,
    loading,
    error,
    isWithinLimits
  };
};

export default useUserStats; 