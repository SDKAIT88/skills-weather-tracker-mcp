const geocodingEndpoint = 'https://geocoding-api.open-meteo.com/v1/search';
const forecastEndpoint = 'https://api.open-meteo.com/v1/forecast';

const conditionByCode = new Map([
  [0, 'clear'], [1, 'clear'], [2, 'cloudy'], [3, 'cloudy'],
  [45, 'fog'], [48, 'fog'],
  [51, 'rain'], [53, 'rain'], [55, 'rain'], [56, 'rain'], [57, 'rain'],
  [61, 'rain'], [63, 'rain'], [65, 'rain'], [66, 'rain'], [67, 'rain'],
  [71, 'snow'], [73, 'snow'], [75, 'snow'], [77, 'snow'],
  [80, 'rain'], [81, 'rain'], [82, 'rain'], [85, 'snow'], [86, 'snow'],
  [95, 'thunderstorm'], [96, 'thunderstorm'], [99, 'thunderstorm']
]);

// Fetch JSON with friendly errors for HTTP failures and network problems.
async function fetchJson(url, description) {
  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(`Could not connect to Open-Meteo while requesting ${description}. Check your network connection and try again.`);
  }

  if (!response.ok) {
    throw new Error(`Open-Meteo returned HTTP ${response.status} while requesting ${description}.`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`Open-Meteo returned an invalid response while requesting ${description}.`);
  }
}

// Resolve a city and return its current weather in the database's field format.
export async function fetchCityWeather(city) {
  const geocodingUrl = new URL(geocodingEndpoint);
  geocodingUrl.search = new URLSearchParams({ name: city, count: '1' });
  const geocoding = await fetchJson(geocodingUrl, `the location for "${city}"`);
  const place = geocoding.results?.[0];

  if (!place) {
    throw new Error(`No city named "${city}" was found. Check the spelling and try again.`);
  }

  const forecastUrl = new URL(forecastEndpoint);
  forecastUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'
  });
  const forecast = await fetchJson(forecastUrl, `current weather for ${place.name}`);
  const current = forecast.current;

  if (!current) {
    throw new Error(`Open-Meteo did not return current weather for ${place.name}.`);
  }

  return {
    city: place.name,
    country: place.country ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
    temperature_c: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    wind_kmh: current.wind_speed_10m,
    condition: conditionByCode.get(current.weather_code) ?? 'unknown',
    weather_code: current.weather_code
  };
}