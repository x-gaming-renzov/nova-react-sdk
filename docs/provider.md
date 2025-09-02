## Provider setup

Wrap your app with `NovaProvider` and pass configuration.

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

Config fields

- `organisationId`: string UUID
- `appId`: string UUID
- `apiEndpoint`: Nova Manager base URL
- `registry`: your objects/experiences definition

React Native

- Pass your config constants (no process.env in RN by default)
- Ensure `apiEndpoint` is reachable from device/emulator

SSR (Next.js) note

- Provider can be used client-side; avoid server-side evaluation. Call `setUser` and loads in client components or use dynamic imports.

Validation tips

- Log the provider config once in dev to confirm values
- Handle missing envs by rendering a setup screen
