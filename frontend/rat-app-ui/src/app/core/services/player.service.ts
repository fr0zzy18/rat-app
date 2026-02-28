import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
export interface Player {
  id: number;
  name: string;
  race: string;
  class: string;
  active_spec_name: string;
  active_spec_role: string;
  faction: string;
  region: string;
  realm: string;
  thumbnail_url: string;
  profileUrl: string;
  guildName: string;
  mythicPlusScore: number;
  category: string;
  streamLink: string | null;
  itemLevelEquipped: number;
}
export interface AddPlayerRequestDto {
  region: string;
  realm: string;
  name: string;
  category: string;
  streamLink: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private apiUrl = `${environment.apiUrl}/api/players`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllPlayers(category?: string): Observable<Player[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<Player[]>(this.apiUrl, { headers: this.getAuthHeaders(), params: params });
  }

  addPlayer(dto: AddPlayerRequestDto): Observable<Player> {
    return this.http.post<Player>(`${this.apiUrl}/import`, dto, { headers: this.getAuthHeaders() });
  }

  deletePlayer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
