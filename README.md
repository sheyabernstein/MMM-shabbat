# MMM-shabat
Shabbat times for MagicMirror<sup>2</sup> made possible by the awesome [Hebcal API](https://www.hebcal.com/home/developer-apis) with optional functionality to hide all modules on shabbat.

## Dependencies
  * An installation of [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror)

## Installation
 1. Clone this repo into `~/MagicMirror/modules` directory.
 2. Configure your `~/MagicMirror/config/config.js`:
 
     ```
     {
         module: 'MMM-shabbat',
         position: 'top_left',
         config: {
                // See 'Configuration options' for more information.
            }
     }
     ```

## Configuration Options
| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `observe` | `true` | Hide all modules on shabbat
| `minutesBefore` | `18` | Candle-lighting time minutes before sunset |
| `minutesAfter` | `50` | Havdalah time minutes after sundown |
| `ashkenaz` | `true` | use Sephardic (`false`) or Ashkenazis transliterations (`true`) |
| `latitude` | | [-90 to 90] – latitude in decimal format (e.g. `31.76904` or `-23.5475`) |
| `longitude` | | [-180 to 180] – longitude decimal format (e.g. `35.21633` or `-46.63611`) |
| `tzid` | | TimezoneIdentifier (See [List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)) |
| `updateInterval` | `60 * 60 * 1000` | Time in ms to wait until updating |
| `retryDelay` | `2500` | Time in ms to wait before retry |