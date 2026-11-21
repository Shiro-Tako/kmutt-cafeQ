import test from 'node:test';
import assert from 'node:assert/strict';
import { getPickupLocation } from './pickupLocations.js';

test('library and car park pickups resolve to distinct building destinations', () => {
  const library = getPickupLocation('KMUTT Bangmod, Library building N10, floor 1', 'Fresh Me');
  const parking = getPickupLocation('KMUTT Bangmod, Car parking building S2', 'KAMU KAMU');
  assert.notEqual(library.embedUrl, parking.embedUrl);
  assert.match(library.label, /N10/);
  assert.match(parking.label, /S2/);
  for (const place of [library, parking]) {
    const directions = new URL(place.directionsUrl);
    assert.equal(directions.searchParams.get('api'), '1');
    assert.equal(directions.searchParams.get('travelmode'), 'walking');
    assert.equal(directions.searchParams.get('destination'), new URL(place.embedUrl).searchParams.get('q'));
  }
});

test('saved pickup location takes priority over a renamed or relocated cafe', () => {
  assert.match(getPickupLocation('Library N10', 'New store at S2').label, /N10/);
  const unknown = getPickupLocation('New pickup counter, Building 99', 'Old cafe N10');
  assert.equal(unknown.building, false);
  assert.equal(getPickupLocation('', ''), null);
  assert.equal(getPickupLocation('An address & side entrance', 'Store').building, false);
  assert.match(new URL(unknown.searchUrl).searchParams.get('query'), /Building 99/);
});
