import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { PlayerService } from '../../core/services/player.service'; // Will create this service next

interface Player {
  id: number;
  name: string;
  team: string;
  createdByUsername: string;
  dateCreated: Date;
}

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="players-container">
      <h2>Players List</h2>

      <div *ngIf="isAdmin" class="add-player-form">
        <h3>Add New Player</h3>
        <form (ngSubmit)="addPlayer()">
          <div class="form-group">
            <label for="playerName">Name</label>
            <input type="text" id="playerName" [(ngModel)]="newPlayerName" name="newPlayerName" required>
          </div>
          <div class="form-group">
            <label for="playerTeam">Team (Optional)</label>
            <input type="text" id="playerTeam" [(ngModel)]="newPlayerTeam" name="newPlayerTeam">
          </div>
          <button type="submit">Add Player</button>
        </form>
      </div>

      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>

      <table class="players-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Team</th>
            <th>Created By</th>
            <th>Date Created</th>
            <th *ngIf="isAdmin">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let player of players">
            <td>{{ player.id }}</td>
            <td>{{ player.name }}</td>
            <td>{{ player.team || '-' }}</td>
            <td>{{ player.createdByUsername }}</td>
            <td>{{ player.dateCreated | date:'short' }}</td>
            <td *ngIf="isAdmin">
              <button (click)="deletePlayer(player.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .players-container {
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      background-color: #fff;
    }
    h2, h3 {
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }
    .add-player-form {
      background-color: #f0f8ff;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 30px;
      border: 1px solid #e0e0e0;
    }
    .form-group {
      margin-bottom: 10px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }
    input[type="text"] {
      width: calc(100% - 22px);
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      padding: 8px 15px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }
    button:hover {
      background-color: #0056b3;
    }
    .players-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .players-table th, .players-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .players-table th {
      background-color: #f2f2f2;
      font-weight: bold;
      color: #333;
    }
    .players-table tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .players-table button {
      background-color: #dc3545;
    }
    .players-table button:hover {
      background-color: #c82333;
    }
    .error-message {
      color: red;
      text-align: center;
      margin-top: 15px;
      margin-bottom: 15px;
    }
  `]
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  newPlayerName = '';
  newPlayerTeam = '';
  isAdmin = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private playerService: PlayerService) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.currentUserValue?.username === 'admin'; // Simple admin check for now
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.playerService.getPlayers().subscribe(
      data => {
        this.players = data;
      },
      error => {
        this.errorMessage = 'Failed to load players. ' + (error.error || error.message);
        console.error('Error loading players:', error);
      }
    );
  }

  addPlayer(): void {
    if (!this.newPlayerName) {
      this.errorMessage = 'Player name is required.';
      return;
    }
    this.playerService.addPlayer({ name: this.newPlayerName, team: this.newPlayerTeam }).subscribe(
      player => {
        this.players.push(player);
        this.newPlayerName = '';
        this.newPlayerTeam = '';
        this.errorMessage = null;
      },
      error => {
        this.errorMessage = 'Failed to add player. ' + (error.error || error.message);
        console.error('Error adding player:', error);
      }
    );
  }

  deletePlayer(id: number): void {
    if (confirm('Are you sure you want to delete this player?')) {
      this.playerService.deletePlayer(id).subscribe(
        () => {
          this.players = this.players.filter(p => p.id !== id);
          this.errorMessage = null;
        },
        error => {
          this.errorMessage = 'Failed to delete player. ' + (error.error || error.message);
          console.error('Error deleting player:', error);
        }
      );
    }
  }
}
