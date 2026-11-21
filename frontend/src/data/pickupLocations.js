// Building names verified against KMUTT's official campus map and shop directory.
// Google Maps resolves the building search; no guessed counter coordinates are used.
const buildings = {
  N10: { label: 'KMUTT Library · N10', query: 'KMUTT Library Bangkok Thailand', source: 'https://bgm.kmutt.ac.th/MapNavi/N10.html' },
  S2: { label: 'Car parking building · S2', query: 'Starbucks KMUTT', source: 'https://bgm.kmutt.ac.th/MapNavi/S2.html', note: 'S2 reference pin: Starbucks KMUTT. Follow your store’s pickup instructions inside the building.' },
};

export function getPickupLocation(pickupPoint, cafeName) {
  if (!pickupPoint?.trim() && !cafeName?.trim()) return null;
  // Use the order's saved pickup address before its current store name.
  const code = (pickupPoint?.trim() || cafeName)?.match(/\b(N10|S2)\b/i)?.[1]?.toUpperCase();
  const building = buildings[code];
  const query = building?.query ?? `${cafeName ?? ''} ${pickupPoint ?? ''} KMUTT Bangmod Bangkok Thailand`.trim();
  const params = new URLSearchParams({ q: query, z: '18', output: 'embed' });
  const directions = new URLSearchParams({ api: '1', destination: query, travelmode: 'walking' });
  return {
    label: building?.label ?? 'Pickup location search',
    building: Boolean(building),
    source: building?.source,
    note: building?.note,
    embedUrl: `https://maps.google.com/maps?${params}`,
    directionsUrl: `https://www.google.com/maps/dir/?${directions}`,
    searchUrl: `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`,
  };
}
