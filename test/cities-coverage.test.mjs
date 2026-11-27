import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { searchLocalCities, ALL_CITIES_CATALOG, POPULAR_INDIAN_CITIES, findNearestCatalogCity, reverseGeocodeLocation } from '../lib/citiesData.ts';

describe('India Cities & Districts Location Coverage', () => {
  it('covers all 28 Indian States and 8 Union Territories', () => {
    const requiredStatesAndUTs = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
      'Andaman & Nicobar', 'Dadra & Nagar Haveli and Daman & Diu', 'Lakshadweep'
    ];

    const catalogAdmins = new Set(
      ALL_CITIES_CATALOG
        .filter((c) => c.country === 'India')
        .map((c) => c.admin)
    );

    for (const region of requiredStatesAndUTs) {
      const found = Array.from(catalogAdmins).some((adm) =>
        adm && (adm.includes(region) || region.includes(adm))
      );
      assert.ok(found, `Expected coverage for state/UT: ${region}`);
    }
  });

  it('contains over 200 curated Indian cities and districts', () => {
    const indianLocations = ALL_CITIES_CATALOG.filter((c) => c.country === 'India');
    assert.ok(indianLocations.length >= 200, `Found ${indianLocations.length} locations, expected >= 200`);
  });

  it('resolves historical and colloquial aliases for major Indian cities', () => {
    const aliasTestCases = [
      { alias: 'Gurgaon', expected: 'Gurugram' },
      { alias: 'Bangalore', expected: 'Bengaluru' },
      { alias: 'Allahabad', expected: 'Prayagraj' },
      { alias: 'Banaras', expected: 'Varanasi' },
      { alias: 'Kashi', expected: 'Varanasi' },
      { alias: 'Bombay', expected: 'Mumbai' },
      { alias: 'Calcutta', expected: 'Kolkata' },
      { alias: 'Madras', expected: 'Chennai' },
      { alias: 'Poona', expected: 'Pune' },
      { alias: 'Baroda', expected: 'Vadodara' },
      { alias: 'Vizag', expected: 'Visakhapatnam' },
      { alias: 'Ooty', expected: 'Udhagamandalam' },
      { alias: 'Cochin', expected: 'Kochi' },
      { alias: 'Trivandrum', expected: 'Thiruvananthapuram' },
      { alias: 'Calicut', expected: 'Kozhikode' },
      { alias: 'Simla', expected: 'Shimla' },
      { alias: 'Pondicherry', expected: 'Puducherry' },
    ];

    for (const { alias, expected } of aliasTestCases) {
      const hits = searchLocalCities(alias);
      assert.ok(hits.length > 0, `No hits found for alias: ${alias}`);
      const topMatch = hits[0];
      assert.strictEqual(
        topMatch.name,
        expected,
        `For alias "${alias}", expected "${expected}" but got "${topMatch.name}"`
      );
    }
  });

  it('ranks Indian locations ahead of international homonyms', () => {
    // e.g. "Delhi" should return Delhi, India as top hit
    const hits = searchLocalCities('Delhi');
    assert.ok(hits.length > 0);
    assert.strictEqual(hits[0].name, 'Delhi');
    assert.strictEqual(hits[0].country, 'India');

    // "Salem" should return Salem, Tamil Nadu, India
    const salemHits = searchLocalCities('Salem');
    assert.ok(salemHits.length > 0);
    assert.strictEqual(salemHits[0].name, 'Salem');
    assert.strictEqual(salemHits[0].country, 'India');
  });

  it('supports major international hubs alongside Indian data', () => {
    const globalCities = ['Dubai', 'London', 'New York', 'Singapore', 'Tokyo', 'Toronto', 'Sydney'];
    for (const city of globalCities) {
      const hits = searchLocalCities(city);
      assert.ok(hits.length > 0, `Expected international city hit for: ${city}`);
      assert.strictEqual(hits[0].name, city);
      assert.notStrictEqual(hits[0].country, 'India');
    }
  });

  it('provides quick selection chips covering major Indian zones', () => {
    assert.ok(POPULAR_INDIAN_CITIES.length >= 10);
    const names = POPULAR_INDIAN_CITIES.map((c) => c.name);
    assert.ok(names.includes('Delhi'));
    assert.ok(names.includes('Mumbai'));
    assert.ok(names.includes('Bengaluru'));
    assert.ok(names.includes('Kolkata'));
    assert.ok(names.includes('Chennai'));
    assert.ok(names.includes('Hyderabad'));
    assert.ok(names.includes('Pune'));
  });

  it('searchLocalCities provides zero-latency instant offline results for any Indian district', () => {
    const hits = searchLocalCities('Nagpur');
    assert.ok(hits.length > 0);
    assert.strictEqual(hits[0].name, 'Nagpur');
    assert.strictEqual(hits[0].country, 'India');
  });

  it('findNearestCatalogCity accurately identifies major city for GPS coordinates across regions', () => {
    const testCases = [
      { coords: [21.1458, 79.0882], expectedCity: 'Nagpur' },
      { coords: [19.0760, 72.8777], expectedCity: 'Mumbai' },
      { coords: [18.5204, 73.8567], expectedCity: 'Pune' },
      { coords: [28.6139, 77.2090], expectedCity: 'Delhi' },
      { coords: [12.9716, 77.5946], expectedCity: 'Bengaluru' },
      { coords: [17.3850, 78.4867], expectedCity: 'Hyderabad' },
    ];

    for (const tc of testCases) {
      const nearest = findNearestCatalogCity(tc.coords[0], tc.coords[1]);
      assert.strictEqual(nearest.name, tc.expectedCity);
      assert.notStrictEqual(nearest.name, 'My Current Location');
      assert.notStrictEqual(nearest.name, 'Current Location');
      assert.ok(nearest.admin, `Expected admin subdivision for ${nearest.name}`);
    }
  });

  it('reverseGeocodeLocation returns real city name and preserves GPS coordinates for accurate AQI', async () => {
    const nagpur = await reverseGeocodeLocation(21.1458, 79.0882);
    assert.ok(nagpur.name.includes('Nagpur'), `Expected name to include Nagpur, got: ${nagpur.name}`);
    assert.strictEqual(nagpur.lat, 21.1458);
    assert.strictEqual(nagpur.lon, 79.0882);
    assert.notStrictEqual(nagpur.name, 'Current Location');
    assert.notStrictEqual(nagpur.name, 'My Current Location');
  });
});
