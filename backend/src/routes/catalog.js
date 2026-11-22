import { Router } from 'express';
import { createMenuItem, deleteMenuItem, getCafes, getMenuItem, getMenuItems, patchMenuItem, validateStaffCafe } from '../controllers/catalog.js';

function staffAuthUnavailable(_request, response) {
  response.status(503).json({ error: { code: 'STAFF_AUTH_UNAVAILABLE', message: 'Staff sign-in is not connected yet.' } });
}

export function createCatalogRouter(requireStaffCafe = staffAuthUnavailable) {
  const router = Router();
  const staffMenu = '/staff/cafes/:cafeId/menu-items';

  router.get('/cafes', getCafes);
  // คำขออ่านเมนูส่งต่อให้ getMenuItems ใน controller
  router.get('/menu-items', getMenuItems);
  router.get('/menu-items/:id', getMenuItem);
  router.post(staffMenu, validateStaffCafe, requireStaffCafe, createMenuItem);
  router.patch(`${staffMenu}/:id`, validateStaffCafe, requireStaffCafe, patchMenuItem);
  router.delete(`${staffMenu}/:id`, validateStaffCafe, requireStaffCafe, deleteMenuItem);
  router.use((error, _request, response, next) => {
    if (process.env.CATALOG_SOURCE !== 'mysql') return next(error);
    response.status(503).json({ error: { code: 'CATALOG_UNAVAILABLE', message: 'Catalog data is unavailable.' } });
  });
  return router;
}

export default createCatalogRouter();
