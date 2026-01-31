import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Player {
  id: number;
  name: string;
  team: string;
  createdByUsername: string;
  dateCreated: Date;
}

interface AddPlayerCommand {
  name: string;
  team: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private apiUrl = 'http://localhost:5211/api/players/'; // Backend PlayersController URL

  constructor(private http: HttpClient) { }

  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.apiUrl);
  }

  addPlayer(command: AddPlayerCommand): Observable<Player> {
    return this.http.post<Player>(this.apiUrl, command);
  }

  deletePlayer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}`);
  }
}
