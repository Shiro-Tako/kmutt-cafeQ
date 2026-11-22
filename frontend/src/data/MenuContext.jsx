// ให้แต่ละหน้าเข้าถึงข้อมูลที่ App แชร์ เช่น เมนู ตะกร้า และบัญชี
import { createContext, useContext } from 'react';

export const MenuContext = createContext(null);

export function useMenu() {
  return useContext(MenuContext);
}
