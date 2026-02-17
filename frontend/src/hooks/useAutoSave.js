import { useEffect, useRef, useState } from 'react';

export const useAutoSave = (data, key, delay = 2000) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Load saved data on mount
    const savedData = localStorage.getItem(`draft_${key}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setLastSaved(new Date(parsed.timestamp));
        return parsed.data;
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
    return null;
  }, [key]);

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      
      try {
        const draftData = {
          data,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(`draft_${key}`, JSON.stringify(draftData));
        setLastSaved(new Date());
        
        setTimeout(() => setIsSaving(false), 500);
      } catch (error) {
        console.error('Error saving draft:', error);
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay]);

  const clearDraft = () => {
    localStorage.removeItem(`draft_${key}`);
    setLastSaved(null);
  };

  const loadDraft = () => {
    const savedData = localStorage.getItem(`draft_${key}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return parsed.data;
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
    return null;
  };

  return {
    isSaving,
    lastSaved,
    clearDraft,
    loadDraft
  };
};