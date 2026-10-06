import { useState, useEffect } from 'react';

export function useSearch(delay = 300) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(inputValue), delay);
    return () => clearTimeout(timer);
  }, [inputValue, delay]);

  return { search: debouncedValue, inputValue, setInputValue };
}
