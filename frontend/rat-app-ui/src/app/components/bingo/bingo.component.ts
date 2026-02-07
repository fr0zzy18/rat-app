import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BingoCard } from '../../core/models/bingo-card.model';
import { BingoService } from '../../core/services/bingo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router'; // Import Router
import { GameService } from '../../core/services/game.service'; // Import GameService

import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Import HttpClient

@Component({
  selector: 'app-bingo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bingo.component.html',
  styleUrls: ['./bingo.component.css']
})
export class BingoComponent implements OnInit {
  bingoCards: BingoCard[] = [];
  newCardPhrase: string = '';
  canCreate: boolean = false;
  canDelete: boolean = false;
  canEdit: boolean = false; // New property for editing permission
  successMessage: string | null = null;
  errorMessage: string | null = null;
  selectedCards: BingoCard[] = []; // Array to hold selected cards
  gameIdToJoin: string = ''; // Property to hold Game ID for joining
  reconnectGameId: string | null = null; // New property to hold game ID for reconnecting

  editingCardId: number | null = null; // To track which card is being edited
  editedCardPhrase: string = '';       // To hold the phrase during editing

  private gameApiUrl = 'http://localhost:5211/api/game';

  constructor(
    private bingoService: BingoService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private router: Router, // Inject Router
    private gameService: GameService, // Inject GameService
    private http: HttpClient // Inject HttpClient
  ) { }

  ngOnInit(): void {
    this.getBingoCards();
    this.checkRoles();
    this.checkActiveGame(); // New: Check for active/paused game
  }

  // New: Check for an active or paused game for the current user
  checkActiveGame(): void {
    this.http.get<any>(`${this.gameApiUrl}/my-active-game`).subscribe({
      next: (gameDetails) => {
        // Only show reconnect button if game is in a reconnectable state
        if (gameDetails && gameDetails.id && (gameDetails.status === 'InProgress' || gameDetails.status === 'Paused')) {
          this.reconnectGameId = gameDetails.id;
          // Optionally store other game details if needed for display
        } else {
          this.reconnectGameId = null; // Do not show reconnect button for other statuses
        }
        this.cdr.detectChanges(); // Update view to show/hide reconnect button
      },
      error: (err: HttpErrorResponse) => {
        // 404 Not Found is expected if no active game, others are actual errors
        if (err.status !== 404) {
          console.error('Error checking for active game:', err);
        }
        this.reconnectGameId = null; // Ensure it's null if no game or error
        this.cdr.detectChanges();
      }
    });
  }

  // New: Reconnect to an existing game and resume it
  onReconnect(): void {
    if (this.reconnectGameId) {
      // Make API call to resume the game
      this.http.post<any>(`${this.gameApiUrl}/${this.reconnectGameId}/resume`, {})
        .subscribe({
          next: (resumedGame) => {
            this.successMessage = 'Game resumed successfully. Reconnecting...';
            this.cdr.detectChanges();
            this.router.navigate(['/game-room', this.reconnectGameId]);
          },
          error: (err: HttpErrorResponse) => {
            this.errorMessage = err.error?.message || 'Failed to resume game. It might have been abandoned or is no longer available.';
            console.error('Error resuming game:', err);
            this.cdr.detectChanges();
          }
        });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getBingoCards(): void {
    this.bingoService.getBingoCards().subscribe({
      next: (cards) => {
        this.bingoCards = cards;
        this.cdr.detectChanges(); // Trigger change detection after loading cards
      },
      error: (err) => {
        this.errorMessage = 'Failed to load bingo cards.';
        console.error('Error loading bingo cards:', err);
        this.cdr.detectChanges(); // Trigger change detection for error message
      }
    });
  }

  createBingoCard(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.newCardPhrase.trim()) {
      this.bingoService.createBingoCard(this.newCardPhrase).subscribe({
        next: (card) => {
          this.bingoCards = [...this.bingoCards, card]; // Create new array reference
          this.newCardPhrase = '';
          this.successMessage = 'Bingo card created successfully!';
          this.cdr.detectChanges(); // Trigger change detection
        },
        error: (err) => {
          this.errorMessage = 'Failed to create bingo card. You might not have the required permissions.';
          console.error('Error creating bingo card:', err);
          this.cdr.detectChanges(); // Trigger change detection for error message
        }
      });
    } else {
      this.errorMessage = 'Phrase cannot be empty.';
      this.cdr.detectChanges(); // Trigger change detection for error message
    }
  }

  deleteBingoCard(id: number): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (confirm('Are you sure you want to delete this bingo card?')) {
      this.bingoService.deleteBingoCard(id).subscribe({
        next: () => {
          this.bingoCards = this.bingoCards.filter(card => card.id !== id); // Optimistic update
          this.successMessage = 'Bingo card deleted successfully!';
          this.cdr.detectChanges(); // Trigger change detection
        },
        error: (err) => {
          this.errorMessage = 'Failed to delete bingo card. You might not have the required permissions.';
          console.error('Error deleting bingo card:', err);
          this.cdr.detectChanges(); // Trigger change detection for error message
        }
      });
    }
  }

