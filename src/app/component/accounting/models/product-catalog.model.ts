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
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductStats {
  total: number;
  active: number;
  services: number;
  products: number;
  bundles: number;
}
