import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to persist form data in sessionStorage to prevent data loss on tab switch
 * Data is automatically cleared on successful form submission
 */
export function useFormPersistence<T extends object>(
  formKey: string,
  initialData: T
): {
  formData: T;
  setFormData: (data: T | ((prev: T) => T)) => void;
  clearPersistedData: () => void;
  hasPersistedData: boolean;
} {
  const storageKey = `form_${formKey}`;
  
  // Check for persisted data on mount
  const getInitialData = (): T => {
    try {
      const persisted = sessionStorage.getItem(storageKey);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        // Merge persisted data with initialData to handle new fields
        return { ...initialData, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load persisted form data:', e);
    }
    return initialData;
  };

  const [formData, setFormDataInternal] = useState<T>(getInitialData);
  const [hasPersistedData] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  });

  // Persist to sessionStorage whenever form data changes
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (e) {
      console.warn('Failed to persist form data:', e);
    }
  }, [formData, storageKey]);

  // Clear persisted data (call this on successful submission)
  const clearPersistedData = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to clear persisted form data:', e);
    }
  }, [storageKey]);

  // Wrapper to support function updates
  const setFormData = useCallback((data: T | ((prev: T) => T)) => {
    setFormDataInternal(data);
  }, []);

  return {
    formData,
    setFormData,
    clearPersistedData,
    hasPersistedData,
  };
}

/**
 * Helper to create a unique form key based on context
 */
export function createFormKey(prefix: string, id?: string): string {
  return id ? `${prefix}_${id}` : prefix;
}
