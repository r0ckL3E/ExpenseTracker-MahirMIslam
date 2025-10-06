import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

export const useAICategorization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categorizeExpense = async (description) => {
    // Don't categorize empty or very short descriptions
    if (!description || description.trim().length < 3) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(
        API_PATHS.EXPENSE.AI_CATEGORIZE,
        { description }
      );
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Categorization failed";
      setError(errorMsg);
      console.error('AI categorization error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { categorizeExpense, loading, error };
};