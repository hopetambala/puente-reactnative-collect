# GlassView & GlassContainer

Cross-platform glass effect components using `expo-glass-effect`.

## Features

- **Native iOS Glass Effect**: Uses iOS 26+ UIVisualEffectView
- **Cross-Platform Fallbacks**: Semi-transparent views on Android and older iOS
- **Easy to Use**: Simple API that mirrors expo-glass-effect
- **Animated Transitions**: Built-in animation support for glass effect style changes

## Installation

Already installed! Package is available at: `expo-glass-effect@~55.0.8`

## Usage

### Basic GlassView

```jsx
import { GlassView } from "@impacto-design-system/Base";

<GlassView
  style={styles.overlay}
  glassEffectStyle="regular"
  tintColor="rgba(0, 0, 0, 0.1)"
>
  <Text>Your content here</Text>
</GlassView>
```

### Glass Container (Multiple Views)

```jsx
import { GlassContainer, GlassView } from "@impacto-design-system/Base";

<GlassContainer spacing={12}>
  <GlassView style={styles.card} glassEffectStyle="clear" />
  <GlassView style={styles.card} glassEffectStyle="regular" />
</GlassContainer>
```

### Animated Glass Effect

```jsx
const [visible, setVisible] = useState(true);

<GlassView
  glassEffectStyle={{
    style: visible ? "regular" : "none",
    animate: true,
    animationDuration: 0.5,
  }}
>
  Content
</GlassView>
```

## Props

### GlassView

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `glassEffectStyle` | `'regular'` \| `'clear'` \| `'none'` \| `GlassEffectStyleConfig` | `'regular'` | Glass effect style |
| `tintColor` | `string` | - | Tint color (iOS only) |
| `colorScheme` | `'auto'` \| `'light'` \| `'dark'` | `'auto'` | Color scheme override |
| `isInteractive` | `boolean` | `false` | Interactive glass effect |
| `style` | `StyleProp<ViewStyle>` | - | Standard View styles |
| `children` | `ReactNode` | - | Content inside glass view |

### GlassContainer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spacing` | `number` | - | Distance between glass elements |
| `style` | `StyleProp<ViewStyle>` | - | Standard View styles |
| `children` | `ReactNode` | - | Glass View children |

## Cross-Platform Behavior

| Platform | Behavior |
|----------|----------|
| **iOS 26+** | Native glass effect (UIVisualEffectView) |
| **iOS <26** | Semi-transparent fallback |
| **Android** | Semi-transparent fallback |
| **Web** | Semi-transparent fallback |

## Examples

See [EXAMPLES.js](./GlassView/EXAMPLES.js) for complete usage examples:

- Simple glass overlay
- Multiple glass cards with container
- Animated glass effect toggle

## Performance Notes

- Glass effects are GPU-accelerated on iOS
- Fallback views on Android use simple opacity/transparency
- Avoid excessive nesting of glass views
- Use `isInteractive=true` sparingly for touch-through effects

## Known Issues

- Setting `opacity: 0` on `GlassView` or parents breaks the effect on iOS. Use animated `glassEffectStyle` transitions instead (see examples).
- Some iOS 26 beta versions lack Glass Effect API. Use `isGlassEffectAPIAvailable()` to check before rendering.

## Browser Support

Not supported on web. Provide alternative UI or use fallback styling.
