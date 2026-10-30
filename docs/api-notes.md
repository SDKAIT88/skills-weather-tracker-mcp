# Open-Meteo API Notes

## Geocoding

Endpoint:

```text
https://geocoding-api.open-meteo.com/v1/search?name=Pune&count=1
```

Fields used:

- `results[0].name` -> `city` (`Pune`)
- `results[0].country` -> `country` (`India`)
- `results[0].latitude` -> `latitude` (`18.51957`)
- `results[0].longitude` -> `longitude` (`73.85535`)

Trimmed response from the live request:

```json
{"results":[{"name":"Pune","latitude":18.51957,"longitude":73.85535,"country":"India"}]}
```

## Current Weather

Endpoint called with the geocoding coordinates:

```text
https://api.open-meteo.com/v1/forecast?latitude=18.51957&longitude=73.85535&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code
```

Fields used from `current`:

- `temperature_2m` -> `temperature_c`; unit: degrees Celsius (`°C`); value: `25.6`
- `relative_humidity_2m` -> `humidity`; unit: percent (`%`); value: `68`
- `wind_speed_10m` -> `wind_kmh`; unit: kilometers per hour (`km/h`); value: `10.6`
- `weather_code` -> `weather_code`; unit metadata: `wmo code`; value: `1`
- `time` -> observation time; ISO 8601; value: `2026-10-30T13:15`

Trimmed response from the live request:

```json
{"latitude":18.523726,"longitude":73.86876,"timezone":"GMT","current_units":{"time":"iso8601","interval":"seconds","temperature_2m":"°C","relative_humidity_2m":"%","wind_speed_10m":"km/h","weather_code":"wmo code"},"current":{"time":"2026-10-30T13:15","interval":900,"temperature_2m":25.6,"relative_humidity_2m":68,"wind_speed_10m":10.6,"weather_code":1}}
```

The forecast response reports its grid-cell coordinates, which differ slightly from the requested geocoding coordinates. `condition` is not a returned text field; the stored label `Mainly clear` is the WMO description for weather code `1`.
