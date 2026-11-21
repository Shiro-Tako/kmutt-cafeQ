# Pickup maps

Checkout shows a Google Maps embed and links to walking directions and the full map. Customer order history mounts the same map when **Details** is expanded. Maps are lazy-loaded and do not block ordering; an external map link remains usable if an iframe is blocked by a browser or network.

Building names use the [official KMUTT campus map](https://bgm.kmutt.ac.th/MapNavi/MAPNAVI.html) and [coffee-shop directory](https://bpuu.kmutt.ac.th/coffee-shop/):

- N10: KMUTT Library, for the library Café Amazon and Fresh Me.
- S2: Car parking building, for Inthanin, KAMU KAMU and Starbucks. The building search did not resolve reliably, so its map uses the verified visible Starbucks KMUTT landmark pin inside S2. The UI explicitly labels this reference point; it does not claim all three counters are the same place.

The embedded map resolves the building name through Google Maps. It marks the building, not a surveyed indoor counter. The pickup text provides the floor/counter information. Custom pickup addresses use a clearly labeled location search instead of pretending to have verified coordinates. No user GPS position is requested by CafeQ.

`frontend/src/data/pickupLocations.js` holds the building queries. `PickupMap.jsx` renders the responsive embed. `toDisplayOrder()` preserves `pickupPoint` from the order API so history uses the address saved at checkout rather than replacing it with a store's current address. Older preview orders without an address fall back to the current store pickup text.

The map and external directions use public URLs, with no new API key, database schema or routing API integration. External directions follow [Google Maps URL syntax](https://developers.google.com/maps/documentation/urls/get-started). Internet access to Google Maps is needed to display its map.

Run `node --test frontend/src/data/pickupLocations.test.js` for destination selection and address snapshot checks, then `npm.cmd --prefix frontend run build`. In the browser, verify N10 and S2 on checkout, then expand/collapse an order's Details and check both map links on mobile and desktop.
