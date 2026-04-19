// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

export type ProductType = 'SERVICE' | 'PRODUCT' | 'BUNDLE';

export interface ProductCatalog {
  id?: number;
  code: string;
  name: string;
  description?: string;
  type: ProductType;
  unitPrice: number;
  vatRate: number;
  account?: { id: number; accountCode: string; accountName: string };
  isActive: boolean;
  trackInventory?: boolean;
  stockLevel?: number;
  reorderPoint?: number;
  unitCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type StockMovementType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'WRITE_OFF';

export interface StockMovement {
  id?: number;
  product?: ProductCatalog;
  movementDate?: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  reference?: string;
  notes?: string;
  createdAt?: string;
}

export interface InventoryStats {
  totalTracked: number;
  lowStock: number;
  totalMovements: number;
  lowStockItems: ProductCatalog[];
}

export interface ProductStats {
  total: number;
  active: number;
  services: number;
  products: number;
  bundles: number;
}
