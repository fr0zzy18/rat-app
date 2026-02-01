import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common'; // Import NgClass for dynamic styling
import { FormsModule } from '@angular/forms'; // FormsModule for ngModel
import { PlayerService, Player, AddPlayerRequestDto } from '../../core/services/player.service'; // Only import Player
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass], // Add NgClass
  template: `
    <div class="players-container">
      <h2>Manage Players</h2>

      <div class="category-toggles">
        <button
          *ngFor="let cat of categories"
          [ngClass]="{ 'active': selectedCategory === cat }"
          (click)="onCategoryChange(cat)"
          class="category-button"
        >
          {{ cat === '' ? 'All' : cat }}
        </button>
      </div>

      <button *ngIf="canManagePlayers | async" class="add-player-button" (click)="openAddPlayerModal()">Add New Player</button>

      <div *ngIf="players.length === 0 && !loading" class="no-players">
        No players found.
      </div>

      <div *ngIf="loading" class="loading-message">Loading players...</div>
      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div *ngIf="players.length > 0" class="player-list">
        <h3>Current Players (Category: {{ selectedCategory === '' ? 'All' : selectedCategory }})</h3>
        <table>
          <thead>
            <tr>
              <th></th> <!-- For Thumbnail -->
              <th>Name</th>
              <th>Race</th>
              <th>Class</th>
              <th>M+ Score</th> <!-- New column for Mythic Plus Score -->
              <th>Spec</th>
              <th>Role</th>
              <th>Faction</th>
              <th>Guild</th> <!-- New column for Guild -->
              <th>Realm</th>
              <th>Region</th>
              <th *ngIf="canManagePlayers | async">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let player of players">
              <td><img [src]="player.thumbnail_url" alt="Player Thumbnail" class="player-thumbnail"></td>
              <td><a [href]="player.profileUrl" target="_blank">{{ player.name }}</a></td>
              <td>{{ player.race }}</td>
              <td>{{ player.class }}</td>
              <td>{{ player.mythicPlusScore | number:'1.0-2' }}</td> <!-- Display Mythic Plus Score -->
              <td>{{ player.active_spec_name }}</td>
              <td>{{ player.active_spec_role }}</td>
              <td>{{ player.faction }}</td>
              <td>{{ player.guildName }}</td> <!-- Display Guild Name -->
              <td>{{ player.realm }}</td>
              <td>{{ player.region }}</td>
              <td *ngIf="canManagePlayers | async">
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
      max-width: 1200px; /* Increased max-width for more columns */
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

    /* Category Toggles */
    .category-toggles {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
      gap: 10px;
    }
    .category-button {
      background-color: #e0e0e0;
      color: #333;
      padding: 8px 15px;
      border: 1px solid #ccc;
      border-radius: 5px;
      cursor: pointer;
      font-size: 15px;
      transition: background-color 0.2s ease;
    }
    .category-button:hover:not(.active) {
      background-color: #d0d0d0;
    }
    .category-button.active {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }
  `]
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  // Initialize newPlayerInput with default category
  newPlayerInput: AddPlayerRequestDto = { region: 'eu', realm: 'tarren-mill', name: '', category: '' };
  loading = false;
  errorMessage: string | null = null;
  addPlayerError: string | null = null;
  canManagePlayers: Observable<boolean>; // Change to Observable
  showAddPlayerModal: boolean = false;
  
  categories: string[] = ['All', 'Nova', 'Bambattles']; // Available categories
  selectedCategory: string = 'All'; // Default selected category

  constructor(private playerService: PlayerService, public authService: AuthService, private cdr: ChangeDetectorRef) {
    // Initialize canManagePlayers as an Observable
    this.canManagePlayers = this.authService.currentUser.pipe(
      map(user => user?.roles?.includes('Admin') || user?.roles?.includes('Manager') || false)
    );
  }

  ngOnInit(): void {
    this.loadPlayers(); 
  }

  loadPlayers(): void { 
    this.loading = true;
    this.errorMessage = null;
    const categoryParam = this.selectedCategory === 'All' ? '' : this.selectedCategory;
    this.playerService.getAllPlayers(categoryParam).subscribe({
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

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.loadPlayers(); // Reload players for the selected category
  }

  openAddPlayerModal(): void {
    this.showAddPlayerModal = true;
    this.addPlayerError = null;
    // Reset form for new entry, category will be assigned from selectedCategory on add
    this.newPlayerInput = { region: 'eu', realm: 'tarren-mill', name: '', category: '' }; 
    this.cdr.detectChanges();
  }

  closeAddPlayerModal(): void {
    this.showAddPlayerModal = false;
    this.addPlayerError = null;
    this.newPlayerInput = { region: 'eu', realm: 'tarren-mill', name: '', category: '' }; // Reset form
    this.cdr.detectChanges();
  }

  onAddPlayer(): void { 
    this.addPlayerError = null;
    const { region, realm, name } = this.newPlayerInput; // No category destructuring

    // Assign category based on selectedCategory
    const categoryToAssign = this.selectedCategory === 'All' ? '' : this.selectedCategory;
    this.newPlayerInput.category = categoryToAssign;

    if (!region || !realm || !name) { // Category is no longer explicitly required from form
      this.addPlayerError = 'Region, Realm, and Character Name cannot be empty.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.playerService.addPlayer(this.newPlayerInput).subscribe({ 
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

  deletePlayer(id: number, name: string): void { 
    if (!confirm(`Are you sure you want to delete player ${name} from the database?`)) {
      return;
    }

    this.playerService.deletePlayer(id).subscribe({ 
      next: () => {
        this.loadPlayers(); 
      },
      error: (err) => {
        alert('Failed to delete player: ' + (err.error || 'Unknown error'));
        console.error('Error deleting player:', err);
      }
    });
  }
}
