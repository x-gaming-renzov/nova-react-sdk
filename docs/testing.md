## Testing

### Component tests

Wrap components in `NovaProvider` with a test config and mock `fetch`:

```tsx
import { render, screen } from "@testing-library/react";
import { NovaProvider } from "nova-react-sdk";
import registry from "../nova-objects.json";
import MyComponent from "./MyComponent";

beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({}) });
});

test("renders with registry defaults", async () => {
  render(
    <NovaProvider
      config={{
        apiKey: "test-key",
        apiEndpoint: "http://localhost:8000",
        registry,
      }}
    >
      <MyComponent />
    </NovaProvider>
  );

  // Registry defaults render without any API call
  expect(screen.getByText("Welcome")).toBeInTheDocument();
});
```

### Mocking API responses

To test with server-assigned values, mock the fetch response:

```tsx
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    experience_id: "exp-1",
    personalisation_name: "kr-premium",
    evaluation_reason: "segment_match",
    features: {
      hero_banner: {
        feature_id: "f-1",
        feature_name: "hero_banner",
        variant_id: "v-1",
        variant_name: "variant_a",
        config: { title: "Premium Welcome", show_cta: true },
      },
    },
  }),
});
```

### Hook testing

Test components that consume the hook rather than testing the hook directly:

```tsx
function TestComponent() {
  const { objects, loaded } = useNovaExperience("landing");
  return <div>{loaded ? objects?.hero_banner?.title : "loading"}</div>;
}
```

### E2E

- Seed the backend with known experiences and objects
- Use a stable test user profile
- Verify `trackEvent` writes by checking analytics (events are batched, so call `flushEvents` before asserting)
