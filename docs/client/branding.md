# FlowFocus Branding & Design Guidelines

## Project Identity

### Name & Concept

- **Project Name**: FlowFocus
- **Concept**: Combines "flow state" + "focus" - representing optimal productivity state
- **Tagline**: "Organize. Focus. Flow."

### Brand Voice

- **Elevator Pitch**: FlowFocus is a minimalist productivity dashboard for developers and creatives. Manage tasks, take notes, and track habits—all in one clutter-free workspace designed for deep work.

## Visual Design System

### Color Palette

#### Primary Colors

- **Primary Purple**: `#6C63FF`

  - Usage: Main brand color, primary buttons, key UI elements
  - Represents: Trustworthiness, modernity

- **Secondary Teal**: `#4FD1C5`
  - Usage: Secondary actions, highlights, progress indicators
  - Represents: Calmness, productivity

#### Background Colors

- **Light Mode**: `#FAFAFA`

  - Usage: Main background in light theme

- **Dark Mode**: `#1A202C`
  - Usage: Main background in dark theme

#### Accent Colors

- **Action Pink**: `#FF6584`
  - Usage: Alerts, important actions, notifications
  - Represents: Energy, urgency

### Typography

#### Font Families

- **Headings**: Inter Bold

  - Usage: All headings (h1-h6)
  - Style: Clean, professional

- **Body Text**: Inter Regular

  - Usage: Main content, paragraphs, buttons
  - Style: Highly readable

- **Monospace**: Fira Code
  - Usage: Code blocks, technical content
  - Style: Developer-friendly

### Logo Guidelines

#### Symbol Elements

- Minimalist rocket (🚀) combined with checkmark (✓)
- Symbolizes: Productivity and progress
- Gradient: `#6C63FF` to `#4FD1C5`

#### Text Logo

- Font: Inter Bold
- Gradient: `#6C63FF` to `#4FD1C5`

#### Favicon

- Simplified rocket icon
- Use solid primary color (`#6C63FF`)

## UI Design Principles

### Component Styling

#### Task Cards

- Rounded corners (8px radius)
- Subtle shadows: `0 2px 4px rgba(0, 0, 0, 0.1)`
- White background in light mode
- Dark gray background in dark mode

#### Interactive Elements

- Hover states: Slight scale transform (1.02)
- Active states: Scale down (0.98)
- Focus states: Primary color outline

#### Animations

- Drag-and-Drop: Use framer-motion
- Transitions: 0.2s ease-in-out
- Loading states: Animated rocket loader

### Layout Guidelines

#### Spacing System

- Base unit: 4px
- Common spacings: 8px, 16px, 24px, 32px, 48px

#### Container Widths

- Max width: 1200px
- Content width: 800px
- Card width: 400px

### Special UI Elements

#### Dark Mode Toggle

- Position: Navbar
- Animation: Smooth transition
- Icons: Sun/Moon

#### 404 Page

- Custom illustration: Broken rocket
- Friendly message
- Return to home button

#### Loading States

- Animated rocket loader
- Brand colors
- Smooth transitions

### Console Easter Egg

```javascript
console.log("🚀 Ready to focus? Let's build something great!");
```

## Implementation Notes

### CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #6c63ff;
  --color-secondary: #4fd1c5;
  --color-accent: #ff6584;
  --color-background-light: #fafafa;
  --color-background-dark: #1a202c;

  /* Typography */
  --font-heading: "Inter Bold", sans-serif;
  --font-body: "Inter Regular", sans-serif;
  --font-code: "Fira Code", monospace;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### Recommended Packages

- `framer-motion`: For smooth animations
- `@emotion/styled`: For styled components
- `react-icons`: For consistent iconography
