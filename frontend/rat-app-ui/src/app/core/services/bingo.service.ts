import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BingoCard } from '../models/bingo-card.model';
import { Suggestion, SuggestionStatus } from '../models/suggestion.model';

@Injectable({
  providedIn: 'root'
})
export class BingoService {
  private apiUrl = `${environment.apiUrl}/api/bingo`;
  private suggestionsApiUrl = `${environment.apiUrl}/api/suggestions`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getBingoCards(): Observable<BingoCard[]> {
    return this.http.get<BingoCard[]>(this.apiUrl, { withCredentials: true });
  }

  createBingoCard(phrase: string): Observable<BingoCard> {
    return this.http.post<BingoCard>(this.apiUrl, { phrase }, { headers: this.getAuthHeaders(), withCredentials: true });
  }

  deleteBingoCard(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders(), withCredentials: true });
  }

  updateBingoCard(id: number, card: BingoCard): Observable<BingoCard> {
    return this.http.put<BingoCard>(`${this.apiUrl}/${id}`, card, { headers: this.getAuthHeaders(), withCredentials: true });
  }

  // Suggestion methods
  addSuggestion(phrase: string): Observable<Suggestion> {
    return this.http.post<Suggestion>(this.suggestionsApiUrl, { phrase }, { headers: this.getAuthHeaders(), withCredentials: true });
  }

  getAllSuggestions(): Observable<Suggestion[]> {
    return this.http.get<Suggestion[]>(this.suggestionsApiUrl, { headers: this.getAuthHeaders(), withCredentials: true });
  }

  getPendingSuggestions(): Observable<Suggestion[]> {
    return this.http.get<Suggestion[]>(`${this.suggestionsApiUrl}/pending`, { headers: this.getAuthHeaders(), withCredentials: true });
  }

  approveSuggestion(id: number): Observable<Suggestion> {
    return this.http.put<Suggestion>(`${this.suggestionsApiUrl}/${id}/approve`, {}, { headers: this.getAuthHeaders(), withCredentials: true });
  }

  rejectSuggestion(id: number): Observable<Suggestion> {
    return this.http.put<Suggestion>(`${this.suggestionsApiUrl}/${id}/reject`, {}, { headers: this.getAuthHeaders(), withCredentials: true });
  }

  updateSuggestionPhrase(id: number, newPhrase: string): Observable<Suggestion> {
    return this.http.put<Suggestion>(`${this.suggestionsApiUrl}/${id}/phrase`, { newPhrase }, { headers: this.getAuthHeaders(), withCredentials: true });
  }
}
