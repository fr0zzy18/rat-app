import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BingoCard } from '../models/bingo-card.model';

@Injectable({
  providedIn: 'root'
})
export class BingoService {
  private apiUrl = 'http://localhost:5211/api/bingo';

  constructor(private http: HttpClient) { }

  getBingoCards(): Observable<BingoCard[]> {
    return this.http.get<BingoCard[]>(this.apiUrl, { withCredentials: true });
  }

  createBingoCard(phrase: string): Observable<BingoCard> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<BingoCard>(this.apiUrl, { phrase }, { headers, withCredentials: true });
  }

  deleteBingoCard(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
  }
}
