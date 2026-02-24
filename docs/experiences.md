## Experiences

Experiences are named containers that group your objects. You load them for the current user, and the SDK merges server-assigned variant configs over the registry defaults.

### Lifecycle

1. Provider populates defaults from registry on mount
2. `setUser` resolves
3. `loadAllExperiences()` or `loadExperience(name)` fetches server values
4. Components render with `useNovaExperience(name)`

### Loading experiences

```tsx
const { loadExperience, loadExperiences, loadAllExperiences } = useNova();

// Load one
await loadExperience("landing");

// Load specific ones
await loadExperiences(["landing", "pricing_page"]);

// Load all registered experiences
await loadAllExperiences();
```

`loadAllExperiences` passes `null` to the backend, which returns all experiences for the app.

### useNovaExperience hook

The primary way to read experience data in components:

```tsx
import { useNovaExperience } from "nova-react-sdk";

function LandingScreen() {
  const { objects, loaded, loading, error, load } = useNovaExperience<{
    "hero_banner": {
      title: string;
      show_cta: boolean;
      cta_color: string;
    };
    "ui_theme": {
      text_color: string;
      accent_color: string;
    };
  }>("landing");

  useEffect(() => {
    if (!loaded && !loading) load();
  }, [loaded, loading, load]);

  if (loading && !loaded) return <Spinner />;
  if (error) return <ErrorView message={error} />;

  const banner = objects?.["hero_banner"];
  const theme = objects?.["ui_theme"];

  return (
    <View style={{ backgroundColor: theme?.accent_color }}>
      <Text style={{ color: theme?.text_color }}>{banner?.title}</Text>
      {banner?.show_cta && <Button title="Get Started" />}
    </View>
  );
}
```

**Return values:**

| Field | Type | Description |
|-------|------|-------------|
| `objects` | `T \| null` | Config values (defaults before load, server values after) |
| `loaded` | `boolean` | `true` after server data has been fetched |
| `loading` | `boolean` | Global loading state |
| `error` | `string \| null` | Error message if load failed |
| `load` | `() => Promise<void>` | Trigger a server load |
| `get` | `() => Promise<void>` | Load-if-needed (skips if already loaded) |

### useNovaInit hook

Load all experiences on mount. Useful at your app's entry point:

```tsx
function MainApp() {
  const { isReady, loading, error } = useNovaInit();

  if (loading) return <Spinner />;
  if (error) return <ErrorScreen message={error} />;

  return <NavigationContainer />;
}
```

After `useNovaInit` completes, any component using `useNovaExperience` will already have server values.

### Programmatic access

```tsx
const { readExperience, getExperience, isExperienceLoaded } = useNova();

// Check if loaded
isExperienceLoaded("landing"); // true/false

// Read whatever is in state right now (defaults or loaded)
const data = readExperience("landing");

// Load-if-needed, then read
const data = await getExperience("landing");
```

### Patterns

- **Preload at startup**: Call `loadAllExperiences()` after `setUser` for small registries. All components get server values immediately.
- **Lazy load per route**: Call `loadExperience(routeName)` in route-level components. Only fetches what's needed.
- **Memoize derived values**: If you compute styles from object configs, use `useMemo` to avoid recalculation on every render.
- **Check `isExperienceLoaded`**: Avoid redundant `loadExperience` calls if the data is already there.

### Error handling

- `useNovaExperience` exposes `error` for UI fallbacks
- Wrap manual `loadExperience` calls in try/catch
- If the backend is unreachable, registry defaults still render — the app doesn't break
