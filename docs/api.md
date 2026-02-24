## API reference

### Exports

```ts
// Provider and context
export { NovaProvider, NovaContext };

// Hooks
export { useNova, useNovaExperience, useNovaInit };

// Types
export type {
  NovaConfig,
  NovaEventBatchConfig,
  NovaUser,
  SetNovaUser,
  UserProfile,
  NovaObject,
  NovaObjectConfig,
  NovaExperience,
  NovaExperiences,
  NovaState,
  NovaContextValue,
};
```

### NovaConfig

```ts
interface NovaConfig {
  apiKey: string;
  apiEndpoint: string;
  eventBatch?: NovaEventBatchConfig;
  registry: {
    objects: {
      [objectName: string]: {
        type: string;
        keys: {
          [keyName: string]: {
            type: string;
            description: string;
            default: any;
          };
        };
      };
    };
    experiences: {
      [experienceName: string]: {
        description: string;
        objects: { [objectName: string]: boolean };
      };
    };
  };
}
```

### NovaEventBatchConfig

```ts
interface NovaEventBatchConfig {
  maxSize?: number;       // flush at this queue size (default: 10)
  flushInterval?: number; // flush interval in ms (default: 5000)
}
```

### NovaUser

```ts
interface NovaUser {
  userId: string;
  userProfile: Record<string, any>;
  novaUserId?: string; // internal UUID, for debugging only
}
```

### Context methods (via `useNova()`)

| Method | Signature | Description |
|--------|-----------|-------------|
| `setUser` | `(user: SetNovaUser) => Promise<void>` | Register user with backend, store in state |
| `updateUserProfile` | `(profile: UserProfile) => Promise<void>` | Merge new profile fields, sync to backend |
| `loadExperience` | `(name: string) => Promise<void>` | Fetch one experience from backend |
| `loadExperiences` | `(names: string[] \| null) => Promise<void>` | Fetch multiple, or all if `null` |
| `loadAllExperiences` | `() => Promise<void>` | Shortcut for `loadExperiences(null)` |
| `isExperienceLoaded` | `(name: string) => boolean` | Check if server data has been fetched |
| `readExperience` | `<T>(name: string) => T \| null` | Read current config values from state |
| `getExperience` | `<T>(name: string) => Promise<T \| null>` | Load-if-needed, then read |
| `trackEvent` | `(name: string, data?: Record<string, any>) => void` | Queue an analytics event (sync, no HTTP) |
| `flushEvents` | `() => Promise<void>` | Force-send all queued events |
| `setLoading` | `(loading: boolean) => void` | Manually set loading state |
| `setError` | `(error: string \| null) => void` | Manually set error state |

### useNovaExperience<T>(experienceName: string)

```ts
{
  objects: T | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  get: () => Promise<void>;
}
```

- `objects` — always available (defaults before load, server values after)
- `loaded` — `false` until server call completes for this experience
- `load` — triggers an API call
- `get` — loads only if not already loaded

### useNovaInit()

```ts
{
  isReady: boolean;
  loading: boolean;
  error: string | null;
}
```

Calls `loadAllExperiences()` on mount. `isReady` is `true` when experiences are populated.

### NovaState

```ts
interface NovaState {
  config: NovaConfig;
  user: NovaUser | null;
  isLoading: boolean;
  error: string | null;
  experiences: {
    [experienceName: string]: {
      personalisationName: string | null;
      objects: {
        [objectName: string]: {
          config: Record<string, any>;
          variantName: string | null;
        };
      };
      evaluationReason: string | null;
      isLoaded: boolean;
      lastFetched?: Date;
    };
  };
}
```
