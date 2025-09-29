import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PopupDemoComponent } from '../shared/popup-demo/popup-demo.component';
import { AccordionComponent, AccordionSection } from '../shared/accordion/accordion.component';

@Component({
  selector: 'app-showcase-menu',
  standalone: true,
  imports: [CommonModule, TranslateModule, PopupDemoComponent, AccordionComponent],
  templateUrl: './showcase-menu.component.html',
  styleUrls: ['./showcase-menu.component.scss']
})
export class ShowcaseMenuComponent implements OnInit {
  menuItems = [
    {
      id: 1,
      name: 'Garden Fresh Salad',
      description: 'Mixed greens with cherry tomatoes, cucumber, and a light lemon vinaigrette',
      price: '$12.99',
      category: 'Appetizers',
      tags: ['Vegetarian', 'Healthy', 'Fresh'],
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      name: 'Herb-Crusted Salmon',
      description: 'Atlantic salmon with fresh herbs, served with roasted vegetables',
      price: '$24.99',
      category: 'Main Course',
      tags: ['Protein', 'Omega-3', 'Gluten-Free'],
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      name: 'Quinoa Buddha Bowl',
      description: 'Nutrient-packed bowl with quinoa, avocado, chickpeas, and tahini dressing',
      price: '$16.99',
      category: 'Main Course',
      tags: ['Vegan', 'Protein', 'Superfood'],
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      name: 'Green Smoothie Bowl',
      description: 'Blend of spinach, banana, and tropical fruits topped with granola',
      price: '$9.99',
      category: 'Breakfast',
      tags: ['Vegan', 'Smoothie', 'Energy'],
      image: 'https://images.unsplash.com/photo-1511690743698-d9d7f4f4c4a1?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      name: 'Mediterranean Wrap',
      description: 'Whole wheat wrap with hummus, vegetables, and feta cheese',
      price: '$11.99',
      category: 'Lunch',
      tags: ['Mediterranean', 'Portable', 'Balanced'],
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
    },
    {
      id: 6,
      name: 'Chocolate Avocado Mousse',
      description: 'Rich and creamy dessert made with avocado and dark chocolate',
      price: '$7.99',
      category: 'Dessert',
      tags: ['Vegan', 'Healthy', 'Chocolate'],
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
    }
  ];

  categories = ['All', 'Appetizers', 'Main Course', 'Breakfast', 'Lunch', 'Dessert'];
  selectedCategory = 'All';
  showPopupDemo = false;

  filteredItems = this.menuItems;

  // Accordion sections for showcase
  accordionSections: AccordionSection[] = [];

  constructor(private readonly translateService: TranslateService) {}

  ngOnInit(): void {
    this.updateAccordionSections();
  }

  private updateAccordionSections(): void {
    this.accordionSections = [
      {
        id: 'design-tokens',
        title: this.translateService.instant('SHOWCASE.DESIGN_TOKENS'),
        icon: 'fas fa-palette',
        content: `
          <p>Design tokens are the foundational elements of our design system, providing consistent values for colors, typography, spacing, and other visual properties.</p>
          <ul>
            <li><strong>Colors:</strong> Primary (#3ba85c), Secondary (#8b9a4a), Accent (#f97316), Neutral (#78716c)</li>
            <li><strong>Typography:</strong> Font families, sizes, weights, and line heights</li>
            <li><strong>Spacing:</strong> Consistent spacing scale from 0.25rem to 4rem</li>
            <li><strong>Border Radius:</strong> Standardized corner rounding values</li>
            <li><strong>Shadows:</strong> Elevation and depth system</li>
          </ul>
          <p>These tokens ensure visual consistency across all components and make it easy to maintain brand identity.</p>
        `
      },
      {
        id: 'components',
        title: this.translateService.instant('SHOWCASE.REUSABLE_COMPONENTS'),
        icon: 'fas fa-puzzle-piece',
        content: `
          <p>Our component library includes pre-built, accessible components that follow design system principles.</p>
          <ul>
            <li><strong>Buttons:</strong> Primary, secondary, accent, outline, and ghost variants</li>
            <li><strong>Forms:</strong> Input fields, selects, checkboxes, and textareas</li>
            <li><strong>Cards:</strong> Information containers with headers, bodies, and footers</li>
            <li><strong>Modals:</strong> Overlay dialogs for user interactions</li>
            <li><strong>Accordions:</strong> Collapsible content sections</li>
            <li><strong>Badges:</strong> Status indicators and labels</li>
          </ul>
          <p>All components are built with accessibility in mind and follow WCAG 2.1 AA guidelines.</p>
        `
      },
      {
        id: 'accessibility',
        title: this.translateService.instant('SHOWCASE.ACCESSIBILITY_STANDARDS'),
        icon: 'fas fa-universal-access',
        content: `
          <p>Our design system prioritizes accessibility to ensure all users can effectively use our applications.</p>
          <ul>
            <li><strong>Color Contrast:</strong> All text meets WCAG 2.1 AA contrast requirements</li>
            <li><strong>Keyboard Navigation:</strong> Full keyboard accessibility for all interactive elements</li>
            <li><strong>Screen Readers:</strong> Proper ARIA labels and semantic HTML structure</li>
            <li><strong>Focus Management:</strong> Clear focus indicators and logical tab order</li>
            <li><strong>Responsive Design:</strong> Mobile-first approach with touch-friendly targets</li>
          </ul>
          <p>We regularly test our components with assistive technologies to ensure the best possible user experience.</p>
        `
      },
      {
        id: 'implementation',
        title: this.translateService.instant('SHOWCASE.IMPLEMENTATION_GUIDE'),
        icon: 'fas fa-code',
        content: `
          <p>Learn how to implement and customize our design system in your projects.</p>
          <ul>
            <li><strong>Installation:</strong> <code>npm install @ai-cookbook/design-system</code></li>
            <li><strong>Import Styles:</strong> Include our CSS variables and component styles</li>
            <li><strong>Use Components:</strong> Import and use pre-built Angular components</li>
            <li><strong>Customization:</strong> Override CSS custom properties for theming</li>
            <li><strong>Best Practices:</strong> Follow our coding standards and guidelines</li>
          </ul>
          <p>Check our documentation for detailed implementation examples and API references.</p>
        `
      }
    ];
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    if (category === 'All') {
      this.filteredItems = this.menuItems;
    } else {
      this.filteredItems = this.menuItems.filter(item => item.category === category);
    }
  }

  getBadgeClass(tag: string): string {
    const tagClasses: { [key: string]: string } = {
      'Vegetarian': 'badge-primary',
      'Vegan': 'badge-secondary',
      'Healthy': 'badge-success',
      'Fresh': 'badge-info',
      'Protein': 'badge-accent',
      'Omega-3': 'badge-primary',
      'Gluten-Free': 'badge-secondary',
      'Superfood': 'badge-success',
      'Smoothie': 'badge-info',
      'Energy': 'badge-accent',
      'Mediterranean': 'badge-primary',
      'Portable': 'badge-secondary',
      'Balanced': 'badge-success',
      'Chocolate': 'badge-accent'
    };
    return tagClasses[tag] || 'badge-primary';
  }

  openPopupDemo() {
    this.showPopupDemo = true;
  }

  closePopupDemo() {
    this.showPopupDemo = false;
  }
}