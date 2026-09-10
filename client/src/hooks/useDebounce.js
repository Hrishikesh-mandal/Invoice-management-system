import { useState, useEffect } from 'react';

// Delays updating the returned value until the input has stopped changing
// for `delay` ms — used so the search box doesn't fire an API call on
// every keystroke.
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}