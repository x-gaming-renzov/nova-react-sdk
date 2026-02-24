## Event tracking

Track user actions for analytics and metrics. Events are batched locally and sent to the backend in bulk.

### Basic usage

```tsx
const { trackEvent } = useNova();

trackEvent("button_click", { button_id: "cta-main", screen: "home" });
trackEvent("page_view", { page: "/settings" });
trackEvent("purchase", { amount: 29.99, currency: "USD" });
```

`trackEvent` is synchronous — it pushes the event into an in-memory queue and returns immediately. No HTTP request happens at call time.

### How batching works

Events are queued in memory and flushed to the backend as a batch. Three triggers cause a flush:

1. **Max size** — queue hits 10 events (default). Flushes immediately.
2. **Timer** — every 5 seconds (default), a periodic flush sends whatever is queued.
3. **Unmount** — when the provider unmounts (app background, navigation away), remaining events are flushed.

If a flush fails (network error, server down), the events go back to the front of the queue and retry on the next cycle.

### Configuration

Tune batch behavior in the provider config:

```tsx
<NovaProvider
  config={{
    apiKey: "nova_sk_...",
    apiEndpoint: "https://your-api.example.com",
    eventBatch: {
      maxSize: 20,         // flush at 20 events (default: 10)
      flushInterval: 3000, // flush every 3 seconds (default: 5000)
    },
    registry,
  }}
>
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxSize` | `number` | `10` | Flush when queue reaches this count |
| `flushInterval` | `number` | `5000` | Flush every N milliseconds |

### Manual flush

Force-send all queued events. Useful before logout or critical navigation:

```tsx
const { flushEvents } = useNova();

const handleLogout = async () => {
  await flushEvents();
  logout();
};
```

### Timestamps

The timestamp is captured at the moment `trackEvent` is called, not when the batch is flushed. This preserves accurate event timing even if the flush is delayed.

### Requirements

- `setUser` must have been called (events need a `userId`)
- `apiKey` must be set in config
- If either is missing, `trackEvent` silently skips

### Tips

- Prefer structured, flat payloads: `{ button_id: "cta", screen: "home" }`
- For very high-frequency events (scroll position, typing), debounce before calling `trackEvent`
- Use `flushEvents` before navigation to ensure nothing is lost
