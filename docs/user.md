## User lifecycle

Set the current user (map your external id to Nova) and store a Nova user id for evaluation and events.

Basic usage

```tsx
import { useNova } from "nova-react-sdk";

const { setUser, updateUserProfile, state } = useNova();

await setUser({
	userId: externalUserId,
	userProfile: { country: "US", ltv: 1200 },
});

await updateUserProfile({ plan: "pro" });
```

Patterns

- Initialize on app start (post-auth) and only call `setUser` again if the logged-in end-user changes.
- Keep `userProfile` concise and meaningful for targeting rules. Avoid PII.
- You can extend profile over time via `updateUserProfile` without reloading everything.

Switching identity

```tsx
await setUser({ userId: "guest_123", userProfile: { cohort: "guest" } });
// later after login
await setUser({ userId: authUserId, userProfile: { cohort: "member" } });
```

State insight

- `state.user.userId`: your external id
- `state.user.novaUserId`: Nova’s internal id used for evaluation and events

Failure handling

- If `setUser` throws, show a fallback UI and retry later
- Don’t call `loadExperience(s)` until `setUser` has succeeded
