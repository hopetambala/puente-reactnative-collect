# Puente Collect — CLAUDE.md

Community health data collection app for field workers (promotores de salud).
Built with Expo / React Native. Talks to a Parse/Back4App backend. Offline-first:
data entered without a connection is saved locally and syncs when reconnected.

---

## Commands

```bash
yarn ios                          # run on iOS simulator (dev env)
EXPO_PUBLIC_APP_ENV=staging APP_ENV=staging yarn ios  # staging backend (needed for login)
yarn android                      # run on Android emulator
yarn test                         # jest watch mode
yarn test-run                     # full suite, no watch — use this before declaring done
yarn test:unit                    # unit tests only (excludes *.integration.test.js)
yarn test:integration             # integration tests only
yarn lint-fix                     # ESLint auto-fix
yarn lint:animations              # animation system lint (checks for token violations)
yarn lint:theme-imports           # design token import lint
```

## Directory structure

```
domains/          # Feature domains — one folder per screen/flow
  Auth/
  DataCollection/ # Forms and survey data entry (the core workflow)
  FindRecords/    # Search and retrieve saved records
  Assets/
  HomeScreen/
  Onboarding/
  Settings/
modules/          # Shared utilities and systems
  theme/          # Design tokens (dlite) — tokens.js, colors/, spacing.js, typography.js
  utils/          # Animation system — animations.js, animationRules.js
  offline/        # Offline queue and sync logic
  i18n/           # Translations — english/en.json is the source
  settings/
  geolocation/
impacto-design-system/  # Local component library (Base/, Cards/, Extensions/, etc.)
context/          # React contexts — auth, offline, alert, theme, accessibility
services/         # Backend integrations — parse/, aws/, tasky/
__mocks__/        # Global jest mocks
```

## Path aliases

Defined in `jsconfig.json` and `jest.config moduleNameMapper`:

| Alias | Resolves to |
|---|---|
| `@modules/*` | `modules/*` |
| `@context/*` | `context/*` |
| `@assets/*` | `assets/*` |
| `@impacto-design-system/*` | `impacto-design-system/*` |
| `@app/*` | `./*` (repo root) |

## Environment

Three environments: `dev` (default, points to localhost Parse — no server running),
`staging` (Back4App — use this for anything requiring a real login), `prod`.

Config lives in `environment.js` (git-ignored, copy from `environment-example.js`).
The staging backend URL is `https://parseapi.back4app.com/`.

The mobile Parse SDK cannot use the Master Key — never use `masterKey` in app code.
Use `equalTo`, `limit`, `find` on queries; never `distinct`.

---

## Testing

### Standing rule: test first, always

No production behavior changes without a test that was seen failing first.
This applies to new features and bug fixes equally. Use the `red-green-tdd` skill.

### Test location

Tests live adjacent to their source in a `__tests__/` folder:
```
domains/DataCollection/index.js
domains/DataCollection/__tests__/DataCollection.unit.test.js
```

Integration tests use `.integration.test.js` and are excluded from `yarn test:unit`.

### Global mocks (already in `jest.setup.js` — do not re-mock these)

These are set up globally and available in every test file:
- `@react-native-async-storage/async-storage` — in-memory store
- `react-native-reanimated` — stubbed (animations are no-ops)
- `react-native-gesture-handler` — passthrough wrappers
- `react-native-safe-area-context` — zero insets
- `@app/context/alert.context` — jest.fn() stubs
- `@impacto-design-system/Base` — renders children; Button renders a TouchableOpacity
- `@impacto-design-system/Extensions` — PaperInputPicker renders a real TextInput
- `expo-camera` — stubbed CameraView

### Per-test mock conventions (match neighboring tests exactly)

```js
// Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

// Parse
jest.mock('parse/react-native', () => ({
  Query: jest.fn().mockImplementation(() => ({
    equalTo: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  })),
  Object: { extend: jest.fn(() => class { save() { return Promise.resolve(this); } }) },
  User: { current: jest.fn() },
}));

// react-native-paper (flat colors, no theme provider needed)
jest.mock('react-native-paper', () => {
  const mockColors = { primary: '#000', background: '#fff', text: '#000' };
  return {
    useTheme: () => ({ colors: mockColors }),
    Provider: ({ children }) => children,
    // add specific components as needed
  };
});

// UserContext (wrap components that read auth state)
import { UserContext } from '@app/context/auth.context';
const mockUser = { objectId: 'test-user', organization: 'test-org' };
render(<UserContext.Provider value={mockUser}><ComponentUnderTest /></UserContext.Provider>);
```

---

## Design system

Design tokens live in `modules/theme/tokens.js`, wrapping
`style-dictionary-dlite-tokens/rn/puente/default`.

```js
import { getTokens } from '@modules/theme/tokens';
const t = getTokens('light');

// Use semantic tokens always:
t.semantic.color.text.primary
t.semantic.color.surface.base
t.semantic.spacing.md
t.semantic.borderRadius.md
```

Never hard-code hex colors, numeric spacing, or borderRadius values in StyleSheets.
The `dlite-design-system` skill enforces this.

The mock for tests lives in `__mocks__/styleDictionaryTokens.js`.

## Animation system

Tokens and hooks in `modules/utils/animations.js`.
Spring helpers and validation in `modules/utils/animationRules.js`.

```js
import { MOTION_TOKENS } from '@modules/utils/animations';
import { getSpringForComponent } from '@modules/utils/animationRules';

// Always use tokens, never hardcode damping/stiffness/duration:
withSpring(1, getSpringForComponent('BUTTON'))
withTiming(1, { duration: MOTION_TOKENS.duration.base })
```

Scale must never exceed 1.2. Use `react-native-reanimated` only — never `moti`,
`framer-motion`, or the built-in `Animated` API.
The `motion-auditor` agent enforces this.

---

## Skills and agents

This project uses Claude Code skills and agents in `.claude/`:

| Skill | When to use |
|---|---|
| `red-green-tdd` | Any new function, component, hook, or bug fix — test first |
| `dlite-design-system` | Any StyleSheet or inline style change |
| `ux-review` | When a screen or component is complete — runs dlite-auditor, motion-auditor, mobile-delight-auditor |
| `visual-qa` | Screenshot the iOS simulator to verify visual correctness |

The `skill-eval` hook fires before every response and forces evaluation of each skill.
Do not skip it.

### Agents invoked by skills

| Agent | Role |
|---|---|
| `tdd-test-writer` | Writes one failing test (RED phase) |
| `tdd-implementer` | Writes minimum code to pass (GREEN phase) |
| `tdd-refactorer` | Cleans up without changing behavior (REFACTOR phase) |
| `dlite-auditor` | Finds and fixes token violations |
| `motion-auditor` | Finds and fixes animation violations |
| `mobile-delight-auditor` | Finds and fixes UX delight gaps (haptics, copy, empty states) |

---

## Offline capability

Offline state is managed via `context/offline.context.js`. When a user saves
a record offline it goes into an async-storage queue; `modules/offline/` handles
the sync queue.

When writing data-collection code:
- Always check offline context before deciding how to save
- Distinguish "saved offline" from "saved to server" in all user-facing copy
- Never clear form data on a sync/save error — the user's work must survive

## i18n

String source of truth: `modules/i18n/english/en.json`.
`yarn lint:locale-sync` checks for orphaned or missing keys across locales.
Maestro visual-qa flows use English on-screen labels — keep them in sync with `en.json`.
