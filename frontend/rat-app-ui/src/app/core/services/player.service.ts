import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpHeaders
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Import AuthService

// Updated Player interface to match backend PlayerDto
export interface Player {
  id: number; // From our DB
  name: string; // From Raider.IO
  race: string; // From Raider.IO
  player_class: string; // From Raider.IO (matching backend JSON)
  active_spec_name: string; // From Raider.IO (matching backend JSON)
  active_spec_role: string; // From Raider.IO (matching backend JSON)
  faction: string; // From Raider.IO
  region: string; // From Raider.IO (and our DB)
  realm: string; // From Raider.IO (and our DB)
  thumbnail_url: string; // From Raider.IO (matching backend JSON)
}

// DTO for adding a player, matching backend AddPlayerRequestDto
export interface AddPlayerRequestDto {
  region: string;
  realm: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private apiUrl = 'http://localhost:5211/api/players'; // Backend API URL

  constructor(private http: HttpClient, private authService: AuthService) { } // Inject AuthService

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  addPlayer(dto: AddPlayerRequestDto): Observable<Player> {
    return this.http.post<Player>(`${this.apiUrl}/import`, dto, { headers: this.getAuthHeaders() });
  }

  deletePlayer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
