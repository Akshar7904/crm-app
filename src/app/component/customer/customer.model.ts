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
