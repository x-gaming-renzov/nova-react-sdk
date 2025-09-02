## SDK API reference

Exports

```ts
// Provider and context
export { NovaProvider, NovaContext };

// Hooks
export { useNova, useNovaExperience, useNovaInit };

// Types
export type {
	NovaConfig,
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

Config

```ts
interface NovaConfig {
	organisationId: string;
	appId: string;
	apiEndpoint: string;
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

Context methods (via `useNova`)

- `setUser(user: { userId: string; userProfile: Record<string, any> }) => Promise<void>`
  - Creates/updates a user; stores Nova user id internally.
- `updateUserProfile(userProfile: Record<string, any>) => Promise<void>`
  - Merges locally; persists to backend.
- `loadExperience(name: string) => Promise<void>`
  - Loads a single experience; merges overrides into state.
- `loadExperiences(names: string[] | null) => Promise<void>`
  - Loads selected or all experiences if `null`.
- `loadAllExperiences() => Promise<void>`
- `isExperienceLoaded(name: string) => boolean`
- `readExperience<T>(name: string) => T | null`
  - Returns current configs without triggering a load.
- `getExperience<T>(name: string) => Promise<T | null>`
  - Loads if needed, then returns configs.
- `trackEvent(eventName: string, eventData?: Record<string, any>) => Promise<void>`
  - Sends an analytics event with current Nova user id.

Hook: `useNovaExperience<T>(experienceName: string)`
Returns

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

Hook: `useNovaInit()`

- `{ isReady, loading, error }` — convenience for boot flows.
