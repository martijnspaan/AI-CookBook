# AI Cookbook Design System

A comprehensive, modern design system for the AI Cookbook application featuring nature-inspired pastel green colors, clean typography, and reusable components.

## 🎨 Design Philosophy

The AI Cookbook design system is built around three core themes:
- **Cooking**: Warm, inviting colors that evoke the joy of preparing meals
- **Healthy**: Fresh, natural tones that promote wellness and vitality
- **Nature**: Earthy, organic colors that connect users to natural ingredients

## 🌈 Color Palette

### Primary Colors (Nature Green)
Our primary color palette is inspired by fresh mint and sage, creating a calming and natural atmosphere.

```scss
$primary-50: #f0f9f4;   // Very light mint
$primary-100: #dcf2e4;  // Light mint
$primary-200: #b8e5c8;  // Soft mint
$primary-300: #8dd4a6;  // Pastel mint
$primary-400: #5bbf7f;  // Medium mint
$primary-500: #3ba85c;  // Primary mint green
$primary-600: #2d8a47;  // Dark mint
$primary-700: #256b3a;  // Darker mint
$primary-800: #1f5a30;  // Very dark mint
$primary-900: #1a4a28;  // Darkest mint
```

### Secondary Colors (Sage Green)
Complementary sage tones that work harmoniously with our primary colors.

```scss
$secondary-50: #f7f8f0;   // Very light sage
$secondary-100: #eef0e0;  // Light sage
$secondary-200: #dde1c0;  // Soft sage
$secondary-300: #c5cc95;  // Pastel sage
$secondary-400: #a8b36a;  // Medium sage
$secondary-500: #8b9a4a;  // Primary sage green
$secondary-600: #6d7a3a;  // Dark sage
$secondary-700: #56602e;  // Darker sage
$secondary-800: #454c25;  // Very dark sage
$secondary-900: #383e1f;  // Darkest sage
```

### Accent Colors (Warm Peach)
Warm, earthy tones that add energy and warmth to the design.

```scss
$accent-50: #fff7ed;    // Very light peach
$accent-100: #ffedd5;   // Light peach
$accent-200: #fed7aa;   // Soft peach
$accent-300: #fdba74;   // Pastel peach
$accent-400: #fb923c;   // Medium peach
$accent-500: #f97316;   // Primary peach
$accent-600: #ea580c;   // Dark peach
$accent-700: #c2410c;   // Darker peach
$accent-800: #9a3412;   // Very dark peach
$accent-900: #7c2d12;   // Darkest peach
```

### Neutral Colors (Warm Gray)
Natural, warm grays that provide excellent contrast and readability.

```scss
$neutral-50: #fafaf9;   // Very light warm gray
$neutral-100: #f5f5f4;  // Light warm gray
$neutral-200: #e7e5e4;  // Soft warm gray
$neutral-300: #d6d3d1;  // Pastel warm gray
$neutral-400: #a8a29e;  // Medium warm gray
$neutral-500: #78716c;  // Primary warm gray
$neutral-600: #57534e;  // Dark warm gray
$neutral-700: #44403c;  // Darker warm gray
$neutral-800: #292524;  // Very dark warm gray
$neutral-900: #1c1917;  // Darkest warm gray
```

## 🔤 Typography

### Font Families

**Primary Font - Inter**
- Used for body text, UI elements, and general content
- Clean, modern sans-serif with excellent readability
- Weights: 300, 400, 500, 600, 700, 800

**Secondary Font - Playfair Display**
- Used for headings and decorative text
- Elegant serif that adds sophistication
- Weights: 400, 500, 600, 700

**Monospace Font - JetBrains Mono**
- Used for code, technical content, and data
- Clear, readable monospace font
- Weights: 400, 500, 600

### Font Scale

```scss
$font-size-xs: 0.75rem;    // 12px
$font-size-sm: 0.875rem;   // 14px
$font-size-base: 1rem;     // 16px
$font-size-lg: 1.125rem;   // 18px
$font-size-xl: 1.25rem;    // 20px
$font-size-2xl: 1.5rem;    // 24px
$font-size-3xl: 1.875rem;  // 30px
$font-size-4xl: 2.25rem;   // 36px
$font-size-5xl: 3rem;      // 48px
$font-size-6xl: 3.75rem;   // 60px
```

## 📏 Spacing System

Our spacing system is based on a 4px grid for consistent, harmonious layouts.

```scss
$spacing-0: 0;
$spacing-1: 0.25rem;   // 4px
$spacing-2: 0.5rem;    // 8px
$spacing-3: 0.75rem;   // 12px
$spacing-4: 1rem;      // 16px
$spacing-5: 1.25rem;   // 20px
$spacing-6: 1.5rem;    // 24px
$spacing-8: 2rem;      // 32px
$spacing-10: 2.5rem;   // 40px
$spacing-12: 3rem;     // 48px
$spacing-16: 4rem;     // 64px
$spacing-20: 5rem;     // 80px
$spacing-24: 6rem;     // 96px
$spacing-32: 8rem;     // 128px
```

## 🎯 Border Radius

Consistent border radius values for a cohesive look.

```scss
$border-radius-none: 0;
$border-radius-sm: 0.125rem;   // 2px
$border-radius-base: 0.25rem;  // 4px
$border-radius-md: 0.375rem;   // 6px
$border-radius-lg: 0.5rem;     // 8px
$border-radius-xl: 0.75rem;    // 12px
$border-radius-2xl: 1rem;      // 16px
$border-radius-3xl: 1.5rem;    // 24px
$border-radius-full: 9999px;
```

## 🌟 Shadows

Subtle shadows that add depth without overwhelming the design.

