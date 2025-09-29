import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-popup-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './popup-demo.component.html',
  styleUrls: ['./popup-demo.component.scss']
})
export class PopupDemoComponent {
  @Input() isVisible = false;
  @Input() headerIcon = 'fas fa-comment-dots';
  @Input() headerTitle = 'Contact Us';
  @Output() close = new EventEmitter<void>();

  // Form data
  formData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    dietaryPreferences: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false
    },
    agreeToTerms: false
  };

  subjects = [
    { value: '', label: 'Select a subject' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'menu', label: 'Menu Question' },
    { value: 'reservation', label: 'Reservation' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'complaint', label: 'Complaint' }
  ];

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.isFormValid()) {
      console.log('Form submitted:', this.formData);
      // Here you would typically send the data to a service
      alert('Form submitted successfully! Check console for data.');
      this.onClose();
    }
  }

  onCancel() {
    this.resetForm();
    this.onClose();
  }

  isFormValid(): boolean {
    return !!(
      this.formData.name &&
      this.formData.email &&
      this.formData.subject &&
      this.formData.message &&
      this.formData.agreeToTerms
    );
  }

  private resetForm() {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      dietaryPreferences: {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        dairyFree: false
      },
      agreeToTerms: false
    };
  }
}
