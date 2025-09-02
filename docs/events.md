## Events

Track user behavior for analytics and metrics. Events are queued on the server side for computation.

Basic example

```tsx
const { trackEvent, state } = useNova();
await trackEvent("Store Visited", {
	hero_name: state.user?.userId,
	section: "seasonal",
});
```

On interaction

```tsx
<button
	onClick={() => trackEvent("CTA Clicked", { surface: "hero", cta: "Buy Now" })}
>
	Buy Now
</button>
```

Tips

- Always call `setUser` before tracking events (uses Nova user id)
- Debounce high-frequency events (scroll, input)
- Prefer structured payloads (flat keys, predictable types)
