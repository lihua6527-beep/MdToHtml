import { useState, useCallback } from 'react';
import { AppError, ErrorType } from '@/types/file-system';
import { ErrorHandler } from '@/services/core/ErrorHandler';

interface ErrorState {
  error: AppError | null;
  isVisible: boolean;
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isVisible: false
  });

  // Handle error
  const handleError = useCallback((error: any) => {
    const appError = ErrorHandler.handleError(error);
    setErrorState({
      error: appError,
      isVisible: true
    });
    return appError;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isVisible: false
    });
  }, []);

  // Get user-friendly error message
  const getErrorMessage = useCallback((error: AppError) => {
    return ErrorHandler.formatUserFriendlyMessage(error);
  }, []);

  // Check if error is of specific type
  const isErrorType = useCallback((error: AppError, type: ErrorType) => {
    return error.type === type;
  }, []);

  return {
    error: errorState.error,
    isErrorVisible: errorState.isVisible,
    handleError,
    clearError,
    getErrorMessage,
    isErrorType
  };
}

/**
 * Hook for handling form errors
 */
export function useFormErrorHandler() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set form errors
  const setFormError = useCallback((field: string, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }));
  }, []);

  // Clear form errors
  const clearFormError = useCallback((field?: string) => {
    if (field) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  // Check if form has errors
  const hasErrors = useCallback(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  // Get error for specific field
  const getFieldError = useCallback((field: string) => {
    return errors[field];
  }, [errors]);

  return {
    errors,
    setFormError,
    clearFormError,
    hasErrors,
    getFieldError
  };
}
