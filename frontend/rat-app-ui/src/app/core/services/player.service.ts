import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'; // Import HttpHeaders and HttpParams
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Import AuthService

// Updated Player interface to match backend PlayerDto
export interface Player {
  id: number; // From our DB
  name: string; // From Raider.IO
  race: string; // From Raider.IO
  class: string; // From Raider.IO (matching backend JSON)
  active_spec_name: string; // From Raider.IO (matching backend JSON)
  active_spec_role: string; // From Raider.IO (matching backend JSON)
  faction: string; // From Raider.IO
  region: string; // From Raider.IO (and our DB)
  realm: string; // From Raider.IO (and our DB)
  thumbnail_url: string; // From Raider.IO (matching backend JSON)
  profileUrl: string; // From Raider.IO
  guildName: string; // From Raider.IO
  mythicPlusScore: number; // From Raider.IO
  category: string; // From our DB
}

// DTO for adding a player, matching backend AddPlayerRequestDto
export interface AddPlayerRequestDto {
  region: string;
  realm: string;
  name: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private apiUrl = `${environment.apiUrl}/api/players`; // Backend API URL

  constructor(private http: HttpClient, private authService: AuthService) { } // Inject AuthService

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
