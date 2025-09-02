## Nova React SDK

A comprehensive, practical guide to integrating Nova into your React or React Native app. Start here, then follow the chapters in order.

### Who is this for?

- Frontend engineers integrating personalization and experimentation
- Teams adding runtime experience evaluation and analytics

### Prerequisites

- You have a Nova organisation and app IDs
- Nova Manager API is reachable (apiEndpoint)
- Basic React/TypeScript familiarity

### Syllabus

1. Installation: [installation.md](./installation.md)
2. Core concepts: [core-concepts.md](./core-concepts.md)
3. Provider setup: [provider.md](./provider.md)
4. User lifecycle (setUser, profiles): [user.md](./user.md)
5. Experiences (load/read/hooks): [experiences.md](./experiences.md)
6. Events tracking: [events.md](./events.md)
7. Registry design (objects/experiences): [registry.md](./registry.md)
8. Advanced patterns (prefetch, RN specifics): [advanced.md](./advanced.md)
9. Testing/mocking the SDK: [testing.md](./testing.md)
10. API reference (exports, types): [api.md](./api.md)
11. Troubleshooting/FAQ: [troubleshooting.md](./troubleshooting.md)

### Quickstart (10 min)

- Install: `npm i nova-react-sdk`
- Create `nova-objects.json` with at least one experience and object
- Wrap your app in `NovaProvider` with `organisationId`, `appId`, `apiEndpoint`
- Call `setUser({ userId, userProfile })` at startup
- Call `loadAllExperiences()` and render with `useNovaExperience("<experience>")`

Example

```tsx
import { NovaProvider } from "nova-react-sdk";
import NovaRegistry from "./nova-objects.json";

<NovaProvider
	config={{
		organisationId: process.env.NOVA_ORG_ID!,
		appId: process.env.NOVA_APP_ID!,
		apiEndpoint: process.env.NOVA_API_ENDPOINT!,
		registry: NovaRegistry,
	}}
>
	<App />
</NovaProvider>;
```
