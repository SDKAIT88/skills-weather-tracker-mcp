import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

const databasePath = fileURLToPath(new URL('../weather.db', import.meta.url));
const database = new Database(databasePath);

// Insert a weather reading using the existing weather_logs schema.
export function insertWeatherLog(weather) {
  const statement = database.prepare(`
    INSERT INTO weather_logs (
      city, country, latitude, longitude, temperature_c,
      humidity, wind_kmh, condition, weather_code
    ) VALUES (
      @city, @country, @latitude, @longitude, @temperature_c,
      @humidity, @wind_kmh, @condition, @weather_code
    )
  `);

  return statement.run(weather);
}

// Return the most recent weather readings, bounded by the validated limit.
export function getRecentWeatherLogs(limit) {
  return database.prepare(`
    SELECT id, city, country, latitude, longitude, temperature_c,
           humidity, wind_kmh, condition, weather_code, created_at
    FROM weather_logs
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(limit);
}

// Aggregate temperature readings for a city without interpolating user input.
export function getCityStats(city) {
  return database.prepare(`
    SELECT MIN(temperature_c) AS minimum,
           MAX(temperature_c) AS maximum,
           AVG(temperature_c) AS average,
           COUNT(*) AS count
    FROM weather_logs
    WHERE city = ? COLLATE NOCASE
  `).get(city);
}