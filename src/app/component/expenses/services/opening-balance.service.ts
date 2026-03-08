import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/api/v1/opening-balance`;

@Injectable({ providedIn: 'root' })
export class OpeningBalanceService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(`${BASE}/list`);
  }

  getByYear(year: number): Observable<any> {
    return this.http.get<any>(`${BASE}/${year}`);
  }

  save(dto: any): Observable<any> {
    return this.http.post<any>(`${BASE}/save`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/${id}`);
  }
}
