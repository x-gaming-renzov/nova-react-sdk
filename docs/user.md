## User lifecycle

You must identify the user before loading experiences or tracking events. The SDK uses your app's external user ID (a string you control) for all operations.

### Register a user

```tsx
const { setUser } = useNova();

await setUser({
  userId: "user-abc-123",
  userProfile: {
    country: "KR",
    plan: "premium",
    signup_date: "2025-01-15",
  },
});
```

What happens:
1. SDK calls `POST /api/v1/users/create-user/` with your `userId` and `userProfile`
2. Backend creates or finds the user, returns an internal `nova_user_id` (for debugging)
3. SDK stores the user in state
4. All subsequent API calls send your external `userId` — you never need to touch `nova_user_id`

### Update profile

Merge new attributes into the existing profile without replacing it:

```tsx
const { updateUserProfile } = useNova();

await updateUserProfile({ plan: "enterprise", ltv: 5000 });
```

This updates state immediately (optimistic) and syncs to the backend in the background.

### Switching users

Call `setUser` again with a different `userId`. This replaces the current user entirely:

```tsx
// Guest session
await setUser({ userId: "guest_456", userProfile: { cohort: "guest" } });

// After login
await setUser({ userId: "user-abc-123", userProfile: { cohort: "member" } });
```

After switching users, reload experiences to get personalisations for the new user.

### State

```tsx
const { state } = useNova();

state.user.userId;       // your external ID ("user-abc-123")
state.user.userProfile;  // { country: "KR", plan: "premium", ... }
state.user.novaUserId;   // internal UUID (optional, for debugging only)
```

### Error handling

- If `setUser` throws, show a fallback and retry
- Don't call `loadExperience(s)` or `trackEvent` until `setUser` has succeeded
- `updateUserProfile` silently skips if no user is set
