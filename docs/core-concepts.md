## Core concepts

### Organisation and App

All API calls require `organisationId` and `appId`. These identify the tenant and product/workspace.

### Registry

A JSON definition of your UI objects and experiences. The SDK consumes this to compute safe defaults before network calls.

Example objects

```json
{
	"objects": {
		"ui-theme": {
			"type": "ui",
			"keys": {
				"text_color": {
					"type": "string",
					"description": "Primary text color",
					"default": "#222"
				},
				"accent_color": {
					"type": "string",
					"description": "Accent color",
					"default": "#ff6b6b"
				}
			}
		}
	}
}
```

### User and Profile

Your external `userId` plus a flexible `userProfile` (key-value). Rules like segments and personalisations are evaluated against these attributes.

### Experience

A named context (e.g., `landing`, `theme`). Each experience references one or more objects.

### Object

A named configurable unit (e.g., `ui-theme`). Contains typed keys with defaults. After evaluation, the SDK merges server-provided overrides over these defaults.

### Evaluation

- `setUser` registers/updates the user.
- `loadExperience(s)` asks backend for personalised variants.
- `useNovaExperience` exposes evaluated object configs to your components.

Mapping to SDK

- Provider config: `organisationId`, `appId`, `apiEndpoint`, `registry`
- `setUser({ userId, userProfile })`
- `loadExperience("landing")` or `loadAllExperiences()`
- `useNovaExperience("landing")`
- `trackEvent("EventName", { ... })`
