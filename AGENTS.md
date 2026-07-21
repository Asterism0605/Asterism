# AGENTS.md

## Project

Asterism is a frontend project for an aesthetic inspiration exploration platform.

Core areas:

- Home visual exploration
- Image masonry / inspiration feed
- Moodboard collection system
- User style preference analysis
- Similar image or AI recommendation features
- Profile page and folder management
- Future backend API, authentication, database, and recommendation integrations

This file defines repository-level rules for AI coding agents. Keep changes small, typed, testable, and consistent with the existing architecture.

## Tech Stack

- Vue 3
- TypeScript
- Vite
- Pinia
- TailwindCSS
- Vue Router
- API / service layer
- npm

## Commands

Use **npm only**. Do not introduce pnpm, yarn, or bun.

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
```

Before finishing a code change, run the relevant checks when possible:

```bash
npm run lint
npm run build
npm run test
```

If a command is unavailable or fails because the project does not define it, report that clearly instead of inventing a result.

## Architecture Rules

Keep responsibilities separated.

| Layer | Responsibility |
|---|---|
| `component` | UI rendering and user interaction |
| `composable` | reusable UI or business logic |
| `store` | cross-page or global state |
| `service` | business flow, data mapping, orchestration |
| `api` | raw HTTP requests, HTTP client setup, and backend client initialization |
| `types` | TypeScript contracts and shared types |
| `utils` | pure utility functions |

Rules:

- Components should not own complex API flows.
- Pages and components should call `services/`, not `api/` directly.
- `api/` files should not contain business logic.
- `services/` may combine API calls, normalize data, and coordinate store updates.
- Reusable logic should be extracted into composables when it is used by more than one component or makes a component too large.
- Avoid large refactors unless explicitly requested.

## File Structure

Prefer the current structure for this project:

```txt
src/
├── api/               # HTTP requests, HTTP client, backend client (e.g. supabaseClient)
├── assets/
├── components/
│   ├── auth/          # Auth-related UI components
│   ├── effects/       # Visual effect components (e.g. background animations)
│   ├── feature/       # Feature-specific components grouped by domain
│   │   ├── consultant/
│   │   ├── consultations/
│   │   ├── dna/
│   │   ├── guide/
│   │   ├── image/
│   │   └── moodboard/
│   ├── legal/         # Legal / policy page components
│   ├── overlay/       # Modal and overlay components
│   ├── sections/      # Page section components
│   └── ui/            # Reusable base UI components (buttons, inputs, tags)
├── composables/
├── config/            # App-level configuration
├── constants/
├── data/              # Static data files and label mappings
├── i18n/              # Internationalization config and locale files
├── layouts/           # App-level layout components (header, footer, containers)
├── pages/
├── router/
├── services/
├── stores/
├── styles/            # Global stylesheets and design tokens
├── tests/
├── types/
└── utils/
```

When a feature grows large, a feature-based structure may be proposed before implementation:

```txt
src/
├── features/
│   ├── auth/
│   ├── moodboard/
│   └── recommendation/
└── shared/
    ├── components/
    ├── composables/
    ├── types/
    └── utils/
