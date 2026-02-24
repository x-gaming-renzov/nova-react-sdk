## Troubleshooting

### "useNova must be used within a NovaProvider"

Your component is outside the `<NovaProvider>` tree. Wrap your app (or the relevant subtree) with the provider.

In Next.js, make sure `useNova` is only called from client components.

### "User must be set before loading experiences"

Call and await `setUser` before calling `loadExperience`, `loadExperiences`, or `loadAllExperiences`.

### Experience returns defaults only

- Verify the experience exists in the Nova dashboard with objects and variants assigned
- Check that the user's profile matches targeting rules (try a 100% rollout rule to test)
- Confirm `loadExperience` completed without errors (`loaded === true`)

### No network calls happening

- Check `apiEndpoint` in provider config — is it correct and reachable?
- For web: check CORS on the backend
- For React Native emulator: use LAN IP (`http://192.168.x.x:8000`), not `localhost`

### Events not being tracked

- Make sure `setUser` has been called and `state.user` is not null
- `trackEvent` silently skips if `apiKey` or `userId` is missing
- Events are batched — they won't appear immediately. Call `flushEvents()` to force-send.

### TypeScript types are too loose

Pass your own types as generics:

```tsx
const { objects } = useNovaExperience<{
  hero_banner: { title: string; show_cta: boolean };
}>("landing");

// objects?.hero_banner?.title is now typed as string
```

### How do I preload everything?

After `setUser`, call `loadAllExperiences()` once:

```tsx
await setUser({ userId: "...", userProfile: { ... } });
await loadAllExperiences();
// All components using useNovaExperience now have server values
```

Or use the `useNovaInit` hook at your app's entry point.

### Can I use this with Next.js SSR?

Use the SDK in client components only. Call `setUser` and load methods inside `useEffect`. The registry defaults will render on the server, and server values will hydrate on the client.