```scss
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
$shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

## 🧩 Components

### Buttons

#### Primary Button
```html
<button class="btn btn-primary">Primary Action</button>
```

#### Secondary Button
```html
<button class="btn btn-secondary">Secondary Action</button>
```

#### Outline Button
```html
<button class="btn btn-outline">Outline Action</button>
```

#### Ghost Button
```html
<button class="btn btn-ghost">Ghost Action</button>
```

#### Button Sizes
```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Regular</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Cards

#### Standard Card
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-subtitle">Card Subtitle</p>
  </div>
  <div class="card-body">
    <p class="card-text">Card content goes here.</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

#### Elevated Card
```html
<div class="card card-elevated">
  <div class="card-body">
    <h3 class="card-title">Elevated Card</h3>
    <p class="card-text">This card has enhanced shadow.</p>
  </div>
</div>
```

#### Flat Card
```html
<div class="card card-flat">
  <div class="card-body">
    <h3 class="card-title">Flat Card</h3>
    <p class="card-text">This card has minimal styling.</p>
  </div>
</div>
```

### Forms

#### Form Group
```html
<div class="form-group">
  <label class="form-label">Label</label>
  <input type="text" class="form-control" placeholder="Placeholder">
</div>
```

#### Form Select
```html
<div class="form-group">
  <label class="form-label">Select</label>
  <select class="form-select">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>
```

#### Form Textarea
```html
<div class="form-group">
  <label class="form-label">Message</label>
  <textarea class="form-textarea" rows="4"></textarea>
</div>
```

### Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-secondary">Secondary</span>
<span class="badge badge-accent">Accent</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>
```

### Alerts

```html
<div class="alert alert-primary">Primary alert message</div>
<div class="alert alert-success">Success alert message</div>
<div class="alert alert-warning">Warning alert message</div>
<div class="alert alert-error">Error alert message</div>
<div class="alert alert-info">Info alert message</div>
```

## 🎨 Utility Classes

### Typography
- `.font-primary`, `.font-secondary`, `.font-mono`
- `.text-xs`, `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`, `.text-2xl`, `.text-3xl`, `.text-4xl`, `.text-5xl`, `.text-6xl`
- `.font-light`, `.font-normal`, `.font-medium`, `.font-semibold`, `.font-bold`, `.font-extrabold`
- `.text-left`, `.text-center`, `.text-right`, `.text-justify`

### Colors
- `.text-primary`, `.text-secondary`, `.text-tertiary`, `.text-inverse`
- `.bg-primary`, `.bg-secondary`, `.bg-tertiary`
- `.text-brand-primary`, `.text-brand-secondary`, `.text-brand-accent`
- `.bg-brand-primary`, `.bg-brand-secondary`, `.bg-brand-accent`

### Spacing
- Margin: `.m-0`, `.m-1`, `.m-2`, `.m-3`, `.m-4`, `.m-5`, `.m-6`, `.m-8`, `.m-10`, `.m-12`, `.m-16`, `.m-20`, `.m-24`, `.m-32`
- Padding: `.p-0`, `.p-1`, `.p-2`, `.p-3`, `.p-4`, `.p-5`, `.p-6`, `.p-8`, `.p-10`, `.p-12`, `.p-16`, `.p-20`, `.p-24`, `.p-32`
- Directional: `.mt-*`, `.mb-*`, `.ml-*`, `.mr-*`, `.pt-*`, `.pb-*`, `.pl-*`, `.pr-*`

### Layout
- Display: `.block`, `.inline-block`, `.inline`, `.flex`, `.inline-flex`, `.grid`, `.hidden`
- Flexbox: `.flex-row`, `.flex-col`, `.justify-start`, `.justify-center`, `.justify-between`, `.items-start`, `.items-center`, `.items-end`
- Position: `.static`, `.relative`, `.absolute`, `.fixed`, `.sticky`
- Width/Height: `.w-full`, `.w-auto`, `.h-full`, `.h-auto`

### Border Radius
- `.rounded-none`, `.rounded-sm`, `.rounded`, `.rounded-md`, `.rounded-lg`, `.rounded-xl`, `.rounded-2xl`, `.rounded-3xl`, `.rounded-full`

### Shadows
- `.shadow-none`, `.shadow-sm`, `.shadow`, `.shadow-md`, `.shadow-lg`, `.shadow-xl`, `.shadow-2xl`

## 📱 Responsive Design

The design system includes responsive utilities and breakpoints:

```scss
$breakpoint-xs: 0;
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-2xl: 1536px;
```

## 🚀 Usage

### 1. Import the Design System
```scss
@import 'styles/design-system';
@import 'styles/utilities';
@import 'styles/components';
```

### 2. Use CSS Custom Properties
```scss
.my-component {
  background-color: var(--color-primary-500);
  color: var(--color-text-inverse);
  padding: var(--spacing-4);
  border-radius: var(--border-radius-lg);
}
```

### 3. Apply Utility Classes
```html
<div class="bg-primary-500 text-inverse p-4 rounded-lg shadow-md">
  Content with utility classes
</div>
```

## 🎯 Best Practices

1. **Consistency**: Always use the design system tokens instead of hardcoded values
2. **Accessibility**: Ensure sufficient color contrast and focus states
3. **Responsive**: Design mobile-first and use responsive utilities
4. **Semantic**: Use meaningful class names and structure
5. **Performance**: Minimize custom CSS and leverage utility classes

## 🔗 Showcase

Visit `/showcase` in the application to see the design system in action with live examples of all components and utilities.

---

*This design system is continuously evolving. Please refer to the latest version for the most up-to-date guidelines.*