```

Do not move files into a new feature-based structure without explaining the impact first.

## Naming Rules

| Item | Rule | Example |
|---|---|---|
| Component | PascalCase | `UserCard.vue` |
| Composable | `use` + PascalCase | `useImageSearch.ts` |
| Store file | dot naming | `auth.store.ts` |
| API file | dot naming | `auth.api.ts` |
| Service file | dot naming | `auth.service.ts` |
| Variable | camelCase | `selectedImage` |
| Constant | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Type / Interface | PascalCase | `UserProfile` |

TypeScript convention:

- Prefer `interface` for object shapes.
- Use `type` for unions, aliases, mapped types, and utility composition.

## Vue / TypeScript Rules

Use:

- `<script setup lang="ts">`
- Vue 3 Composition API
- typed props
- typed emits
- typed API responses
- clear composable return values

Avoid:

- Options API
- mixins
- `any`
- unnecessary type assertions
- `as unknown as Xxx`
- complex logic directly in templates
- direct prop mutation

Guidelines:

- Use `ref` for primitive values.
- Use `reactive` for structured objects only when appropriate.
- Use `computed` for derived state.
- Use `watch` for side effects, not pure data transformation.
- Clean up timers, event listeners, observers, and animation loops in `onUnmounted`.

## State Management Rules

Single source of truth matters. Do not duplicate the same state across component local state, Pinia, route query, and server cache.

| State type | Preferred location |
|---|---|
| input draft value | component local state |
| modal / tab state | component local state, unless shared across pages |
| authenticated user | Pinia |
| auth status | Pinia |
| theme | Pinia |
| URL filters | route query |
| server state / cache | dedicated server-state tool if introduced |
| form validation | form validation layer if introduced |

Pinia rules:

- Use setup-style stores.
- Keep stores focused on one business domain.
- Keep actions focused and readable.
- Do not put local modal state, input values, or local tab state in Pinia.
- Use `storeToRefs()` when destructuring reactive store state.

## API / Service Layer Rules

API files only perform HTTP requests:

```ts
export const loginApi = async (payload: LoginPayload) => {
  return http.post<LoginResponse>('/auth/login', payload)
}
```

Service files handle business flow and returned data:

```ts
export const login = async (payload: LoginPayload) => {
  const response = await loginApi(payload)
  return response.data
}
```

Rules:

- API request payloads and responses must be typed.
- Normalize backend responses in services when needed.
- Keep frontend error types aligned with backend contracts.
- Do not silently change API contracts.
- Explain impact before changing auth, payment, router guard, or shared response types.

## Styling Rules

- Use TailwindCSS and existing design tokens.
- Do not hardcode brand colors when CSS variables or existing tokens exist.
- Follow mobile-first responsive design.
- Keep Asterism visual style consistent: dark base, refined spacing, restrained accent usage.
- Do not introduce a new UI library without explaining why it is needed.

## Dependency Rules

- Prefer existing project dependencies before adding new ones.
- Add a dependency only when it clearly reduces maintenance cost.
- New dependencies must support Vue 3 and TypeScript.
- Avoid large dependencies for small UI or utility features.
- Explain why a new dependency is needed before adding it.
- Do not change package manager or lockfile format.

## Testing / TDD Rules

Use practical TDD where it provides value.

- For bug fixes, add or update a regression test when practical.
- For `services/`, `api/`, `stores/`, `composables/`, and `utils/`, prefer unit tests with Vitest.
- For user-critical flows, add or update integration / E2E tests when the project already has coverage.
- Do not remove existing tests to make a change pass.
- Do not weaken assertions just to satisfy a generated implementation.
- If tests are not added, explain why in the PR notes or final response.

## Git Rules

Branch from `develop`.

Do not push directly to `main`.

Use Conventional Commits:

```txt
<type>(scope): description
```

Common types:

```txt
feat, fix, refactor, docs, style, test, chore, perf, build, ci
```

Examples:

```txt
feat(auth): add login modal
fix(api): handle expired token
refactor(moodboard): split folder card component
test(service): add checkout error handling tests
```

## Hard Rules

- Use npm only.
- Do not introduce `any` unless the reason is documented.
- Do not bypass TypeScript or ESLint errors.
- Do not commit `.env`, secrets, `dist`, logs, or generated junk files.
- Do not change API contracts, router guards, auth flow, payment flow, or store schema without explaining the impact.
- Do not put all state into Pinia.
- Do not make components responsible for UI, API, state, and business logic at the same time.
- Do not add large dependencies for small features.
- Do not remove tests or weaken checks to make code pass.
- If a change touches more than 3 files, propose a plan before editing.

## Completion Checklist

Before reporting completion, verify:

- The change follows the existing architecture.
- TypeScript types are explicit where needed.
- Loading and error states are handled when the feature requires them.
- Relevant checks were run, or skipped with a clear reason.
- No unrelated files were changed.
- No secrets, build output, or generated junk files were added.
