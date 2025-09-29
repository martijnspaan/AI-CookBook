# Frontend Development Guidelines

## 🎨 Application Architecture

The frontend is built as a modern Angular web application with a mobile-first responsive design approach, leveraging the established design system for styling and component consistency.

## 🎯 Design System & Visual Standards

### Typography & Iconography
- **FontAwesome**: Exclusively use the free version of FontAwesome for all icons
- **Typography Consistency**: Maintain consistent font families across all pages and components
- **Icon Usage**: Use semantic icons that clearly communicate functionality and improve user experience
- **Font Hierarchy**: Implement clear typography scales for headings, body text, and UI elements

### FontAwesome Icon Configuration
- **Custom Bundle**: The application uses a custom FontAwesome configuration to reduce bundle size
- **Two-Step Process**: Adding new FontAwesome icons requires BOTH steps:
  1. **Icon Registration**: Add to `src/app/icons/fontawesome-icons.ts` in the `fontAwesomeIcons` array
  2. **CSS Definitions**: Add to `src/app/icons/fontawesome-custom.scss` with the format `.fa-icon-name:before { content: "\fXXX"; }`
- **Critical Step**: If icons don't display, check BOTH the TypeScript array AND the SCSS definitions
- **Bundle Optimization**: Only icons actually used in the application are included in the build
- **Unicode Lookup**: Use FontAwesome's website to find the correct Unicode value (e.g., \f53f for palette)

### Visual Design Principles
- **Accessibility**: Ensure WCAG 2.1 AA compliance for all UI components
- **Design System Compliance**: All visual elements must conform to the established design system standards

### Design System Implementation
- **Design System First**: The entire application must be built using the established design system
- **Component Consistency**: All UI components should follow the design system patterns and guidelines
- **Showcase Reference**: For design system examples and component implementations, refer to the showcase page
- **Design Tokens**: Use design system tokens for colors, typography, spacing, and other visual properties
- **Component Library**: Leverage the design system's component library for consistent user experience

## 💻 Angular Development Standards

### Component Architecture
- **Functional Components**: Prioritize functional components over class-based components
- **Component Composition**: Build complex UIs through composition of smaller, focused components
- **Single Responsibility**: Each component should have a single, well-defined purpose
- **Reusability**: Design components for maximum reusability across the application

### Code Quality & Best Practices
- **TypeScript**: Leverage TypeScript's type system for better code quality and maintainability
- **Angular CLI**: Use Angular CLI for consistent project structure and build processes
- **RxJS**: Implement reactive programming patterns using RxJS observables
- **Dependency Injection**: Utilize Angular's DI system for better testability and modularity

### Performance Optimization
- **Lazy Loading**: Implement lazy loading for feature modules
- **OnPush Strategy**: Use OnPush change detection strategy where appropriate
- **Tree Shaking**: Ensure proper tree shaking for optimal bundle sizes
- **Service Workers**: Implement service workers for offline functionality and performance

## 📱 Responsive Design Framework

### Breakpoint Strategy
- **Mobile First**: Design mobile-first with progressive enhancement for larger screens
- **Breakpoint Definitions**:
  - **Mobile**: Maximum width of 450px
  - **Tablet**: 451px and above
  - **Desktop**: 1024px and above

### Layout Constraints
- **Mobile Restrictions**: 
  - No horizontal scrollbars allowed
  - All functionality must be accessible within 450px width
  - Vertical scrolling preferred over horizontal scrolling
- **Tablet Flexibility**:
  - Horizontal scrollbars permitted when necessary
  - Enhanced layout capabilities compared to mobile
  - Touch-friendly interface elements

### CSS Layout Standards
- **Design System Layout**: Follow the design system's layout patterns and grid system
- **Responsive Units**: Use design system specified units and breakpoints
- **Component Layout**: Implement layouts as defined in the design system showcase

## 🎨 Styling & Component Standards

### Design System Implementation
- **Design System Components**: Use only components from the established design system
- **Custom Styling**: Avoid custom styling that conflicts with design system standards
- **SCSS Modules**: Organize styles using SCSS modules for better maintainability
- **CSS Custom Properties**: Use design system CSS custom properties for theming and consistency

## 🧪 Testing & Quality Assurance

### Testing Strategy
- **Unit Testing**: Write comprehensive unit tests using Jasmine and Karma
- **Component Testing**: Test component behavior and user interactions
- **E2E Testing**: Implement end-to-end tests using Cypress or Protractor
- **Visual Regression**: Consider visual regression testing for UI consistency

### Performance Monitoring
- **Bundle Analysis**: Regularly analyze bundle sizes and optimize accordingly
- **Core Web Vitals**: Monitor and optimize Core Web Vitals metrics
- **Performance Budgets**: Set and enforce performance budgets for builds
- **Lighthouse Audits**: Regular Lighthouse audits for performance and accessibility

## 🔧 Development Workflow

### Build & Deployment
- **Angular CLI**: Use Angular CLI for all build and development tasks
- **Environment Configuration**: Properly configure different environments (dev, staging, prod)
- **Build Optimization**: Implement build optimizations for production deployments
- **Asset Management**: Optimize and manage static assets efficiently

### Code Organization
- **Feature Modules**: Organize code by feature modules for better maintainability
- **Shared Modules**: Create shared modules for common functionality
- **Barrel Exports**: Use barrel exports for clean import statements
- **File Naming**: Follow consistent file naming conventions (kebab-case for files, PascalCase for components)

## 🛠️ Utility Classes & Shared Code

### Utils Folder Structure
- **Location**: `src/app/utils/` - Central location for reusable utility classes
- **Purpose**: Contains stateless utility classes that provide common functionality across the application
- **Naming Convention**: Use descriptive names ending with `.util.ts` (e.g., `date-time.util.ts`)

### DateTimeUtil Class
- **Purpose**: Centralized date and time calculations for consistent behavior across the application
- **Key Features**:
  - Week number calculations matching backend C# Calendar.GetWeekOfYear behavior
  - Date range operations (14-day ranges, date comparisons)
  - Day-of-week conversions between API and JavaScript formats
  - Date formatting and parsing utilities
  - Timezone-safe date operations

### Utility Class Guidelines
- **Stateless**: All utility classes should be stateless with static methods only
- **Pure Functions**: Methods should be pure functions with no side effects
- **Comprehensive Documentation**: Include JSDoc comments for all public methods
- **Type Safety**: Use TypeScript's type system for better code quality
- **Testing**: Write comprehensive unit tests for all utility methods
- **Reusability**: Design utilities to be reusable across different components and features

### When to Create Utility Classes
- **Common Operations**: When functionality is used in multiple components
- **Complex Logic**: When business logic becomes too complex for component methods
- **External Dependencies**: When dealing with external APIs or data formats
- **Mathematical Calculations**: For complex calculations that need consistency
- **Data Transformations**: For data formatting, parsing, or conversion operations