// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { InvoiceModel } from "../invoice/invoice.model";

export interface CustomerModel {
    id: number;
    // Company information
    name: string;
    registrationNumber?: string;
    vatNumber?: string;
    accountType?: string;
    address: string;
    province?: string;
    phone: string;
    website?: string;
    email: string;
    type: string;
    status: string;
    imageUrl: string;
    createdAt: Date;
    // Primary contact person
    primaryContactName?: string;
    primaryContactSurname?: string;
    primaryContactPosition?: string;
    primaryContactEmail?: string;
    primaryContactCell?: string;
    // Secondary contact person
    secondaryContactName?: string;
    secondaryContactSurname?: string;
    secondaryContactPosition?: string;
    secondaryContactEmail?: string;
    secondaryContactCell?: string;
    invoices?: InvoiceModel[];
}
