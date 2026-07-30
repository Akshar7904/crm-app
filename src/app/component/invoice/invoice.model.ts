// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

export interface InvoiceModel {
    id?: number;
    invoiceNumber?: string;
    services: string;
    status: string;
    date: Date | string;
    dueDate?: Date | string;
    issuedByName?: string;
    issuedByEmail?: string;
    // Amount excluding VAT
    subtotal?: number;
    // VAT rate (default 15% for South Africa)
    vatRate?: number;
    // VAT amount
    vatAmount?: number;
    // Total amount including VAT
    total: number;
    // Discount amount
    discount?: number;
    // Extended fields for display
    customerId?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    createdAt?: Date;
}

export interface InvoiceLineItem {
    id?: number;
    item: string;
    description: string;
    unitCost: number;
    quantity: number;
    price: number;
}
