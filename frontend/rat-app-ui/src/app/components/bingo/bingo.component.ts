import { environment } from '@env/environment';
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { BingoCard } from '../../core/models/bingo-card.model';
import { BingoService } from '../../core/services/bingo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { GameResponse } from '../../core/models/game-response.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bingo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bingo.component.html',
  styleUrls: ['./bingo.component.css']
})
export class BingoComponent implements OnInit, OnDestroy {
  bingoCards: BingoCard[] = [];
  newCardPhrase: string = '';
  canCreate: boolean = false;
  canDelete: boolean = false;
  canEdit: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private successTimer: any;
  private errorTimer: any;
  private readonly MESSAGE_DELAY = 3000;
  private subscriptions: Subscription[] = [];

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
    } else {
      this.errorMessage = message;
      if (this.errorTimer) {
        clearTimeout(this.errorTimer);
      }
      this.errorTimer = setTimeout(() => {
        this.errorMessage = null;
        this.cdr.detectChanges();
      }, this.MESSAGE_DELAY);
    }
    this.cdr.detectChanges();
  }
  selectedCards: BingoCard[] = [];
  gameIdToJoin: string = '';
  reconnectGameId: string | null = null;
  waitingGames: GameResponse[] = [];

  editingCardId: number | null = null;
  editedCardPhrase: string = '';
  hoveredCardId: number | null = null;

  private gameApiUrl = `${environment.apiUrl}/api/game`;

  constructor(
    private bingoService: BingoService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private gameService: GameService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.getBingoCards();
    this.checkRoles();
    this.checkActiveGame();
    this.getWaitingGames();
    this.subscriptions.push(
      this.gameService.waitingGameAdded$.subscribe(game => {
        if (!this.waitingGames.some(wg => wg.id === game.id)) {
          this.waitingGames.push(game);
          this.cdr.detectChanges();
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
  getWaitingGames(): void {
    this.http.get<GameResponse[]>(`${this.gameApiUrl}/waiting-games`).subscribe({
      next: (games) => {
        this.waitingGames = games;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching waiting games:', err);
      }
    });
  }
  joinAvailableGame(gameId: string): void {
    if (this.selectedCards.length !== 24) {
      this.errorMessage = 'Please select exactly 24 cards to join an available game.';
      this.cdr.detectChanges();
      return;
    }
    this.gameIdToJoin = gameId;
    this.joinGame();
  }
  checkActiveGame(): void {
    this.http.get<any>(`${this.gameApiUrl}/my-active-game`).subscribe({
      next: (gameDetails) => {
        if (!gameDetails) {
          this.reconnectGameId = null;
        } else if (gameDetails.id && (gameDetails.status === 'InProgress' || gameDetails.status === 'Paused')) {
          this.reconnectGameId = gameDetails.id;
        } else {
          this.reconnectGameId = null;
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status !== 404) {
          console.error('Error checking for active game:', err);
        }
        this.reconnectGameId = null;
        this.cdr.detectChanges();
      }
    });
  }
  onReconnect(): void {
    if (this.reconnectGameId) {
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
        this.cdr.detectChanges();
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
          this.bingoCards = [...this.bingoCards, card];
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
          this.bingoCards = this.bingoCards.filter(card => card.id !== id);
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
    this.canEdit = this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
  }
  toggleCardSelection(card: BingoCard): void {
    if (this.editingCardId === card.id) {
      return;
    }

    const index = this.selectedCards.findIndex(c => c.id === card.id);
    if (index > -1) {
      this.selectedCards.splice(index, 1);
    } else if (this.selectedCards.length < 24) {
      this.selectedCards.push(card);
    } else {
      this.showAndClearMessage('error', 'You can select a maximum of 24 cards.');
    }
  }
  selectRandomCards(): void {
    this.selectedCards = [];
    this.errorMessage = null;
    this.successMessage = null;

    if (this.bingoCards.length < 24) {
      this.showAndClearMessage('error', 'Not enough bingo cards available to select 24 random cards.');
      return;
    }

    const shuffledCards = [...this.bingoCards].sort(() => 0.5 - Math.random());
    this.selectedCards = shuffledCards.slice(0, 24);

    this.showAndClearMessage('success', '24 random cards selected.');
  }

  clearSelection(): void {
    this.selectedCards = [];
  }
  editBingoCard(card: BingoCard): void {
    this.editingCardId = card.id;
    this.editedCardPhrase = card.phrase;
  }
  cancelEdit(): void {
    this.editingCardId = null;
    this.editedCardPhrase = '';
    this.errorMessage = null;
  }
  updateBingoCard(card: BingoCard): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (!this.editedCardPhrase.trim()) {
      this.showAndClearMessage('error', 'Card phrase cannot be empty.');
      return;
    }

    if (this.editingCardId === card.id) {
      const updatedCard = { id: card.id, phrase: this.editedCardPhrase };
      this.bingoService.updateBingoCard(updatedCard.id!, updatedCard).subscribe({
        next: (response: BingoCard) => {
          const index = this.bingoCards.findIndex(c => c.id === response.id);
          if (index > -1) {
            this.bingoCards[index] = response;
          }
          const selectedIndex = this.selectedCards.findIndex(c => c.id === response.id);
          if (selectedIndex > -1) {
            this.selectedCards[selectedIndex] = response;
          }

          this.showAndClearMessage('success', 'Bingo card updated successfully!');
          this.cancelEdit();
        },
        error: (err: HttpErrorResponse) => {
          this.showAndClearMessage('error', err.error || 'Failed to update bingo card. You might not have the required permissions.');
          console.error('Error updating bingo card:', err);
        }
      });
    }
  }
  isCardSelected(card: BingoCard): boolean {
    return this.selectedCards.some(c => c.id === card.id);
  }
  get canStartGame(): boolean {
    return this.selectedCards.length === 24;
  }
  startGame(): void {
    this.successMessage = null;
    this.errorMessage = null;
    if (this.canStartGame) {
      const payload = { player1SelectedCardIds: this.selectedCards.map(c => c.id) };
      this.http.post<any>(`${this.gameApiUrl}/create`, payload).subscribe({
        next: (response) => {
          this.gameService.setSelectedCards(this.selectedCards);
          this.gameService.setGameId(response.id);
          this.router.navigate(['/game-room', response.id]);
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
  joinGame(): void {
    this.successMessage = null;
    this.errorMessage = null;
    if (!this.gameIdToJoin) {
      this.showAndClearMessage('error', 'Please enter a Game ID to join.');
      return;
    }
    if (this.selectedCards.length === 24) {
      const payload = { player2SelectedCardIds: this.selectedCards.map(c => c.id) };
      this.http.post<any>(`${this.gameApiUrl}/join/${this.gameIdToJoin}`, payload).subscribe({
        next: (response) => {
          this.gameService.setSelectedCards(this.selectedCards);
          this.gameService.setGameId(response.id);
          this.router.navigate(['/game-room', response.id]);
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
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}