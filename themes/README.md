# OTYA Player Themes

Themes are stored as JSON files here and served from Cloudflare R2 under the `themes/` prefix.

## Available Themes

| ID | Name | Mode | Accent |
|---|---|---|---|
| midnight-cyan | Midnight Cyan | Dark | Electric Cyan #00E5FF |
| solar-gold | Solar Gold | Dark | Gold #F59E0B |
| rose-noir | Rose Noir | Dark | Rose Pink #F472B6 |
| forest-green | Forest Green | Dark | Emerald #34D399 |
| arctic-white | Arctic White | Light | Sky Blue #0EA5E9 |
| deep-purple | Deep Purple | Dark | Violet #A78BFA |
| sunset-orange | Sunset Orange | Dark | Orange #FB923C |
| steel-blue | Steel Blue | Dark | Blue #3B82F6 |

## Upload to R2

```bash
# Upload a single theme
npx wrangler r2 object put otya-player-releases/themes/midnight-cyan.json --file themes/midnight-cyan.json

# Upload all themes at once
for f in themes/*.json; do
  name=$(basename $f)
  npx wrangler r2 object put otya-player-releases/themes/$name --file $f
done
```

## Set default theme in KV

```bash
npx wrangler kv key put --binding KV "config:theme" --path themes/midnight-cyan.json
```

## Set seasonal schedule in KV

```bash
npx wrangler kv key put --binding KV "config:seasonal-schedule" --path themes/seasonal-schedule.json
```

## Theme JSON Schema

```json
{
  "theme_identity": "Display name in app",
  "is_dark_mode": true,
  "google_font_family": "Inter",
  "card_border_radius": 20,
  "button_padding": 14,
  "colors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "scaffold_background": "#HEX",
    "surface": "#HEX",
    "accent": "#HEX",
    "error": "#HEX",
    "text_primary": "#HEX",
    "text_secondary": "#HEX"
  },
  "component_overrides": {
    "app_bar_background": "#HEX",
    "card_background": "#HEX",
    "nav_bar_selected": "#HEX",
    "button_text": "#HEX"
  },
  "announcement": {
    "show_dialog": false,
    "id": "",
    "title": "",
    "message": "",
    "button_text": "OK"
  }
}
```
