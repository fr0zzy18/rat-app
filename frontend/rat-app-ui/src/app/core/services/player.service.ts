import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Assuming auth.service.ts is in the same directory

export interface Player {
  id: number;
  name: string;
  class: string;
  spec: string;
  role: string;
  faction: string;
  guild: string;
  static: string;
}

export interface AddPlayerDto {
  name: string;
  class: string;
  spec: string;
  role: string;
  faction: string;
  guild: string;
  static: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private apiUrl = 'http://localhost:5211/api/players'; // TODO: Configure this properly

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  addPlayer(player: AddPlayerDto): Observable<Player> {
    return this.http.post<Player>(this.apiUrl, player, { headers: this.getAuthHeaders() });
  }

  updatePlayer(player: Player): Observable<Player> {
    return this.http.put<Player>(this.apiUrl, player, { headers: this.getAuthHeaders() });
  }

  deletePlayer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
