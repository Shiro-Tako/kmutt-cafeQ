// แสดงแผนที่จุดรับตามร้านและลิงก์เปิด Google Maps
import { getPickupLocation } from '../../data/pickupLocations.js';

export default function PickupMap({ cafeName, pickupPoint }) {
  const location = getPickupLocation(pickupPoint, cafeName);
  if (!location) return null;
  return <section className="pickup-map" aria-label={`Pickup map for ${cafeName ?? 'your order'}`}>
    <div className="pickup-map-heading"><strong>{location.label}</strong><span>{location.building ? 'Building pickup' : 'Search location'}</span></div>
    <iframe key={location.embedUrl} src={location.embedUrl} title={`Map: ${location.label}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
    <p>{pickupPoint || cafeName}</p>
    <small>{location.note ?? (location.building ? 'The pin marks the building. Follow the store’s pickup instructions inside.' : 'Check the search result with the store before travelling.')}</small>
    <div className="pickup-map-links">
      <a className="primary" href={location.directionsUrl} target="_blank" rel="noopener noreferrer">Walking directions ↗</a>
      <a href={location.searchUrl} target="_blank" rel="noopener noreferrer">Open Google Maps ↗</a>
    </div>
    <small className="pickup-map-help">Map not loading? Use Open Google Maps above.</small>
  </section>;
}
