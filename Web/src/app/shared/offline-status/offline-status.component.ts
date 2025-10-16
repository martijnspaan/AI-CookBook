import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConnectivityService } from '../../services/offline/connectivity.service';
import { SyncService } from '../../services/offline/sync.service';
import { PwaService } from '../../services/offline/pwa.service';

/**
 * Component to display offline status and PWA installation prompts
 */
@Component({
  selector: 'app-offline-status',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <!-- Offline Status Banner -->
    <div *ngIf="isOffline" class="offline-banner">
      <div class="offline-content">
        <i class="fas fa-wifi offline-icon"></i>
        <span class="offline-text">{{ 'OFFLINE.STATUS_OFFLINE' | translate }}</span>
        <span class="offline-description">{{ connectionDescription }}</span>
      </div>
    </div>

    <!-- Sync Status -->
    <div *ngIf="!isOffline && syncStatus !== 'idle'" class="sync-banner">
      <div class="sync-content">
        <i *ngIf="syncStatus === 'syncing'" class="fas fa-sync-alt sync-icon spinning"></i>
        <i *ngIf="syncStatus === 'error'" class="fas fa-exclamation-triangle sync-icon error"></i>
        <span class="sync-text">
          <span *ngIf="syncStatus === 'syncing'">{{ 'OFFLINE.SYNCING' | translate }}</span>
          <span *ngIf="syncStatus === 'error'">{{ 'OFFLINE.SYNC_ERROR' | translate }}</span>
        </span>
        <button *ngIf="syncStatus === 'error'" class="retry-sync-btn" (click)="retrySync()">
          {{ 'OFFLINE.RETRY_SYNC' | translate }}
        </button>
      </div>
    </div>

    <!-- PWA Install Prompt -->
    <div *ngIf="showInstallPrompt" class="install-banner">
      <div class="install-content">
        <i class="fas fa-download install-icon"></i>
        <span class="install-text">{{ 'OFFLINE.INSTALL_APP' | translate }}</span>
        <button class="install-btn" (click)="installApp()">
          {{ 'OFFLINE.INSTALL' | translate }}
        </button>
        <button class="dismiss-btn" (click)="dismissInstallPrompt()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Last Sync Time -->
    <div *ngIf="lastSyncTime && !isOffline" class="last-sync">
      <i class="fas fa-clock"></i>
      <span>{{ 'OFFLINE.LAST_SYNC' | translate }}: {{ lastSyncTime | date:'short' }}</span>
    </div>
  `,
  styles: [`
    .offline-banner {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      padding: 12px 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .offline-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .offline-icon {
      font-size: 18px;
    }

    .offline-text {
      font-weight: 600;
      font-size: 16px;
    }

    .offline-description {
      font-size: 14px;
      opacity: 0.9;
    }

    .sync-banner {
      background: linear-gradient(135deg, #3742fa, #2f3542);
      color: white;
      padding: 12px 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .sync-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .sync-icon {
      font-size: 18px;
    }

    .sync-icon.spinning {
      animation: spin 1s linear infinite;
    }

    .sync-icon.error {
      color: #ff6b6b;
    }

    .sync-text {
      font-weight: 500;
      font-size: 14px;
    }

    .retry-sync-btn {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .retry-sync-btn:hover {
      background: rgba(255,255,255,0.3);
    }

    .install-banner {
      background: linear-gradient(135deg, #2ed573, #1e90ff);
      color: white;
      padding: 12px 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .install-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .install-icon {
      font-size: 18px;
    }

    .install-text {
      font-weight: 500;
      font-size: 14px;
      flex: 1;
    }

    .install-btn {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-right: 8px;
    }

    .install-btn:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-1px);
    }

    .dismiss-btn {
      background: transparent;
      border: none;
      color: white;
      padding: 4px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .dismiss-btn:hover {
      opacity: 1;
    }

    .last-sync {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 1000;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 450px) {
      .offline-content,
      .sync-content,
      .install-content {
        flex-direction: column;
        gap: 4px;
      }

      .install-content {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .install-text {
        flex: none;
        width: 100%;
        text-align: center;
      }

      .last-sync {
        bottom: 10px;
        right: 10px;
        left: 10px;
        text-align: center;
        justify-content: center;
      }
    }
  `]
})
export class OfflineStatusComponent implements OnInit, OnDestroy {
  isOffline = false;
  syncStatus: 'idle' | 'syncing' | 'error' = 'idle';
  lastSyncTime: Date | null = null;
  connectionDescription = '';
  showInstallPrompt = false;
  
  private readonly destroySubject = new Subject<void>();

  constructor(
    private readonly connectivity: ConnectivityService,
    private readonly sync: SyncService,
    private readonly pwa: PwaService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.setupConnectivitySubscriptions();
    this.setupSyncSubscriptions();
    this.checkInstallPrompt();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  private setupConnectivitySubscriptions(): void {
    this.connectivity.isOffline$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(isOffline => {
        this.isOffline = isOffline;
        this.connectionDescription = this.connectivity.getConnectionStatusDescription();
      });
  }

  private setupSyncSubscriptions(): void {
    this.sync.syncStatus$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(status => {
        this.syncStatus = status;
      });

    this.sync.lastSyncTime$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(time => {
        this.lastSyncTime = time;
      });
  }

  private checkInstallPrompt(): void {
    // Show install prompt if:
    // 1. App can be installed
    // 2. Not already running as PWA
    // 3. User hasn't dismissed it recently
    if (this.pwa.canInstall && !this.pwa.isRunningAsPwa()) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedTime = dismissed ? new Date(dismissed).getTime() : 0;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (!dismissed || (now - dismissedTime) > oneDay) {
        this.showInstallPrompt = true;
      }
    }
  }

  async installApp(): Promise<void> {
    const installed = await this.pwa.promptInstall();
    if (installed) {
      this.showInstallPrompt = false;
    }
  }

  dismissInstallPrompt(): void {
    this.showInstallPrompt = false;
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  }

  retrySync(): void {
    this.sync.forceSync().catch(error => {
      console.error('Failed to retry sync:', error);
    });
  }
}

