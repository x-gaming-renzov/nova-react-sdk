## Testing the SDK integration

### Component testing

Use `NovaProvider` with a minimal config and mock `fetch` to control responses.

```tsx
import { render, screen } from "@testing-library/react";
import { NovaProvider } from "nova-react-sdk";
import NovaRegistry from "../nova-objects.json";
import MyComponent from "./MyComponent";

beforeEach(() => {
	// simple fetch mock
	global.fetch = jest
		.fn()
		.mockResolvedValue({ ok: true, json: async () => ({}) });
});

test("renders landing experience", async () => {
	render(
		<NovaProvider
			config={{
				organisationId: "org",
				appId: "app",
				apiEndpoint: "http://localhost:8000",
				registry: NovaRegistry,
			}}
		>
			<MyComponent />
		</NovaProvider>
	);

	// assert on default configs from registry or mocked API
	expect(await screen.findByText(/Nova Legends/i)).toBeInTheDocument();
});
```

### Hook testing

- Prefer testing components that consume the hook
- For `useNovaExperience`, render a test component that calls it and displays a value

### E2E

- Seed server with known experiences/objects
- Use a stable test user profile
- Verify `trackEvent` side effects via your analytics store
