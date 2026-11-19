function positiveId(value) {
  const id = Number(value);
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) ? id : null;
}

function invalidMenuItemId(response) {
  return response.status(400).json({
    error: { code: 'INVALID_MENU_ITEM_ID', message: 'Use a positive menu item ID.' },
  });
}

export function createFavoritesController(repository) {
  return {
    async getFavorites(request, response) {
      response.json({ items: await repository.listForUser(request.user.userId) });
    },

    async addFavorite(request, response) {
      const menuItemId = positiveId(request.params.menuItemId);
      if (menuItemId === null) return invalidMenuItemId(response);

      const result = await repository.addForUser(request.user.userId, menuItemId);
      if (result === 'not_found') {
        return response.status(404).json({
          error: { code: 'MENU_ITEM_NOT_FOUND', message: 'Menu item not found.' },
        });
      }
      if (result === 'unavailable') {
        return response.status(409).json({
          error: { code: 'ITEM_UNAVAILABLE', message: 'This menu item is not available.' },
        });
      }
      response.status(204).end();
    },

    async removeFavorite(request, response) {
      const menuItemId = positiveId(request.params.menuItemId);
      if (menuItemId === null) return invalidMenuItemId(response);
      await repository.removeForUser(request.user.userId, menuItemId);
      response.status(204).end();
    },
  };
}
