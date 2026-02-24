## Registry

The registry is a JSON definition of your objects and experiences. It serves two purposes:

1. **Defaults** — the SDK renders these values immediately on mount, before any API call
2. **Schema** — declares what objects exist, what keys they have, and their types

### Structure

```json
{
  "objects": {
    "hero_banner": {
      "type": "content",
      "keys": {
        "title": {
          "type": "string",
          "description": "Main heading text",
          "default": "Welcome"
        },
        "show_cta": {
          "type": "boolean",
          "description": "Show call-to-action button",
          "default": true
        },
        "cta_color": {
          "type": "string",
          "description": "CTA button color",
          "default": "#000000"
        }
      }
    },
    "ui_theme": {
      "type": "ui",
      "keys": {
        "text_color": {
          "type": "string",
          "description": "Primary text color",
          "default": "#222222"
        },
        "accent_color": {
          "type": "string",
          "description": "Accent color",
          "default": "#ff6b6b"
        },
        "card_radius": {
          "type": "number",
          "description": "Card border radius",
          "default": 16
        }
      }
    }
  },
  "experiences": {
    "landing": {
      "description": "Landing screen experience",
      "objects": {
        "hero_banner": true,
        "ui_theme": true
      }
    },
    "theme": {
      "description": "Global theme",
      "objects": {
        "ui_theme": true
      }
    }
  }
}
```

### Objects

Each object has:
- `type` — a label for categorization (e.g. `"ui"`, `"content"`, `"feature"`)
- `keys` — the configurable values, each with `type`, `description`, and `default`

The `default` value is what the SDK uses before the backend responds. Pick sensible defaults that make the UI functional.

### Experiences

Each experience has:
- `description` — what this experience controls
- `objects` — map of object names to `true` (included) or `false` (excluded)

### Guidelines

- Keep object names stable — changing them breaks lookups
- Give every key a safe default that renders a functional UI
- Split experiences by page or feature, not one giant catch-all
- Keep the registry in a separate JSON file (e.g. `nova-objects.json`) and import it

### Syncing registry to backend

The sync CLI reads your `nova-objects.json` and creates/updates objects and experiences in the Nova dashboard:

```bash
# Set environment variables
export NOVA_API_KEY="nova_sk_..."
export NOVA_API_ENDPOINT="https://your-api.example.com"
export NOVA_ORG_ID="your-org-id"
export NOVA_APP_ID="your-app-id"

# Run sync
npm run nova:sync
```

Or via npx from a project that depends on nova-react-sdk:

```bash
npx nova-sync
```

The sync calls `POST /api/v1/feature-flags/sync-nova-objects/` with your full registry.
