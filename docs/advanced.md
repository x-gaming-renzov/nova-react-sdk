## Advanced patterns

### Prefetch strategies

- Small registries: call `loadAllExperiences()` after `setUser`
- Large registries: prefetch route-level experiences on navigation

### React Native specifics

- Ensure `apiEndpoint` is reachable from emulator/device; use LAN IP
- Consider offline mode: render defaults and retry loads on reconnect

### Error boundaries

- Wrap critical screens with a boundary that renders from defaults if evaluation fails

### Performance tips

- Memoize derived styles from object configs
- Avoid repeated `loadExperience` calls by checking `isExperienceLoaded`
- Batch `trackEvent` calls on high-traffic interactions

### Multi-tenant apps

- On org/app switch, remount `NovaProvider` with new config

### Security

- SDK uses unauthenticated runtime endpoints (org/app/user in body)
- Admin endpoints (creating experiences, flags) require server-side usage, not SDK