  checkRoles(): void {
    this.canCreate = this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
    this.canDelete = this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
    this.canEdit = this.authService.hasRole('Admin') || this.authService.hasRole('Manager'); // Set canEdit
  }

  // Toggle card selection (existing method)
  toggleCardSelection(card: BingoCard): void {
    // Prevent selection/deselection if card is currently being edited
    if (this.editingCardId === card.id) {
      return;
    }

    const index = this.selectedCards.findIndex(c => c.id === card.id);
    if (index > -1) {
      this.selectedCards.splice(index, 1); // Deselect
    } else if (this.selectedCards.length < 24) {
      this.selectedCards.push(card); // Select, if less than 24 selected
    } else {
      this.errorMessage = 'You can select a maximum of 24 cards.';
    }
    this.cdr.detectChanges(); // Update view
  }

  // Select 24 random cards (existing method)
  selectRandomCards(): void {
    this.selectedCards = []; // Clear current selection
    this.errorMessage = null;
    this.successMessage = null;

    if (this.bingoCards.length < 24) {
      this.errorMessage = 'Not enough bingo cards available to select 24 random cards.';
      this.cdr.detectChanges();
      return;
    }

    const shuffledCards = [...this.bingoCards].sort(() => 0.5 - Math.random()); // Shuffle a copy
    this.selectedCards = shuffledCards.slice(0, 24); // Take the first 24

    this.successMessage = '24 random cards selected.';
    this.cdr.detectChanges(); // Update view
  }

  // New: Start editing a card
  editBingoCard(card: BingoCard): void {
    this.editingCardId = card.id;
    this.editedCardPhrase = card.phrase;
  }

  // New: Cancel editing
  cancelEdit(): void {
    this.editingCardId = null;
    this.editedCardPhrase = '';
    this.errorMessage = null; // Clear any error messages
  }

  // New: Update a bingo card
  updateBingoCard(card: BingoCard): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (!this.editedCardPhrase.trim()) {
      this.errorMessage = 'Card phrase cannot be empty.';
      return;
    }

    if (this.editingCardId === card.id) {
      const updatedCard = { id: card.id, phrase: this.editedCardPhrase }; // Ensure updatedCard has id for service call
      this.bingoService.updateBingoCard(updatedCard.id!, updatedCard).subscribe({
        next: (response: BingoCard) => {
          const index = this.bingoCards.findIndex(c => c.id === response.id);
          if (index > -1) {
            this.bingoCards[index] = response; // Update the card in the list
          }
          // Also update selectedCards if the edited card was selected
          const selectedIndex = this.selectedCards.findIndex(c => c.id === response.id);
          if (selectedIndex > -1) {
            this.selectedCards[selectedIndex] = response;
          }

          this.successMessage = 'Bingo card updated successfully!';
          this.cancelEdit(); // Exit editing mode
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.error || 'Failed to update bingo card. You might not have the required permissions.';
          console.error('Error updating bingo card:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Check if a card is selected (existing method)
  isCardSelected(card: BingoCard): boolean {
    return this.selectedCards.some(c => c.id === card.id);
  }

  // Check if game can be started (existing getter)
  get canStartGame(): boolean {
    return this.selectedCards.length === 24;
  }

  // Start game (as first player, creating a new game) (existing method)
  startGame(): void {
    this.successMessage = null;
    this.errorMessage = null;
    if (this.canStartGame) {
      const payload = { player1SelectedCardIds: this.selectedCards.map(c => c.id) };
      this.http.post<any>(`${this.gameApiUrl}/create`, payload).subscribe({
        next: (response) => {
          this.gameService.setSelectedCards(this.selectedCards); // Store selected cards
          this.gameService.setGameId(response.id); // Store game ID from backend
          this.router.navigate(['/game-room', response.id]); // Navigate with ID
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.error || 'Failed to create game.';
          console.error('Error creating game:', err);
        }
      });
    } else {
      this.errorMessage = 'Please select exactly 24 cards to start a new game.';
    }
  }

  // Join game (as second player, joining an existing game) (existing method)
  joinGame(): void {
    this.successMessage = null;
    this.errorMessage = null;
    if (!this.gameIdToJoin) {
      this.errorMessage = 'Please enter a Game ID to join.';
      return;
    }
    // No longer check canStartGame for joining, only that 24 cards are selected
    if (this.selectedCards.length === 24) {
      const payload = { player2SelectedCardIds: this.selectedCards.map(c => c.id) };
      this.http.post<any>(`${this.gameApiUrl}/join/${this.gameIdToJoin}`, payload).subscribe({
        next: (response) => {
          this.gameService.setSelectedCards(this.selectedCards); // Store selected cards
          this.gameService.setGameId(response.id); // Store game ID from backend
          this.router.navigate(['/game-room', response.id]); // Navigate with ID
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.error || 'Failed to join game.';
          console.error('Error joining game:', err);
        }
      });
    } else {
      this.errorMessage = 'Please select exactly 24 cards to join the game.';
    }
  }
}