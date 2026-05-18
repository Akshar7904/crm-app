// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ProductCatalog, StockMovement, StockMovementType, InventoryStats } from '../models/product-catalog.model';
import { InventoryService } from '../services/inventory.service';
import { ProductCatalogService } from '../services/product-catalog.service';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {

  stats: InventoryStats = { totalTracked: 0, lowStock: 0, totalMovements: 0, lowStockItems: [] };
  trackedProducts: ProductCatalog[] = [];
  allProducts: ProductCatalog[] = [];
  movements: StockMovement[] = [];

  activeTab: 'tracked' | 'movements' | 'low-stock' = 'tracked';
  loading = true;
  movementsLoading = false;

  // Enable tracking modal
  showEnableModal = false;
  enableProduct: ProductCatalog | null = null;
  enableInitialStock = 0;
  enableUnitCost: number | null = null;
  enableReorderPoint = 5;

  // Stock movement modal
  showMovementModal = false;
  movementProduct: ProductCatalog | null = null;
  movementType: StockMovementType = 'STOCK_IN';
  movementQuantity = 1;
  movementUnitCost: number | null = null;
  movementReference = '';
  movementNotes = '';

  // Product movements drawer
  showMovementsDrawer = false;
  drawerProduct: ProductCatalog | null = null;
  drawerMovements: StockMovement[] = [];

  movementTypes: StockMovementType[] = ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'WRITE_OFF'];

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductCatalogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.inventoryService.getStats$().subscribe({
      next: r => {
        this.stats = r.data.stats;
        this.cdr.markForCheck();
      }
    });

    this.inventoryService.getTracked$().subscribe({
      next: r => {
        this.trackedProducts = r.data.products;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });

    this.loadMovements();

    // All products for enable-tracking dropdown
    this.productService.products$(0, 200).subscribe({
      next: r => {
        this.allProducts = r.data.page?.content || [];
        this.cdr.markForCheck();
      }
    });
  }

  loadMovements(): void {
    this.movementsLoading = true;
    this.inventoryService.getMovements$().subscribe({
      next: r => {
        this.movements = r.data.movements;
        this.movementsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.movementsLoading = false; this.cdr.markForCheck(); }
    });
  }

  setTab(tab: 'tracked' | 'movements' | 'low-stock'): void {
    this.activeTab = tab;
    if (tab === 'low-stock') {
      this.inventoryService.getLowStock$().subscribe({
        next: r => { this.trackedProducts = r.data.products; this.cdr.markForCheck(); }
      });
    } else if (tab === 'tracked') {
      this.inventoryService.getTracked$().subscribe({
        next: r => { this.trackedProducts = r.data.products; this.cdr.markForCheck(); }
      });
    }
  }

  // ── Enable Tracking ──────────────────────────────────────────────────────

  openEnableModal(product: ProductCatalog): void {
    this.enableProduct = product;
    this.enableInitialStock = 0;
    this.enableUnitCost = product.unitCost ?? null;
    this.enableReorderPoint = 5;
    this.showEnableModal = true;
  }

  closeEnableModal(): void { this.showEnableModal = false; this.enableProduct = null; }

  confirmEnable(): void {
    if (!this.enableProduct?.id) return;
    this.inventoryService.enableTracking$(
      this.enableProduct.id,
      this.enableInitialStock,
      this.enableUnitCost ?? undefined,
      this.enableReorderPoint
    ).subscribe({
      next: () => { this.closeEnableModal(); this.loadAll(); },
      error: err => alert(err?.error?.message || 'Failed to enable tracking')
    });
  }

  disableTracking(product: ProductCatalog): void {
    if (!product.id || !confirm(`Disable inventory tracking for "${product.name}"?`)) return;
    this.inventoryService.disableTracking$(product.id).subscribe({
      next: () => this.loadAll()
    });
  }

  // ── Stock Movement ───────────────────────────────────────────────────────

  openMovementModal(product: ProductCatalog): void {
    this.movementProduct = product;
    this.movementType = 'STOCK_IN';
    this.movementQuantity = 1;
    this.movementUnitCost = product.unitCost ?? null;
    this.movementReference = '';
    this.movementNotes = '';
    this.showMovementModal = true;
  }

  closeMovementModal(): void { this.showMovementModal = false; this.movementProduct = null; }

  confirmMovement(): void {
    if (!this.movementProduct?.id || this.movementQuantity < 1) return;
    this.inventoryService.recordMovement$(
      this.movementProduct.id,
      this.movementType,
      this.movementQuantity,
      this.movementUnitCost ?? undefined,
      this.movementReference || undefined,
      this.movementNotes || undefined
    ).subscribe({
      next: () => { this.closeMovementModal(); this.loadAll(); },
      error: err => alert(err?.error?.message || 'Failed to record movement')
    });
  }

  // ── Movement History Drawer ──────────────────────────────────────────────

  openMovementsDrawer(product: ProductCatalog): void {
    this.drawerProduct = product;
    this.drawerMovements = [];
    this.showMovementsDrawer = true;
    if (product.id) {
      this.inventoryService.getMovementsByProduct$(product.id).subscribe({
        next: r => { this.drawerMovements = r.data.movements; this.cdr.markForCheck(); }
      });
    }
  }

  closeMovementsDrawer(): void { this.showMovementsDrawer = false; this.drawerProduct = null; }

  // ── Helpers ──────────────────────────────────────────────────────────────

  isLowStock(p: ProductCatalog): boolean {
    return (p.stockLevel ?? 0) <= (p.reorderPoint ?? 0);
  }

  movementBadgeClass(type: StockMovementType): string {
    const map: Record<StockMovementType, string> = {
      STOCK_IN:   'badge-soft-success',
      STOCK_OUT:  'badge-soft-danger',
      ADJUSTMENT: 'badge-soft-warning',
      WRITE_OFF:  'badge-soft-secondary'
    };
    return map[type] ?? 'badge-soft-secondary';
  }

  movementLabel(type: StockMovementType): string {
    const map: Record<StockMovementType, string> = {
      STOCK_IN:   'Stock In',
      STOCK_OUT:  'Stock Out',
      ADJUSTMENT: 'Adjustment',
      WRITE_OFF:  'Write-Off'
    };
    return map[type] ?? type;
  }

  trackById(_: number, item: any): any { return item.id; }
}
