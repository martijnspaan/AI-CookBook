import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CookbookService } from '../services/cookbook.service';
import { Cookbook, CreateCookbookRequest, UpdateCookbookRequest } from '../models/cookbook.model';
import { PageTitleService } from '../services/page-title.service';
import { CookbookModalService } from '../services/cookbook-modal.service';
import { ReusablePopupComponent, PopupConfig } from '../shared/reusable-popup';

@Component({
  selector: 'app-cookbooks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ReusablePopupComponent],
  templateUrl: './cookbooks.component.html',
  styleUrl: './cookbooks.component.scss'
})
export class CookbooksComponent implements OnInit, OnDestroy, AfterViewInit {
  cookbooks: Cookbook[] = [];
  isLoadingCookbooks = false;
  isSubmittingCookbook = false;
  isEditingCookbook = false;
  currentEditingCookbook: Cookbook | null = null;
  errorMessage: string | null = null;
  cookbookForm: FormGroup;
  showCookbookModal = false;
  private readonly destroySubject = new Subject<void>();

  get cookbookPopupConfig(): PopupConfig {
    return {
      title: this.isEditingCookbook ? 'Edit Cookbook' : 'Create New Cookbook',
      icon: 'fas fa-book',
      showCloseButton: true,
      size: 'md',
      height: 'md',
      showBackdrop: true,
      closeOnBackdropClick: false,
      closeOnEscape: true
    };
  }

  constructor(
    private readonly cookbookService: CookbookService,
    private readonly formBuilder: FormBuilder,
    private readonly pageTitleService: PageTitleService,
    private readonly cookbookModalService: CookbookModalService
  ) {
    this.cookbookForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      author: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.loadAllCookbooks();
    
    this.cookbookModalService.openModal$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(() => {
        this.openCreateCookbookModal();
      });
  }

  ngAfterViewInit(): void {
    this.pageTitleService.setPageTitle('Cookbooks');
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  loadAllCookbooks(): void {
    this.isLoadingCookbooks = true;
    this.errorMessage = null;
    
    this.cookbookService.getAllCookbooks()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (cookbooks) => {
          this.cookbooks = cookbooks.sort((a, b) => a.title.localeCompare(b.title));
          this.isLoadingCookbooks = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load cookbooks. Please make sure the API is running.';
          this.isLoadingCookbooks = false;
          console.error('Error loading cookbooks:', error);
        }
      });
  }

  openCreateCookbookModal(): void {
    this.isEditingCookbook = false;
    this.currentEditingCookbook = null;
    this.cookbookForm.reset();
    this.showCookbookModal = true;
  }

  editCookbook(cookbook: Cookbook): void {
    this.isEditingCookbook = true;
    this.currentEditingCookbook = cookbook;
    this.cookbookForm.patchValue({
      title: cookbook.title,
      author: cookbook.author
    });
    this.showCookbookModal = true;
  }

  deleteCookbookWithConfirmation(cookbook: Cookbook): void {
    const confirmationMessage = `Are you sure you want to delete "${cookbook.title}"?`;
    if (confirm(confirmationMessage)) {
      this.cookbookService.deleteCookbookById(cookbook.id)
        .pipe(takeUntil(this.destroySubject))
        .subscribe({
          next: () => {
            this.cookbooks = this.cookbooks.filter(existingCookbook => existingCookbook.id !== cookbook.id);
          },
          error: (error) => {
            console.error('Error deleting cookbook:', error);
            alert('Failed to delete cookbook. Please try again.');
          }
        });
    }
  }

  submitCookbookForm(): void {
    if (this.cookbookForm.valid) {
      this.isSubmittingCookbook = true;
      
      if (this.isEditingCookbook && this.currentEditingCookbook) {
        const updateRequest: UpdateCookbookRequest = {
          title: this.cookbookForm.value.title,
          author: this.cookbookForm.value.author
        };

        this.cookbookService.updateExistingCookbook(this.currentEditingCookbook.id, updateRequest)
          .pipe(takeUntil(this.destroySubject))
          .subscribe({
            next: (updatedCookbook) => {
              const index = this.cookbooks.findIndex(cookbook => cookbook.id === updatedCookbook.id);
              if (index !== -1) {
                this.cookbooks[index] = updatedCookbook;
                this.cookbooks.sort((a, b) => a.title.localeCompare(b.title));
              }
              this.isSubmittingCookbook = false;
              this.showCookbookModal = false;
            },
            error: (error) => {
              console.error('Error updating cookbook:', error);
              this.isSubmittingCookbook = false;
              alert('Failed to update cookbook. Please try again.');
            }
          });
      } else {
        const createRequest: CreateCookbookRequest = {
          title: this.cookbookForm.value.title,
          author: this.cookbookForm.value.author
        };

        this.cookbookService.createNewCookbook(createRequest)
          .pipe(takeUntil(this.destroySubject))
          .subscribe({
            next: (createdCookbook) => {
              this.cookbooks.push(createdCookbook);
              this.cookbooks.sort((a, b) => a.title.localeCompare(b.title));
              this.isSubmittingCookbook = false;
              this.showCookbookModal = false;
            },
            error: (error) => {
              console.error('Error creating cookbook:', error);
              this.isSubmittingCookbook = false;
              alert('Failed to create cookbook. Please try again.');
            }
          });
      }
    }
  }

  private showBootstrapModal(): void {
    const modalElement = document.getElementById('cookbookModal');
    if (modalElement) {
      const bootstrapModal = (window as any).bootstrap?.Modal;
      if (bootstrapModal) {
        const modalInstance = new bootstrapModal(modalElement);
        modalInstance.show();
      } else {
        this.showModalFallback(modalElement);
      }
    }
  }

  private showModalFallback(modalElement: HTMLElement): void {
    modalElement.classList.add('show');
    modalElement.style.display = 'block';
    modalElement.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    
    const backdropElement = document.createElement('div');
    backdropElement.className = 'modal-backdrop fade show';
    backdropElement.id = 'modal-backdrop';
    document.body.appendChild(backdropElement);
  }

  hideCookbookModal(): void {
    const modalElement = document.getElementById('cookbookModal');
    if (modalElement) {
      const bootstrapModal = (window as any).bootstrap?.Modal;
      if (bootstrapModal) {
        const modalInstance = bootstrapModal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      } else {
        this.hideModalFallback(modalElement);
      }
    }
  }

  private hideModalFallback(modalElement: HTMLElement): void {
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    modalElement.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    
    const backdropElement = document.getElementById('modal-backdrop');
    if (backdropElement) {
      backdropElement.remove();
    }
  }

  cancelCookbookModal(): void {
    this.showCookbookModal = false;
  }
}
