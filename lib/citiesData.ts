import type { CityLocation } from '../types';

export interface ExtendedCityLocation extends CityLocation {
  aliases?: string[];
  isMetro?: boolean;
}

// Popular Indian Cities for quick selection chips
export const POPULAR_INDIAN_CITIES: CityLocation[] = [
  { name: 'Delhi', lat: 28.6139, lon: 77.2090, admin: 'Delhi', country: 'India' },
  { name: 'Noida', lat: 28.5355, lon: 77.3910, admin: 'Uttar Pradesh', country: 'India' },
  { name: 'Gurugram', lat: 28.4595, lon: 77.0266, admin: 'Haryana', country: 'India' },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, admin: 'Maharashtra', country: 'India' },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, admin: 'Karnataka', country: 'India' },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, admin: 'West Bengal', country: 'India' },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, admin: 'Tamil Nadu', country: 'India' },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, admin: 'Telangana', country: 'India' },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, admin: 'Maharashtra', country: 'India' },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, admin: 'Gujarat', country: 'India' },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462, admin: 'Uttar Pradesh', country: 'India' },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873, admin: 'Rajasthan', country: 'India' },
  { name: 'Patna', lat: 25.5941, lon: 85.1376, admin: 'Bihar', country: 'India' },
  { name: 'Chandigarh', lat: 30.7333, lon: 76.7794, admin: 'Punjab / Chandigarh', country: 'India' },
  { name: 'Kochi', lat: 9.9312, lon: 76.2673, admin: 'Kerala', country: 'India' },
  { name: 'Guwahati', lat: 26.1445, lon: 91.7362, admin: 'Assam', country: 'India' },
];

// Comprehensive database of Indian districts, major cities, and key global hubs
import rawCities from '../data/cities.json';
export const ALL_CITIES_CATALOG: ExtendedCityLocation[] = rawCities as ExtendedCityLocation[];

/**
 * Searches the curated offline-first catalog of Indian districts and cities
 * with alias matching, state-level matching, and smart score ranking.
 */
export function searchLocalCities(query: string, limit = 10): CityLocation[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored: { item: ExtendedCityLocation; score: number }[] = [];

  for (const city of ALL_CITIES_CATALOG) {
    const nameLower = city.name.toLowerCase();
    const adminLower = (city.admin || '').toLowerCase();
    const isIndia = (city.country || '').toLowerCase() === 'india';
    let score = 0;

    // Exact matches
    if (nameLower === q) {
      score = 100;
    } else if (city.aliases && city.aliases.some((a) => a.toLowerCase() === q)) {
      score = 95; // Exact alias match (e.g. 'Kashi' -> Varanasi, 'Gurgaon' -> Gurugram, 'Bombay' -> Mumbai)
    } else if (nameLower.startsWith(q)) {
      score = 80;
    } else if (city.aliases && city.aliases.some((a) => a.toLowerCase().startsWith(q))) {
      score = 70;
    } else if (nameLower.includes(q)) {
      score = 60;
    } else if (city.aliases && city.aliases.some((a) => a.toLowerCase().includes(q))) {
      score = 50;
    } else if (adminLower.startsWith(q)) {
      score = 40;
    } else if (adminLower.includes(q)) {
      score = 30;
    }

    if (score > 0) {
      // Prioritize Indian locations for Indian users
      if (isIndia) score += 25;
      scored.push({ item: city, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ item }) => ({
    name: item.name,
    lat: item.lat,
    lon: item.lon,
    admin: item.admin,
    country: item.country,
  }));
}

/**
 * Find the nearest city in our offline catalog using great-circle distance (Haversine formula).
 */
export function findNearestCatalogCity(lat: number, lon: number): CityLocation {
  let nearest: ExtendedCityLocation = ALL_CITIES_CATALOG[0];
  let minDistance = Infinity;

  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  for (const c of ALL_CITIES_CATALOG) {
    const dLat = toRad(c.lat - lat);
    const dLon = toRad(c.lon - lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(c.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const d = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    if (d < minDistance) {
      minDistance = d;
      nearest = c;
    }
  }

  return {
    name: nearest.name,
    lat: nearest.lat,
    lon: nearest.lon,
    admin: nearest.admin,
    country: nearest.country,
  };
}

/**
 * Reverse geocode coordinates to a human-readable city and state/admin location.
 * Fast remote reverse geocoder with instant offline catalog fallback.
 */
export async function reverseGeocodeLocation(lat: number, lon: number): Promise<CityLocation> {
  const nearest = findNearestCatalogCity(lat, lon);

  // 1. Try public reverse geocoder with a 2-second timeout
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const rawCity = data.city || '';
      const rawAdmin = data.principalSubdivision || nearest.admin || '';
      const country = data.countryName || nearest.country || 'India';

      // If a specific, recognized city name is returned, use it
      if (
        rawCity &&
        !rawCity.toLowerCase().includes('unnamed') &&
        !rawCity.toLowerCase().includes('location') &&
        !rawCity.toLowerCase().includes('unknown')
      ) {
        const displayName =
          rawAdmin && !rawCity.toLowerCase().includes(rawAdmin.toLowerCase())
            ? `${rawCity}, ${rawAdmin}`
            : rawCity;
        return {
          name: displayName,
          lat,
          lon,
          admin: rawAdmin,
          country,
        };
      }
    }
  } catch (err) {
    // Fall through to offline catalog fallback
  }

  // 2. Offline fallback: nearest catalog city with exact coordinates preserved
  const displayName =
    nearest.admin && !nearest.name.toLowerCase().includes(nearest.admin.toLowerCase())
      ? `${nearest.name}, ${nearest.admin}`
      : nearest.name;

  return {
    name: displayName,
    lat,
    lon,
    admin: nearest.admin,
    country: nearest.country || 'India',
  };
}
