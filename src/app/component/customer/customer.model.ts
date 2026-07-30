// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { InvoiceModel } from "../invoice/invoice.model";

export interface CustomerModel {
    id: number;
    name: string;
    email: string;
    address: string;
    type: string;
    status: string;
    imageUrl: string;
    phone: string;
    createdAt: Date;
    invoices?: InvoiceModel[];
}
