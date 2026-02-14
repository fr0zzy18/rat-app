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
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css'] // Use styleUrls
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  // Initialize newPlayerInput with default category
  newPlayerInput: AddPlayerRequestDto = { region: 'eu', realm: '', name: '', category: '' };
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

  classColors: Record<string, string> = {
  'Death Knight': '#C41E3A',
  'Demon Hunter': '#A330C9',
  'Druid': '#FF7C0A',
  'Evoker': '#33937F',
  'Hunter': '#AAD372',
  'Mage': '#3FC7EB',
  'Monk': '#00FF98',
  'Paladin': '#F48CBA',
  'Priest': '#FFFFFF',
  'Rogue': '#FFF468',
  'Shaman': '#0070DD',
  'Warlock': '#8788EE',
  'Warrior': '#C69B6D'
};

getClassColor(className: string): string {
  return this.classColors[className] || '#ffffff';
}

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.loadPlayers(); // Reload players for the selected category
  }

  openAddPlayerModal(): void {
    this.showAddPlayerModal = true;
    this.addPlayerError = null;
    // Reset form for new entry, category will be assigned from selectedCategory on add
    this.newPlayerInput = { region: 'eu', realm: '', name: '', category: '' }; 
    this.cdr.detectChanges();
  }

  closeAddPlayerModal(): void {
    this.showAddPlayerModal = false;
    this.addPlayerError = null;
    this.newPlayerInput = { region: 'eu', realm: '', name: '', category: '' }; // Reset form
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
