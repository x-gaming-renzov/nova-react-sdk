## Experiences

Experiences are named contexts that group your objects. You load them for the current user, and then read the evaluated object configs.

Lifecycle

1. Provider sets defaults from registry
2. `setUser` resolves
3. `loadAllExperiences()` or `loadExperience(name)`
4. Components render with `useNovaExperience(name)`

Load all or one

```tsx
const { loadAllExperiences, loadExperience } = useNova();
await loadAllExperiences();
await loadExperience("landing");
```

Component hook example

```tsx
import { useNovaExperience } from "nova-react-sdk";

const Landing = () => {
	const { objects, loaded, loading, error, load } = useNovaExperience<{
		"ftue-landing": {
			game_title: string;
			tagline: string;
			username_placeholder: string;
			cta_button: string;
		};
		"ui-theme": {
			text_color: string;
			accent_color: string;
			card_radius: number;
		};
	}>("landing");

	// Defensive load for route-level components
	useEffect(() => {
		if (!loaded && !loading) load();
	}, [loaded, loading, load]);

	if (loading && !loaded) return <Spinner />;
	if (error) return <ErrorView message={error} />;

	const landingData = objects?.["ftue-landing"];
	const theme = objects?.["ui-theme"];

	return (
		<section style={{ color: theme?.text_color }}>
			<h1>{landingData?.game_title}</h1>
			<p>{landingData?.tagline}</p>
			<Button style={{ background: theme?.accent_color }}>
				{landingData?.cta_button}
			</Button>
		</section>
	);
};
```

Programmatic access

```tsx
const { getExperience } = useNova();
const theme = await getExperience<{ "ui-theme": { text_color: string } }>(
	"theme"
);
```

Patterns

- Global theming: put `ui-theme` under an experience like `theme` and read at app root
- Route-level loads: call `loadExperience(routeName)` in route components
- Performance: use `loadAllExperiences()` on app start for small registries
- Caching: `getExperience` loads on first call, returns cached configs thereafter

Error handling

- Combine `error` from `useNovaExperience` with UI fallbacks
- Wrap `loadExperience` in try/catch if triggering manually
