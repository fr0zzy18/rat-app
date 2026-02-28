import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerService, Player, AddPlayerRequestDto } from '../../core/services/player.service';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryService, Category } from '../../core/services/category.service';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css']
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  newPlayerInput: AddPlayerRequestDto = { region: 'eu', realm: '', name: '', category: '', streamLink: '' };
  loading = false;
  errorMessage: string | null = null;
  addPlayerError: string | null = null;
  canManagePlayers: Observable<boolean>;
  availableCategories: Category[] = [];
  newCategoryName: string = '';
  showNewCategoryPopup: boolean = false;
  canManageCategories: Observable<boolean>;
  showDeleteCategoryPopup: boolean = false;
  selectedCategoryToDelete: Category | null = null;

  showAddPlayerModal: boolean = false;
  updatingCategoryPlayerId: number | null = null;
  selectedCategory: string = 'All';

  constructor(
    private playerService: PlayerService, 
    public authService: AuthService, 
    private cdr: ChangeDetectorRef,
    private categoryService: CategoryService
  ) {
    this.canManagePlayers = this.authService.currentUser.pipe(
      map(user => user?.roles?.includes('Admin') || user?.roles?.includes('Manager') || false)
    );
    this.canManageCategories = this.authService.currentUser.pipe(
      map(user => user?.roles?.includes('Admin') || user?.roles?.includes('Manager') || false)
    );
  }

  ngOnInit(): void {
    this.loadPlayers(); 
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.availableCategories = [{ id: 0, name: 'All' }, ...categories];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.errorMessage = 'Failed to load categories.';
      }
    });
  }

  openNewCategoryPopup(): void {
    this.showNewCategoryPopup = true;
    this.newCategoryName = '';
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  closeNewCategoryPopup(): void {
    this.showNewCategoryPopup = false;
    this.newCategoryName = '';
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  createNewCategory(): void {
    if (this.newCategoryName.trim()) {
      this.categoryService.addCategory(this.newCategoryName.trim()).subscribe({
        next: (category) => {
          this.closeNewCategoryPopup();
          this.loadCategories();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error adding category:', err);
          this.errorMessage = err.message || 'Failed to add category.';
        }
      });
    } else {
      this.errorMessage = 'Category name cannot be empty.';
    }
  }
  openDeleteCategoryPopup(): void {
    this.showDeleteCategoryPopup = true;
    this.selectedCategoryToDelete = null;
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  closeDeleteCategoryPopup(): void {
    this.showDeleteCategoryPopup = false;
    this.selectedCategoryToDelete = null;
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  deleteSelectedCategory(): void {
    if (this.selectedCategoryToDelete && this.selectedCategoryToDelete.id) {
      if (this.selectedCategoryToDelete.name === 'All') {
        this.errorMessage = "The 'All' category cannot be deleted.";
        this.cdr.detectChanges();
        return;
      }
      if (confirm(`Are you sure you want to delete the category "${this.selectedCategoryToDelete.name}"?`)) {
        this.categoryService.deleteCategory(this.selectedCategoryToDelete.id).subscribe({
          next: () => {
            this.closeDeleteCategoryPopup();
            this.loadCategories();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error deleting category:', err);
            this.errorMessage = err.message || 'Failed to delete category.';
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.errorMessage = 'Please select a category to delete.';
    }
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

  onCategoryChange(categoryName: string): void {
    this.selectedCategory = categoryName;
    this.loadPlayers();
  }

  get categoriesForDeleteDropdown(): Category[] {
    return this.availableCategories.filter(c => c.name !== 'All');
  }

  get categoriesForMoveDropdown(): Category[] {
    return this.availableCategories.filter(c => c.name !== 'All');
  }

  onPlayerCategoryChange(player: Player, newCategory: string): void {
    if (newCategory === player.category) return;

    const oldCategory = player.category;
    player.category = newCategory;
    this.updatingCategoryPlayerId = player.id;

    this.playerService.updatePlayerCategory(player.id, newCategory).subscribe({
      next: (updated) => {
        player.category = updated.category;
        if (this.selectedCategory !== 'All' && newCategory !== this.selectedCategory) {
          this.loadPlayers();
        }
        this.updatingCategoryPlayerId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        player.category = oldCategory;
        this.updatingCategoryPlayerId = null;
        this.errorMessage = err.error?.message || 'Failed to update category.';
        this.cdr.detectChanges();
      }
    });
  }

  openAddPlayerModal(): void {
    this.showAddPlayerModal = true;
    this.addPlayerError = null;
    this.newPlayerInput = { region: 'eu', realm: '', name: '', category: '', streamLink: '' }; 
    this.cdr.detectChanges();
  }

  closeAddPlayerModal(): void {
    this.showAddPlayerModal = false;
    this.addPlayerError = null;
    this.newPlayerInput = { region: 'eu', realm: '', name: '', category: '', streamLink: '' };
    this.cdr.detectChanges();
  }

  onAddPlayer(): void { 
    this.addPlayerError = null;
    const { region, realm, name, streamLink } = this.newPlayerInput; 
    const categoryToAssign = this.selectedCategory === 'All' ? '' : this.selectedCategory;
    this.newPlayerInput.category = categoryToAssign;

    if (!region || !realm || !name) { 
      this.addPlayerError = 'Region, Realm, and Character Name cannot be empty.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.playerService.addPlayer(this.newPlayerInput).subscribe({ 
      next: (player) => {
        this.loadPlayers();
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
  getWarcraftLogsUrl(player: Player): string {
    if (!player || !player.region || !player.realm || !player.name) {
      return '#';
    }
    const slugifiedRealm = player.realm.toLowerCase().replace(/\s/g, '-');
    return `https://www.warcraftlogs.com/character/${player.region}/${slugifiedRealm}/${player.name}`;
  }
  getWoWProfileUrl(player: Player): string {
    if (!player || !player.region || !player.realm || !player.name) {
      return '#';
    }
    const slugifiedRealm = player.realm.toLowerCase().replace(/\s/g, '-');
    return `https://worldofwarcraft.blizzard.com/en-gb/character/${player.region}/${slugifiedRealm}/${player.name}`;
  }
}
