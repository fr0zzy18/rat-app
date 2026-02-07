import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Import OnDestroy, ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BingoCard } from '../../core/models/bingo-card.model';
import { GameService } from '../../core/services/game.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { BingoService } from '../../core/services/bingo.service';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

interface GameBoardCell {
  id?: number;
  phrase: string | null;
  isEmpty: boolean;
  isChecked: boolean;
  // isOpponentChecked?: boolean; // Removed
}

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.css']
})
export class GameRoomComponent implements OnInit, OnDestroy {
  gameBoard: GameBoardCell[][] = [];
  opponentGameBoard: GameBoardCell[][] = [];
  selectedBingoCards: BingoCard[] = [];
  opponentSelectedCards: BingoCard[] = [];
  boardSize: number = 5;
  gameId: string | null = null;
  errorMessage: string | null = null;
  loading: boolean = true;
  private pollingSubscription: Subscription | null = null;
  private componentActive: boolean = true;

  private gameApiUrl = 'http://localhost:5211/api/game';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private gameService: GameService,
    private http: HttpClient,
    private authService: AuthService,
    private bingoService: BingoService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.gameId = params.get('gameId');

      if (!this.gameId) {
        this.errorMessage = 'Game ID is missing.';
        this.router.navigate(['/bingo']);
        return;
      }

