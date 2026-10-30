import {
  getCityStats,
  getRecentWeatherLogs,
  insertWeatherLog
} from './db.js';
import { fetchCityWeather } from './weather.js';

// Print the supported commands and their arguments.
function printUsage() {
  console.log('Usage:');
  console.log('  node src/cli.js add "<city>"');
  console.log('  node src/cli.js list [--limit N]');
  console.log('  node src/cli.js stats "<city>"');
}

// Format values into a compact text table with aligned columns.
function printTable(rows, columns) {
  const widths = columns.map(({ heading, key }) => Math.max(
    heading.length,
    ...rows.map((row) => String(row[key] ?? '').length)
  ));
  const formatRow = (values) => values
    .map((value, index) => String(value ?? '').padEnd(widths[index]))
    .join('  ');

  console.log(formatRow(columns.map(({ heading }) => heading)));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) {
    console.log(formatRow(columns.map(({ key }) => row[key])));
  }
}

// Parse the optional list limit and reject malformed values.
function parseLimit(args) {
  if (args.length === 0) {
    return 10;
  }

  if (args.length !== 2 || args[0] !== '--limit') {
    throw new Error('Use --limit followed by a positive whole number.');
  }

  const limit = Number(args[1]);
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('The list limit must be a positive whole number.');
  }

  return limit;
}

// Add a live weather reading for the requested city.
async function addCity(args) {
  const city = args.join(' ').trim();
  if (!city) {
    throw new Error('Provide a city name.');
  }

  const weather = await fetchCityWeather(city);
  insertWeatherLog(weather);
  console.log(`Logged ${weather.city}, ${weather.country}: ${weather.temperature_c} °C, ${weather.condition}.`);
}

// Display recent weather readings as a formatted table.
function listWeather(args) {
  const rows = getRecentWeatherLogs(parseLimit(args)).map((row) => ({
    ...row,
    created_at: row.created_at.slice(0, 10)
  }));
  if (rows.length === 0) {
    console.log('No weather logs yet. Add a city first.');
    return;
  }

  printTable(rows, [
    { heading: 'ID', key: 'id' },
    { heading: 'CITY', key: 'city' },
    { heading: 'COUNTRY', key: 'country' },
    { heading: 'TEMP', key: 'temperature_c' },
    { heading: 'HUM%', key: 'humidity' },
    { heading: 'WIND', key: 'wind_kmh' },
    { heading: 'CONDITION', key: 'condition' },
    { heading: 'DATE', key: 'created_at' }
  ]);
}

// Display temperature aggregates for the requested city.
function showStats(args) {
  const city = args.join(' ').trim();
  if (!city) {
    throw new Error('Provide a city name.');
  }

  const stats = getCityStats(city);
  if (stats.count === 0) {
    console.log(`No weather logs found for "${city}".`);
    return;
  }

  console.log(`Temperature stats for ${city}:`);
  console.log(`  Minimum: ${stats.minimum.toFixed(1)} °C`);
  console.log(`  Maximum: ${stats.maximum.toFixed(1)} °C`);
  console.log(`  Average: ${stats.average.toFixed(1)} °C`);
  console.log(`  Logs:    ${stats.count}`);
}

// Dispatch a CLI command and convert expected failures into friendly messages.
async function main() {
  const [command, ...args] = process.argv.slice(2);

  try {
    if (command === 'add') {
      await addCity(args);
    } else if (command === 'list') {
      listWeather(args);
    } else if (command === 'stats') {
      showStats(args);
    } else {
      printUsage();
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

await main();