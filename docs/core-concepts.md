## Core concepts and provider setup

### Key terms

**Experience** — a named container (e.g. `"onboarding_flow"`, `"landing"`). Each experience gets assigned a personalisation by the backend based on the user's profile. An experience groups one or more objects.

**Object** — a configurable unit inside an experience (e.g. `"hero_banner"`, `"ui_theme"`). Each object has typed keys with defaults. After evaluation, the backend may override these with variant-specific values.

**Registry** — a JSON blob you define in your app that declares all objects and experiences with their default values. The SDK uses this to render immediately (no loading spinner) before the backend responds.

**User profile** — key-value attributes about the user (`country`, `plan`, `ltv`, etc.). The backend uses these to evaluate segment rules and assign personalisations.

### How evaluation works

1. You define objects and experiences in your registry JSON (with defaults)
2. On app start, the SDK populates state with those defaults — UI renders instantly
3. You call `setUser` to register the user with Nova
4. You call `loadExperience(s)` — the backend evaluates rules against the user's profile
5. Server values merge into state, replacing defaults where applicable
6. Components re-render with the personalised values

### Authentication

All API calls use an **SDK API key** (`nova_sk_...`). The backend extracts your organisation and app IDs from the key using HMAC — no database lookup, sub-millisecond auth.

You never need to pass `organisationId` or `appId` anywhere. The API key carries that information.

### Provider setup

Wrap your app with `NovaProvider`:

```tsx
import { NovaProvider } from "nova-react-sdk";
import registry from "./nova-objects.json";

<NovaProvider
  config={{
    apiKey: "nova_sk_...",
    apiEndpoint: "https://your-api.example.com",
    registry,
  }}
>
  <App />
</NovaProvider>
```

Config fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiKey` | `string` | yes | Your SDK API key (`nova_sk_...`) |
| `apiEndpoint` | `string` | yes | Nova Manager base URL |
| `registry` | `object` | yes | Objects and experiences definition (see [registry.md](./registry.md)) |
| `eventBatch` | `object` | no | Tune event batching (see [events.md](./events.md)) |

### React Native

- Pass config values directly (no `process.env` in RN by default)
- Make sure `apiEndpoint` is reachable from the device/emulator (use LAN IP for local dev)

### Next.js / SSR

- Use `NovaProvider` in client components only
- Call `setUser` and `loadExperience(s)` inside `useEffect`, not during server render