      this.fetchGameDetails();
      this.startPolling();
    });
  }

  ngOnDestroy(): void {
    this.componentActive = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  fetchGameDetails(): void {
    this.loading = true;
    this.http.get<any>(`${this.gameApiUrl}/${this.gameId}`).subscribe({
      next: (gameDetails) => {
        console.log('fetchGameDetails: Game Details:', gameDetails);
        const currentUserId = this.authService.currentUserValue?.id?.toString();
        console.log('fetchGameDetails: currentUserId:', currentUserId);
        let playerCardIds: number[] = [];
        let playerCheckedIds: number[] = [];
        let opponentCardIds: number[] = [];
        let opponentCheckedIds: number[] = [];

        if (currentUserId === gameDetails.createdByUserId) {
          playerCardIds = gameDetails.player1SelectedCardIds || [];
          playerCheckedIds = gameDetails.player1CheckedCardIds || [];
          opponentCardIds = gameDetails.player2SelectedCardIds || [];
          opponentCheckedIds = gameDetails.player2CheckedCardIds || [];
        } else if (currentUserId === gameDetails.player2UserId) {
          playerCardIds = gameDetails.player2SelectedCardIds || [];
          playerCheckedIds = gameDetails.player2CheckedCardIds || [];
          opponentCardIds = gameDetails.player1SelectedCardIds || [];
          opponentCheckedIds = gameDetails.player1CheckedCardIds || [];
        } else {
          console.error('fetchGameDetails: User is not a participant in this game. Current User ID:', currentUserId, 'Created By:', gameDetails.createdByUserId, 'Player 2:', gameDetails.player2UserId, 'Game Details:', gameDetails);
          this.errorMessage = 'You are not a participant in this game.';
          this.router.navigate(['/bingo']);
          return;
        }
        console.log('fetchGameDetails: playerCardIds for current user:', playerCardIds);

        this.bingoService.getBingoCards().subscribe({
          next: (allBingoCards) => {
            this.selectedBingoCards = allBingoCards.filter(card => playerCardIds.includes(card.id));
            console.log('fetchGameDetails: selectedBingoCards (after filter):', this.selectedBingoCards);
            this.opponentSelectedCards = allBingoCards.filter(card => opponentCardIds.includes(card.id));
            if (this.selectedBingoCards.length !== 24 || (opponentCardIds.length > 0 && this.opponentSelectedCards.length !== 24)) {
              this.errorMessage = 'Error: Incorrect number of selected cards for this game.';
              this.router.navigate(['/bingo']);
              return;
            }
            this.initializeGameBoard(this.gameBoard, this.selectedBingoCards, playerCheckedIds, opponentCheckedIds);
            this.gameBoard = [...this.gameBoard]; // Trigger change detection
            console.log('fetchGameDetails: this.gameBoard (after update):', this.gameBoard); // New console.log
            if (this.opponentSelectedCards.length > 0) {
                this.initializeGameBoard(this.opponentGameBoard, this.opponentSelectedCards, opponentCheckedIds, playerCheckedIds);
                this.opponentGameBoard = [...this.opponentGameBoard]; // Trigger change detection
            }
            this.loading = false;
            this.cdr.detectChanges(); // Explicitly trigger change detection
          },
          error: (err) => {
            this.errorMessage = 'Failed to load bingo cards for the game.';
            console.error('Error loading bingo cards:', err);
            this.loading = false;
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error || 'Failed to load game details.';
        console.error('Error loading game details:', err);
        this.loading = false;
        this.router.navigate(['/bingo']);
      }
    });
  }

  startPolling(): void {
    this.pollingSubscription = interval(3000)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(() => this.pollGameUpdates());
  }

  pollGameUpdates(): void {
    if (!this.gameId) return;

    this.http.get<any>(`${this.gameApiUrl}/${this.gameId}`).subscribe({
      next: (gameDetails) => {
        const currentUserId = this.authService.currentUserValue?.id?.toString();
        let playerCheckedIds: number[] = [];
        let opponentCheckedIds: number[] = [];
        let opponentCardIds: number[] = [];

        if (currentUserId === gameDetails.createdByUserId) {
          playerCheckedIds = gameDetails.player1CheckedCardIds || [];
          opponentCheckedIds = gameDetails.player2CheckedCardIds || [];
          opponentCardIds = gameDetails.player2SelectedCardIds || [];
        } else if (currentUserId === gameDetails.player2UserId) {
          playerCheckedIds = gameDetails.player2CheckedCardIds || [];
          opponentCheckedIds = gameDetails.player1CheckedCardIds || [];
          opponentCardIds = gameDetails.player1SelectedCardIds || [];
        } else {
          console.error('pollGameUpdates: User is not a participant in this game. Current User ID:', currentUserId, 'Created By:', gameDetails.createdByUserId, 'Player 2:', gameDetails.player2UserId, 'Game Details:', gameDetails);
          console.warn('Polling: User is no longer a participant in this game.');
          this.pollingSubscription?.unsubscribe();
          this.router.navigate(['/bingo']);
          return;
        }

        if (opponentCardIds.length > 0 && this.opponentSelectedCards.length === 0) {
            this.bingoService.getBingoCards().subscribe({
                next: (allBingoCards) => {
                    this.opponentSelectedCards = allBingoCards.filter(card => opponentCardIds.includes(card.id));
                    if (this.opponentSelectedCards.length === 24) {
                        this.initializeGameBoard(this.opponentGameBoard, this.opponentSelectedCards, opponentCheckedIds, playerCheckedIds);
                    }
                },
                error: (err) => console.error('Error loading opponent bingo cards during poll:', err)
            });
        }

        this.updateGameBoardCheckedStates(this.gameBoard, playerCheckedIds, opponentCheckedIds);
        this.gameBoard = [...this.gameBoard]; // Trigger change detection
        if (this.opponentSelectedCards.length > 0) {
            this.updateGameBoardCheckedStates(this.opponentGameBoard, opponentCheckedIds, playerCheckedIds);
            this.opponentGameBoard = [...this.opponentGameBoard]; // Trigger change detection
        }
        this.cdr.detectChanges(); // Explicitly trigger change detection
      },
      error: (err) => {
        console.error('Error polling game updates:', err);
      }
    });
  }

  initializeGameBoard(board: GameBoardCell[][], selectedCards: BingoCard[], playerCheckedIds: number[], opponentCheckedIds: number[]): void {
    console.log('initializeGameBoard: board (before init):', board, 'selectedCards:', selectedCards, 'playerCheckedIds:', playerCheckedIds);
    board.splice(0, board.length); // Explicitly clear the board before populating
    const cardPhrases = selectedCards.map(card => ({ id: card.id, phrase: card.phrase }));
    const shuffledPhrases = this.shuffleArray(cardPhrases);

    let cardIndex = 0;
    for (let i = 0; i < this.boardSize; i++) {
      board[i] = [];
      for (let j = 0; j < this.boardSize; j++) {
        if (i === Math.floor(this.boardSize / 2) && j === Math.floor(this.boardSize / 2)) {
          board[i][j] = { phrase: 'FREE', isEmpty: true, isChecked: true };
        } else if (shuffledPhrases && cardIndex < shuffledPhrases.length) {
          // Check if shuffledPhrases[cardIndex] is not null or undefined
          const currentPhrase = shuffledPhrases[cardIndex];
          if (currentPhrase) { // Defensive check
            const cardId = currentPhrase.id;
            board[i][j] = {
              id: cardId,
              phrase: currentPhrase.phrase,
              isEmpty: false,
              isChecked: playerCheckedIds.includes(cardId),
              // isOpponentChecked: opponentCheckedIds.includes(cardId) // Removed
            };
          } else {
            console.error('initializeGameBoard: shuffledPhrases[cardIndex] is null or undefined for cardIndex:', cardIndex, 'shuffledPhrases:', shuffledPhrases);
            board[i][j] = { phrase: null, isEmpty: true, isChecked: false }; // Fallback
          }
          cardIndex++;
        } else {
          board[i][j] = { phrase: null, isEmpty: true, isChecked: false };
        }
      }
    }
    console.log('initializeGameBoard: board (after init):', board); // New console.log
  }

  updateGameBoardCheckedStates(board: GameBoardCell[][], playerCheckedIds: number[], opponentCheckedIds: number[]): void {
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        const cell = board[i][j];
        if (!cell.isEmpty && cell.id !== undefined) {
          cell.isChecked = playerCheckedIds.includes(cell.id);
          // cell.isOpponentChecked = opponentCheckedIds.includes(cell.id); // Removed
        }
      }
    }
  }

  shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  toggleCellChecked(cell: GameBoardCell): void {
    if (!cell.isEmpty && cell.id !== undefined && this.gameId) {
      this.http.post<any>(`${this.gameApiUrl}/${this.gameId}/checkCell`, { cardId: cell.id }).subscribe({
        next: (updatedGame) => {
          cell.isChecked = !cell.isChecked;
          console.log(`Cell '${cell.phrase}' is now ${cell.isChecked ? 'checked' : 'unchecked'}`);
        },
        error: (err) => {
          this.errorMessage = err.error || 'Failed to toggle cell.';
          console.error('Error toggling cell:', err);
        }
      });
    }
  }
}
