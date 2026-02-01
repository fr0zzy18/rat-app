import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // FormsModule for ngModel
import { PlayerService, Player, AddPlayerRequestDto } from '../../core/services/player.service'; // Only import Player
import { AuthService } from '../../core/services/auth.service';

interface RaiderIoPlayerInput { // This interface is now redundant but kept for reference on newPlayerInput type
  region: string;
  realm: string;
  name: string;
}

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="players-container">
      <h2>Manage Players</h2>

      <button *ngIf="canManagePlayers" class="add-player-button" (click)="openAddPlayerModal()">Add New Player</button>

      <div *ngIf="players.length === 0 && !loading" class="no-players">
        No players found.
      </div>

      <div *ngIf="loading" class="loading-message">Loading players...</div>
      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div *ngIf="players.length > 0" class="player-list">
        <h3>Current Players</h3>
        <table>
          <thead>
            <tr>
              <th></th> <!-- For Thumbnail -->
              <th>Name</th>
              <th>Race</th>
              <th>Class</th>
              <th>Spec</th>
              <th>Role</th>
              <th>Faction</th>
              <th>Realm</th>
              <th>Region</th>
              <th *ngIf="canManagePlayers">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let player of players">
              <td><img [src]="player.thumbnail_url" alt="Player Thumbnail" class="player-thumbnail"></td>
              <td>{{ player.name }}</td>
              <td>{{ player.race }}</td>
              <td>{{ player.player_class }}</td>
              <td>{{ player.active_spec_name }}</td>
              <td>{{ player.active_spec_role }}</td>
              <td>{{ player.faction }}</td>
              <td>{{ player.realm }}</td>
              <td>{{ player.region }}</td>
              <td *ngIf="canManagePlayers">
                <button (click)="deletePlayer(player.id, player.name)" class="delete-button">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Player Modal -->
      <div *ngIf="showAddPlayerModal" class="modal-overlay">
        <div class="modal-content">
          <h3>Add New Player from Raider.IO</h3>
          <form (ngSubmit)="onAddPlayer()" #addPlayerForm="ngForm">
            <div class="form-group">
              <label for="playerRegion">Region</label>
              <select id="playerRegion" name="playerRegion" [(ngModel)]="newPlayerInput.region" required class="form-control">
                <option value="us">US</option>
                <option value="eu">EU</option>
                <option value="kr">KR</option>
                <option value="tw">TW</option>
              </select>
            </div>
            <div class="form-group">
              <label for="playerRealm">Realm</label>
              <input type="text" id="playerRealm" name="playerRealm" [(ngModel)]="newPlayerInput.realm" required class="form-control">
            </div>
            <div class="form-group">
              <label for="playerName">Character Name</label>
              <input type="text" id="playerName" name="playerName" [(ngModel)]="newPlayerInput.name" required class="form-control">
            </div>
            <div class="modal-actions">
              <button type="submit" [disabled]="!addPlayerForm.form.valid">Add Player</button>
              <button type="button" class="cancel-button" (click)="closeAddPlayerModal()">Cancel</button>
            </div>
          </form>
          <div *ngIf="addPlayerError" class="error-message">{{ addPlayerError }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .players-container {
      max-width: 1000px;
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
    .add-player-button {
      display: block;
      width: fit-content;
      margin: 20px auto;
      padding: 10px 20px;
      background-color: #28a745; /* Green color for add button */
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    .add-player-button:hover {
      background-color: #218838;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }
    input[type="text"], select.form-control {
      width: 100%;
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
      margin-right: 10px;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    .delete-button {
      background-color: #dc3545;
    }
    .player-list {
      margin-top: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .no-players, .loading-message, .error-message {
      text-align: center;
      margin-top: 20px;
      font-size: 1.1em;
    }
    .error-message {
      color: red;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background-color: #fff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 500px;
      position: relative;
    }
    .modal-content h3 {
      margin-top: 0;
      margin-bottom: 20px;
      text-align: center;
      color: #333;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    .modal-actions button {
      width: auto;
      min-width: 100px;
    }
    .modal-actions .cancel-button {
      background-color: #6c757d;
    }
    .modal-actions .cancel-button:hover {
      background-color: #5a6268;
    }
    .player-thumbnail {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }
  `]
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  newPlayerInput: AddPlayerRequestDto = { region: 'eu', realm: 'tarren-mill', name: '' }; // Updated for backend DTO
  loading = false;
  errorMessage: string | null = null;
  addPlayerError: string | null = null;
  canManagePlayers = false;
  showAddPlayerModal: boolean = false;

  constructor(private playerService: PlayerService, private authService: AuthService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.checkPlayerManagementPermissions();
    this.loadPlayers(); // Re-enable loading players from backend
  }

  checkPlayerManagementPermissions(): void {
    this.canManagePlayers = this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
    console.log('canManagePlayers:', this.canManagePlayers);
  }

  loadPlayers(): void { // Reintroduced loadPlayers to fetch from backend
    this.loading = true;
    this.errorMessage = null;
    this.playerService.getAllPlayers().subscribe({
      next: (data) => {
        this.players = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load players. Please ensure you are logged in and have permissions.';
        this.loading = false;
        console.error('Error loading players:', err);
      }
    });
  }

  openAddPlayerModal(): void {
    this.showAddPlayerModal = true;
    this.addPlayerError = null;
    this.newPlayerInput = { region: 'eu', realm: 'tarren-mill', name: '' }; // Reset form for new entry
    this.cdr.detectChanges();
  }

  closeAddPlayerModal(): void {
    this.showAddPlayerModal = false;
    this.addPlayerError = null;
    this.newPlayerInput = { region: 'eu', realm: 'tarren-mill', name: '' }; // Reset form
    this.cdr.detectChanges();
  }

  onAddPlayer(): void { // Changed name from onImportPlayer
    this.addPlayerError = null;
    const { region, realm, name } = this.newPlayerInput;

    if (!region || !realm || !name) {
      this.addPlayerError = 'Region, Realm, and Character Name cannot be empty.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.playerService.addPlayer(this.newPlayerInput).subscribe({ // Call backend addPlayer
      next: (player) => {
        this.loadPlayers(); // Refresh list after adding
        this.closeAddPlayerModal();
        this.loading = false;
      },
      error: (err) => {
        this.addPlayerError = err.error?.message || 'Failed to add player. Check region, realm, and name.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error adding player:', err);
      }
    });
  }

  deletePlayer(id: number, name: string): void { // Changed to accept id and name for confirmation
    if (!confirm(`Are you sure you want to delete player ${name} from the database?`)) {
      return;
    }

    this.playerService.deletePlayer(id).subscribe({ // Call backend deletePlayer
      next: () => {
        this.loadPlayers(); // Refresh list after deleting
      },
      error: (err) => {
        alert('Failed to delete player: ' + (err.error || 'Unknown error'));
        console.error('Error deleting player:', err);
      }
    });
  }
}