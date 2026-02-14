import { environment } from '@env/environment';
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { BingoCard } from '../../core/models/bingo-card.model';
import { BingoService } from '../../core/services/bingo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router'; // Import Router
import { GameService } from '../../core/services/game.service'; // Import GameService

import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Import HttpClient
import { GameResponse } from '../../core/models/game-response.model'; // Import the new GameResponse model
import { Subscription } from 'rxjs'; // Import Subscription

@Component({
  selector: 'app-bingo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bingo.component.html',
  styleUrls: ['./bingo.component.css']
})
export class BingoComponent implements OnInit, OnDestroy { // Implement OnDestroy
  bingoCards: BingoCard[] = [];
  newCardPhrase: string = '';
  canCreate: boolean = false;
  canDelete: boolean = false;
  canEdit: boolean = false; // New property for editing permission
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private successTimer: any;
  private errorTimer: any;
  private readonly MESSAGE_DELAY = 3000; // 3 seconds delay for messages
  private subscriptions: Subscription[] = []; // Array to hold subscriptions

  private showAndClearMessage(type: 'success' | 'error', message: string): void {
    if (type === 'success') {
      this.successMessage = message;
      if (this.successTimer) {
        clearTimeout(this.successTimer);
      }
      this.successTimer = setTimeout(() => {
        this.successMessage = null;
        this.cdr.detectChanges();
      }, this.MESSAGE_DELAY);
    } else { // type === 'error'
      this.errorMessage = message;
      if (this.errorTimer) {
        clearTimeout(this.errorTimer);
      }
      this.errorTimer = setTimeout(() => {
        this.errorMessage = null;
        this.cdr.detectChanges();
      }, this.MESSAGE_DELAY);
    }
    this.cdr.detectChanges(); // Ensure message is shown immediately
  }
  selectedCards: BingoCard[] = []; // Array to hold selected cards
  gameIdToJoin: string = ''; // Property to hold Game ID for joining
  reconnectGameId: string | null = null; // New property to hold game ID for reconnecting
  waitingGames: GameResponse[] = []; // New property to store waiting games

  editingCardId: number | null = null; // To track which card is being edited
  editedCardPhrase: string = '';       // To hold the phrase during editing
  hoveredCardId: number | null = null; // New: To track which card is being hovered

  private gameApiUrl = `${environment.apiUrl}/api/game`;

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
    this.getWaitingGames(); // Call new method to fetch waiting games

    // Subscribe to real-time updates for new waiting games
    this.subscriptions.push(
      this.gameService.waitingGameAdded$.subscribe(game => {
        // Add the new game to the waitingGames array if it's not already there
        if (!this.waitingGames.some(wg => wg.id === game.id)) {
          this.waitingGames.push(game);
          this.cdr.detectChanges(); // Trigger change detection
        }
      })
    );
  }

  onMouseEnter(cardId: number): void {
    this.hoveredCardId = cardId;
  }

  onMouseLeave(): void {
    this.hoveredCardId = null;
  }

  // New method to get games waiting for players
  getWaitingGames(): void {
    this.http.get<GameResponse[]>(`${this.gameApiUrl}/waiting-games`).subscribe({
      next: (games) => {
        this.waitingGames = games;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching waiting games:', err);
        // Optionally display an error message to the user
      }
    });
  }

  // New method to join an available game by clicking it
  joinAvailableGame(gameId: string): void {
    // Before joining, ensure 24 cards are selected
    if (this.selectedCards.length !== 24) {
      this.errorMessage = 'Please select exactly 24 cards to join an available game.';
      this.cdr.detectChanges();
      return;
    }
    this.gameIdToJoin = gameId; // Set the game ID
    this.joinGame(); // Call the existing joinGame method
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
            this.showAndClearMessage('success', 'Game resumed successfully. Reconnecting...');
            this.router.navigate(['/game-room', this.reconnectGameId]);
          },
          error: (err: HttpErrorResponse) => {
            this.showAndClearMessage('error', err.error?.message || 'Failed to resume game. It might have been abandoned or is no longer available.');
            console.error('Error resuming game:', err);
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
        this.showAndClearMessage('error', 'Failed to load bingo cards.');
        console.error('Error loading bingo cards:', err);
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
          this.showAndClearMessage('success', 'Bingo card created successfully!');
        },
        error: (err) => {
          this.showAndClearMessage('error', 'Failed to create bingo card. You might not have the required permissions.');
          console.error('Error creating bingo card:', err);
        }
      });
    } else {
      this.showAndClearMessage('error', 'Phrase cannot be empty.');
    }
  }

  deleteBingoCard(id: number): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (confirm('Are you sure you want to delete this bingo card?')) {
      this.bingoService.deleteBingoCard(id).subscribe({
        next: () => {
          this.bingoCards = this.bingoCards.filter(card => card.id !== id); // Optimistic update
          this.showAndClearMessage('success', 'Bingo card deleted successfully!');
        },
        error: (err) => {
          this.showAndClearMessage('error', 'Failed to delete bingo card. You might not have the required permissions.');
          console.error('Error deleting bingo card:', err);
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
      this.showAndClearMessage('error', 'You can select a maximum of 24 cards.');
    }
  }

  // Select 24 random cards (existing method)
  selectRandomCards(): void {
    this.selectedCards = []; // Clear current selection
    this.errorMessage = null;
    this.successMessage = null;

    if (this.bingoCards.length < 24) {
      this.showAndClearMessage('error', 'Not enough bingo cards available to select 24 random cards.');
      return;
    }

    const shuffledCards = [...this.bingoCards].sort(() => 0.5 - Math.random()); // Shuffle a copy
    this.selectedCards = shuffledCards.slice(0, 24); // Take the first 24

    this.showAndClearMessage('success', '24 random cards selected.');
  }

  clearSelection(): void {
    this.selectedCards = [];
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
      this.showAndClearMessage('error', 'Card phrase cannot be empty.');
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

          this.showAndClearMessage('success', 'Bingo card updated successfully!');
          this.cancelEdit(); // Exit editing mode
        },
        error: (err: HttpErrorResponse) => {
          this.showAndClearMessage('error', err.error || 'Failed to update bingo card. You might not have the required permissions.');
          console.error('Error updating bingo card:', err);
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
          this.showAndClearMessage('error', err.error || 'Failed to create game.');
          console.error('Error creating game:', err);
        }
      });
    } else {
      this.showAndClearMessage('error', 'Please select exactly 24 cards to start a new game.');
    }
  }

  // Join game (as second player, joining an existing game) (existing method)
  joinGame(): void {
    this.successMessage = null;
    this.errorMessage = null;
    if (!this.gameIdToJoin) {
      this.showAndClearMessage('error', 'Please enter a Game ID to join.');
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
          this.showAndClearMessage('error', err.error || 'Failed to join game.');
          console.error('Error joining game:', err);
        }
      });
    } else {
      this.showAndClearMessage('error', 'Please select exactly 24 cards to join the game.');
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}