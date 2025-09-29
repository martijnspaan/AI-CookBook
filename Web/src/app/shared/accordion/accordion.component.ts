import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AccordionSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  expanded?: boolean;
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss']
})
export class AccordionComponent {
  @Input() sections: AccordionSection[] = [];
  @Input() allowMultiple: boolean = false;
  @Output() sectionToggled = new EventEmitter<{ sectionId: string; expanded: boolean }>();

  expandedSections: Set<string> = new Set();

  ngOnInit() {
    // Initialize expanded sections based on input
    this.sections.forEach(section => {
      if (section.expanded) {
        this.expandedSections.add(section.id);
      }
    });
  }

  toggleSection(sectionId: string): void {
    if (this.allowMultiple) {
      if (this.expandedSections.has(sectionId)) {
        this.expandedSections.delete(sectionId);
      } else {
        this.expandedSections.add(sectionId);
      }
    } else {
      // Single accordion behavior - close others
      if (this.expandedSections.has(sectionId)) {
        this.expandedSections.clear();
      } else {
        this.expandedSections.clear();
        this.expandedSections.add(sectionId);
      }
    }

    this.sectionToggled.emit({
      sectionId,
      expanded: this.expandedSections.has(sectionId)
    });
  }

  isExpanded(sectionId: string): boolean {
    return this.expandedSections.has(sectionId);
  }
}
