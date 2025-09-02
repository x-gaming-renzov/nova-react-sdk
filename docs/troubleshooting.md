## Troubleshooting / FAQ

### "useNova must be used within a NovaProvider"

Wrap your tree with `NovaProvider` and ensure only client components read `useNova`.

### "User must be set before loading experiences"

Call and await `setUser` before any `loadExperience(s)`.

### Experience returns defaults only

- Verify the experience exists server-side with features/variants
- Ensure user profile matches targeting rules; try a broad rule (100% rollout)

### No network calls

- Check `apiEndpoint` in provider config
- Verify CORS for web; device reachability for RN emulators

### Events not tracked

- Ensure `setUser` ran and `state.user.novaUserId` is present

### TypeScript types are too loose/strict

- Define local types for your objects and pass as generics to `useNovaExperience`/`getExperience`

### How do I preload everything?

- After `setUser`, call `loadAllExperiences()` once, then render

### Can I use this on Next.js SSR?

- Use in client components only; trigger loads in `useEffect`
