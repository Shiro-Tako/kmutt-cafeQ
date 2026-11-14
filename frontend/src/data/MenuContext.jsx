import { createContext, useContext } from 'react';

export const MenuContext = createContext(null);

export function useMenu() {
  return useContext(MenuContext);
}
