## Nova React SDK

A React/React Native SDK for integrating Nova personalization, feature flags, and analytics into your app.

### What it does

1. **Identify users** — register users and their profile attributes with Nova
2. **Evaluate experiences** — get personalised feature configs (flags, A/B variants, content) for each user
3. **Track events** — send analytics events back to Nova (batched automatically)

### Install

```bash
npm install nova-react-sdk
# or
yarn add nova-react-sdk
```

Peer dependencies: `react >= 16.8`

### Quickstart

```tsx
import { NovaProvider, useNova, useNovaExperience } from "nova-react-sdk";
import registry from "./nova-objects.json";

function App() {
  return (
    <NovaProvider
      config={{
        apiKey: "nova_sk_...",
        apiEndpoint: "https://your-api.example.com",
        registry,
      }}
    >
      <Main />
    </NovaProvider>
  );
}

function Main() {
  const { setUser } = useNova();

  useEffect(() => {
    setUser({ userId: "user-123", userProfile: { country: "KR" } });
  }, []);

  return <LandingScreen />;
}

function LandingScreen() {
  const { objects, loaded, load } = useNovaExperience("landing");

  useEffect(() => {
    if (!loaded) load();
  }, [loaded]);

  return <Text>{objects?.hero_banner?.title ?? "Welcome"}</Text>;
}
```

### Docs

1. [Core concepts and provider setup](./core-concepts.md)
2. [User lifecycle](./user.md)
3. [Experiences (loading and reading)](./experiences.md)
4. [Event tracking](./events.md)
5. [Registry design](./registry.md)
6. [API reference](./api.md)
7. [Testing](./testing.md)
8. [Troubleshooting](./troubleshooting.md)
