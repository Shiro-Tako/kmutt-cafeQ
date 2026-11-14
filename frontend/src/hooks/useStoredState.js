import { useEffect, useState } from 'react';

export default function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The preview can still be used when browser storage is unavailable.
    }
  }, [key, value]);

  return [value, setValue];
}
