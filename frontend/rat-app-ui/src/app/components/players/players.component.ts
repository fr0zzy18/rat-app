import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Import ReactiveFormsModule
import { PlayerService, Player, AddPlayerDto } from '../../core/services/player.service';
import { AuthService } from '../../core/services/auth.service'; // To check for admin role

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule], // Add ReactiveFormsModule here
  template: `
    <div class="players-container">
      <h2>Players</h2>

      <button *ngIf="canManagePlayers" class="add-player-button" (click)="openAddPlayerModal()">Add New Player</button>

      <div *ngIf="players.length === 0 && !loading" class="no-players">
        No players found.
      </div>

      <div *ngIf="loading" class="loading-message">Loading players...</div>
      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div *ngIf="players.length > 0" class="player-list">
        <h3>All Players</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Spec</th>
              <th>Role</th>
              <th>Faction</th>
              <th>Guild</th>
              <th>Static</th>
              <th *ngIf="canManagePlayers">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let player of players">
              <td>{{ player.name }}</td>
              <td>{{ player.class }}</td>
              <td>{{ player.spec }}</td>
              <td>{{ player.role }}</td>
              <td>{{ player.faction }}</td>
              <td>{{ player.guild }}</td>
              <td>{{ player.static }}</td>
              <td *ngIf="canManagePlayers">
                <button (click)="openEditPlayerModal(player)" class="edit-button">Edit</button>
                <button (click)="deletePlayer(player.id)" class="delete-button">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Player Modal -->
      <div *ngIf="showAddPlayerModal" class="modal-overlay">
        <div class="modal-content">
          <h3>Add New Player</h3>
          <form (ngSubmit)="onAddPlayer()" #addPlayerForm="ngForm">
            <div class="form-group">
              <label for="playerName">Name</label>
              <input type="text" id="playerName" name="playerName" [(ngModel)]="newPlayer.name" required>
            </div>
            <div class="form-group">
              <label for="playerClass">Class</label>
              <input type="text" id="playerClass" name="playerClass" [(ngModel)]="newPlayer.class" required>
            </div>
            <div class="form-group">
              <label for="playerSpec">Spec</label>
              <input type="text" id="playerSpec" name="playerSpec" [(ngModel)]="newPlayer.spec" required>
            </div>
            <div class="form-group">
              <label for="playerRole">Role</label>
              <input type="text" id="playerRole" name="playerRole" [(ngModel)]="newPlayer.role" required>
            </div>
            <div class="form-group">
              <label for="playerFaction">Faction</label>
              <input type="text" id="playerFaction" name="playerFaction" [(ngModel)]="newPlayer.faction" required>
            </div>
            <div class="form-group">
              <label for="playerGuild">Guild</label>
              <input type="text" id="playerGuild" name="playerGuild" [(ngModel)]="newPlayer.guild">
            </div>
            <div class="form-group">
              <label for="playerStatic">Static</label>
              <input type="text" id="playerStatic" name="playerStatic" [(ngModel)]="newPlayer.static">
            </div>
            <div class="modal-actions">
              <button type="submit" [disabled]="!addPlayerForm.form.valid">Add Player</button>
              <button type="button" class="cancel-button" (click)="closeAddPlayerModal()">Cancel</button>
            </div>
          </form>
          <div *ngIf="addPlayerError" class="error-message">{{ addPlayerError }}</div>
        </div>
      </div>

      <!-- Edit Player Modal -->
      <div *ngIf="showEditPlayerModal && editingPlayer" class="modal-overlay">
        <div class="modal-content">
          <h3>Edit Player: {{ editingPlayer.name }}</h3>
          <form (ngSubmit)="onUpdatePlayer()" #editPlayerForm="ngForm">
            <input type="hidden" name="id" [(ngModel)]="editingPlayer.id">
            <div class="form-group">
              <label for="editPlayerName">Name</label>
              <input type="text" id="editPlayerName" name="name" [(ngModel)]="editingPlayer.name" required>
            </div>
            <div class="form-group">
              <label for="editPlayerClass">Class</label>
              <input type="text" id="editPlayerClass" name="class" [(ngModel)]="editingPlayer.class" required>
            </div>
            <div class="form-group">
              <label for="editPlayerSpec">Spec</label>
              <input type="text" id="editPlayerSpec" name="spec" [(ngModel)]="editingPlayer.spec" required>
            </div>
            <div class="form-group">
              <label for="editPlayerRole">Role</label>
              <input type="text" id="editPlayerRole" name="role" [(ngModel)]="editingPlayer.role" required>
            </div>
            <div class="form-group">
              <label for="editPlayerFaction">Faction</label>
              <input type="text" id="editPlayerFaction" name="faction" [(ngModel)]="editingPlayer.faction" required>
            </div>
            <div class="form-group">
              <label for="editPlayerGuild">Guild</label>
              <input type="text" id="editPlayerGuild" name="guild" [(ngModel)]="editingPlayer.guild">
            </div>
            <div class="form-group">
              <label for="editPlayerStatic">Static</label>
              <input type="text" id="editPlayerStatic" name="static" [(ngModel)]="editingPlayer.static">
            </div>
            <div class="modal-actions">
              <button type="submit">Update Player</button>
              <button type="button" class="cancel-button" (click)="closeEditPlayerModal()">Cancel</button>
            </div>
          </form>
          <div *ngIf="editPlayerError" class="error-message">{{ editPlayerError }}</div>
        </div>
      </div>
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
    .edit-button {
      background-color: #007bff; /* Blue for edit button */
      margin-right: 5px;
    }
    .edit-button:hover {
      background-color: #0056b3;
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
    input[type="text"] {
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
  `]
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  newPlayer: AddPlayerDto = { name: '', class: '', spec: '', role: '', faction: '', guild: '', static: '' };
  loading = false;
  errorMessage: string | null = null;
  addPlayerError: string | null = null;
  canManagePlayers = false; // Renamed from isAdmin
  showAddPlayerModal: boolean = false;
  showEditPlayerModal: boolean = false; // New: control edit modal visibility
  editingPlayer: Player | null = null; // New: player being edited
  editPlayerError: string | null = null; // New: error for edit modal

  constructor(private playerService: PlayerService, private authService: AuthService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.checkPlayerManagementPermissions(); // Renamed
    this.loadPlayers();
  }

  checkPlayerManagementPermissions(): void { // Renamed
    this.canManagePlayers = this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
    console.log('canManagePlayers:', this.canManagePlayers);
  }

  loadPlayers(): void {
    this.loading = true;
    this.errorMessage = null;
    this.playerService.getAllPlayers().subscribe({
      next: (data) => {
        this.players = data;
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
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
    this.newPlayer = { name: '', class: '', spec: '', role: '', faction: '', guild: '', static: '' }; // Reset form for new entry
    this.cdr.detectChanges();
  }

  closeAddPlayerModal(): void {
    this.showAddPlayerModal = false;
    this.addPlayerError = null;
    this.newPlayer = { name: '', class: '', spec: '', role: '', faction: '', guild: '', static: '' };
    this.cdr.detectChanges();
  }

  onAddPlayer(): void {
    this.addPlayerError = null;
    if (!this.newPlayer.name || !this.newPlayer.class || !this.newPlayer.spec || !this.newPlayer.role || !this.newPlayer.faction) {
      this.addPlayerError = 'Player Name, Class, Spec, Role, and Faction cannot be empty.';
      this.cdr.detectChanges();
      return;
    }

    this.playerService.addPlayer(this.newPlayer).subscribe({
      next: (player) => {
        this.players.push(player); // Add the new player to the list
        this.players.sort((a, b) => a.name.localeCompare(b.name)); // Sort by name
        this.closeAddPlayerModal(); // Close modal on success
      },
      error: (err) => {
        this.addPlayerError = err.error || 'Failed to add player.';
        this.cdr.detectChanges();
        console.error('Error adding player:', err);
      }
    });
  }

  openEditPlayerModal(player: Player): void {
    this.editingPlayer = { ...player }; // Create a copy to avoid direct mutation
    this.showEditPlayerModal = true;
    this.editPlayerError = null; // Clear previous errors
    this.cdr.detectChanges();
  }

  closeEditPlayerModal(): void {
    this.editingPlayer = null;
    this.showEditPlayerModal = false;
    this.editPlayerError = null; // Clear error message when closing
    this.cdr.detectChanges();
  }

  onUpdatePlayer(): void {
    this.editPlayerError = null;
    if (!this.editingPlayer || !this.editingPlayer.name || !this.editingPlayer.class || !this.editingPlayer.spec || !this.editingPlayer.role || !this.editingPlayer.faction) {
      this.editPlayerError = 'Player Name, Class, Spec, Role, and Faction cannot be empty.';
      this.cdr.detectChanges();
      return;
    }

    this.playerService.updatePlayer(this.editingPlayer).subscribe({
      next: (updatedPlayer) => {
        const index = this.players.findIndex(p => p.id === updatedPlayer.id);
        if (index !== -1) {
          this.players[index] = updatedPlayer; // Update player in the list
          this.players.sort((a, b) => a.name.localeCompare(b.name)); // Re-sort
        }
        this.closeEditPlayerModal();
      },
      error: (err) => {
        this.editPlayerError = err.error || 'Failed to update player.';
        this.cdr.detectChanges();
        console.error('Error updating player:', err);
      }
    });
  }

  deletePlayer(id: number): void {
    if (!confirm('Are you sure you want to delete this player?')) {
      return;
    }

    this.playerService.deletePlayer(id).subscribe({
      next: () => {
        this.players = this.players.filter(p => p.id !== id);
        this.cdr.detectChanges(); // Force change detection after deleting
      },
      error: (err) => {
        alert('Failed to delete player: ' + (err.error || 'Unknown error'));
        console.error('Error deleting player:', err);
      }
    });
  }
}
