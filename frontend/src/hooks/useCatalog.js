import { useEffect, useState } from 'react';
import { menu as initialMenu } from '../data/menu.js';
import { demoCafes, fetchCafes, fetchMenuItems, toMenuItem } from '../services/catalog.js';
import { sessionEnabled } from '../services/auth.js';

export function useCatalog(demoMenu) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setRevision((value) => value + 1), 5000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetchCafes(controller.signal), fetchMenuItems({}, controller.signal)])
      .then(([cafes, rows]) => {
        if (!controller.signal.aborted) {
          setResponse({ cafes, menu: rows.map((row) => toMenuItem(row, cafes)) });
          setError('');
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [revision]);

  const overrides = demoMenu.filter((item) => {
    const original = initialMenu.find((entry) => entry.id === item.id);
    return !original || Object.keys(item).some((key) => item[key] !== original[key]);
  });
  const menu = response
    ? [...response.menu.filter((item) => sessionEnabled || !overrides.some(({ id }) => id === item.id)), ...(sessionEnabled ? [] : overrides)]
    : sessionEnabled ? [] : demoMenu;
  return {
    cafes: response?.cafes ?? demoCafes,
    menu,
    overrides: sessionEnabled ? [] : overrides,
    loading: !response && !error,
    error,
    refresh: () => setRevision((value) => value + 1),
    getItem: (id) => menu.find((item) => item.id === id) ?? (!sessionEnabled ? demoMenu.find((item) => item.id === id) : undefined),
  };
}
