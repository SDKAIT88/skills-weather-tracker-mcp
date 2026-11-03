import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import {
  getRecentWeatherLogs,
  getWeatherSummary,
  insertWeatherLog
} from './db.js';
import { fetchCityWeather } from './weather.js';

const port = 3000;
const dashboardPath = fileURLToPath(new URL('../public/index.html', import.meta.url));

// Send a JSON response with the appropriate content type.
function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

// Serve the dashboard document.
function serveDashboard(response) {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  createReadStream(dashboardPath)
    .on('error', () => {
      if (!response.headersSent) {
        sendJson(response, 500, { error: 'Could not load the dashboard.' });
      } else {
        response.destroy();
      }
    })
    .pipe(response);
}

// Route dashboard and API requests.
async function handleRequest(request, response) {
  let url;
  try {
    url = new URL(request.url, 'http://localhost');
  } catch {
    sendJson(response, 400, { error: 'Invalid request URL.' });
    return;
  }

  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    serveDashboard(response);
    return;
  }

  try {
    if (request.method === 'GET' && url.pathname === '/api/logs') {
      sendJson(response, 200, getRecentWeatherLogs(50));
    } else if (request.method === 'GET' && url.pathname === '/api/summary') {
      sendJson(response, 200, getWeatherSummary());
    } else if (request.method === 'POST' && url.pathname === '/api/refresh') {
      const city = url.searchParams.get('city')?.trim();
      if (!city) {
        sendJson(response, 400, { error: 'Provide a city name in the city query parameter.' });
        return;
      }

      const weather = await fetchCityWeather(city);
      insertWeatherLog(weather);
      sendJson(response, 201, weather);
    } else {
      sendJson(response, 404, { error: 'Not found.' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    const statusCode = message.startsWith('No city named')
      ? 404
      : message.includes('Open-Meteo') || message.startsWith('Could not connect')
        ? 502
        : 500;
    sendJson(response, statusCode, { error: message });
  }
}

const server = createServer(handleRequest);

server.listen(port, '0.0.0.0', () => {
  console.log(`Weather dashboard available at http://localhost:${port}`);
});
