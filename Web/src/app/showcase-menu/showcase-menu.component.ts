import { Component } from '@angular/core';

@Component({
  selector: 'app-showcase-menu',
  templateUrl: './showcase-menu.component.html',
  styleUrls: ['./showcase-menu.component.scss']
})
export class ShowcaseMenuComponent {
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

  filteredItems = this.menuItems;

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
}