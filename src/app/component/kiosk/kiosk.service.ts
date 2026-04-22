import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class KioskService {
  private readonly api = environment.apiUrl + '/api/v1/kiosk';

  constructor(private http: HttpClient) {}

  punch(employeeId: string, pin: string, companyId: number, action?: string): Observable<any> {
    const body: any = { employeeId, pin, companyId };
    if (action) body.action = action;
    return this.http.post<any>(`${this.api}/punch`, body);
  }

  setPin(pin: string, userId?: number): Observable<any> {
    return this.http.post<any>(`${this.api}/set-pin`, { pin, userId });
  }

  getActiveBreaks(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.api}/active-breaks`, { params: { companyId } });
  }
}
