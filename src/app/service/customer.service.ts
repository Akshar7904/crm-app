// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { CustomHttpResponse, CustomerState, Page, Profile } from '../interface/appstates';
import { UserModel } from '../component/profile/user.model';
import { Key } from '../enum/key.enum';
import { Stats } from '../interface/stats';
import { CustomerModel } from '../component/customer/customer.model';
import { InvoiceModel } from '../component/invoice/invoice.model';

@Injectable()
export class CustomerService {
    private readonly server: string = environment.apiUrl + '/api/v1';

    constructor(private http: HttpClient) { }

    customers$ = (page: number = 0) => <Observable<CustomHttpResponse<Page<CustomerModel> & UserModel & Stats>>>
        this.http.get<CustomHttpResponse<Page<CustomerModel> & UserModel & Stats>>
            (`${this.server}/customer/list?page=${page}`)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    customer$ = (customerId: number) => <Observable<CustomHttpResponse<CustomerState>>>
        this.http.get<CustomHttpResponse<CustomerState>>
            (`${this.server}/customer/get/${customerId}`)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    update$ = (customer: CustomerModel) => <Observable<CustomHttpResponse<CustomerState>>>
        this.http.put<CustomHttpResponse<CustomerState>>
            (`${this.server}/customer/update`, customer)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    searchCustomers$ = (name: string = '', page: number = 0) => <Observable<CustomHttpResponse<Page<CustomerModel> & UserModel>>>
        this.http.get<CustomHttpResponse<Page<CustomerModel> & UserModel>>
            (`${this.server}/customer/search?name=${name}&page=${page}`)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    newCustomers$ = (customer: CustomerModel) => <Observable<CustomHttpResponse<CustomerModel & UserModel>>>
        this.http.post<CustomHttpResponse<CustomerModel & UserModel>>
            (`${this.server}/customer/create`, customer)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    newInvoice$ = () => <Observable<CustomHttpResponse<CustomerModel[] & UserModel>>>
        this.http.get<CustomHttpResponse<CustomerModel[] & UserModel>>
            (`${this.server}/customer/invoice/new`)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    createInvoice$ = (customerId: number, invoice: InvoiceModel) => <Observable<CustomHttpResponse<CustomerModel[] & UserModel>>>
        this.http.post<CustomHttpResponse<CustomerModel[] & UserModel>>
            (`${this.server}/customer/invoice/addtocustomer/${customerId}`, invoice)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    invoices$ = (page: number = 0) => <Observable<CustomHttpResponse<Page<InvoiceModel> & UserModel>>>
        this.http.get<CustomHttpResponse<Page<InvoiceModel> & UserModel>>
            (`${this.server}/customer/invoice/list?page=${page}`)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    invoice$ = (invoiceId: number) => <Observable<CustomHttpResponse<CustomerModel & InvoiceModel & UserModel>>>
        this.http.get<CustomHttpResponse<CustomerModel & InvoiceModel & UserModel>>
            (`${this.server}/customer/invoice/get/${invoiceId}`)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    updateInvoice$ = (invoice: InvoiceModel) => <Observable<CustomHttpResponse<CustomerModel & InvoiceModel & UserModel>>>
        this.http.put<CustomHttpResponse<CustomerModel & InvoiceModel & UserModel>>
            (`${this.server}/customer/invoice/update`, invoice)
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    sendInvoice$ = (invoiceId: number) => <Observable<CustomHttpResponse<CustomerModel & InvoiceModel & UserModel>>>
        this.http.post<CustomHttpResponse<CustomerModel & InvoiceModel & UserModel>>
            (`${this.server}/customer/invoice/${invoiceId}/send`, {})
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    downloadReport$ = () => <Observable<HttpEvent<Blob>>>
        this.http.get(`${this.server}/customer/download/report`,
            { reportProgress: true, observe: 'events', responseType: 'blob' })
            .pipe(
                tap(console.log),
                catchError(this.handleError)
            );

    private handleError(error: HttpErrorResponse): Observable<never> {
        console.log(error);
        let errorMessage: string;
        if (error.error instanceof ErrorEvent) {
            errorMessage = `A client error occurred - ${error.error.message}`;
        } else {
            if (error.error.reason) {
                errorMessage = error.error.reason;
                console.log(errorMessage);
            } else {
                errorMessage = `An error occurred - Error status ${error.status}`;
            }
        }
        return throwError(() => errorMessage);
    }
}
