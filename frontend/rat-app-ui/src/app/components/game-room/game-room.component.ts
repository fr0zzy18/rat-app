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
  selectedBingoCards: BingoCard[] = []; // Still needed for selected card list
  opponentSelectedCards: BingoCard[] = []; // Still needed for selected card list
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
        let playerSelectedCardIds: number[] = [];
        let playerCheckedIds: number[] = [];
        let playerBoardLayout: number[] = []; // New
        let opponentSelectedCardIds: number[] = [];
        let opponentCheckedIds: number[] = [];
        let opponentBoardLayout: number[] = []; // New

        if (currentUserId === gameDetails.createdByUserId) {
          playerSelectedCardIds = gameDetails.player1SelectedCardIds || [];
          playerCheckedIds = gameDetails.player1CheckedCardIds || [];
          playerBoardLayout = gameDetails.player1BoardLayout || []; // New
          opponentSelectedCardIds = gameDetails.player2SelectedCardIds || [];
          opponentCheckedIds = gameDetails.player2CheckedCardIds || [];
          opponentBoardLayout = gameDetails.player2BoardLayout || []; // New
        } else if (currentUserId === gameDetails.player2UserId) {
          playerSelectedCardIds = gameDetails.player2SelectedCardIds || [];
          playerCheckedIds = gameDetails.player2CheckedCardIds || [];
          playerBoardLayout = gameDetails.player2BoardLayout || []; // New
          opponentSelectedCardIds = gameDetails.player1SelectedCardIds || [];
          opponentCheckedIds = gameDetails.player1CheckedCardIds || [];
          opponentBoardLayout = gameDetails.player1BoardLayout || []; // New
        } else {
          console.error('fetchGameDetails: User is not a participant in this game. Current User ID:', currentUserId, 'Created By:', gameDetails.createdByUserId, 'Player 2:', gameDetails.player2UserId, 'Game Details:', gameDetails);
          this.errorMessage = 'You are not a participant in this game.';
          this.router.navigate(['/bingo']);
          return;
        }
        console.log('fetchGameDetails: playerSelectedCardIds for current user:', playerSelectedCardIds);

        this.bingoService.getBingoCards().subscribe({
          next: (allBingoCards) => {
            this.selectedBingoCards = allBingoCards.filter(card => playerSelectedCardIds.includes(card.id));
            console.log('fetchGameDetails: selectedBingoCards (after filter):', this.selectedBingoCards);
            this.opponentSelectedCards = allBingoCards.filter(card => opponentSelectedCardIds.includes(card.id));
            if (this.selectedBingoCards.length !== 24 || (opponentSelectedCardIds.length > 0 && this.opponentSelectedCards.length !== 24)) {
              this.errorMessage = 'Error: Incorrect number of selected cards for this game.';
              this.router.navigate(['/bingo']);
              return;
            }
            // Pass allBingoCards and playerBoardLayout
            this.initializeGameBoard(this.gameBoard, allBingoCards, playerBoardLayout, playerCheckedIds);
            this.gameBoard = [...this.gameBoard]; // Trigger change detection
            console.log('fetchGameDetails: this.gameBoard (after update):', this.gameBoard); // New console.log
            if (this.opponentSelectedCards.length > 0 && opponentBoardLayout.length > 0) { // Only initialize opponent's board if they have joined and layout exists
                this.initializeGameBoard(this.opponentGameBoard, allBingoCards, opponentBoardLayout, opponentCheckedIds);
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
        let playerBoardLayout: number[] = []; // New
        let opponentBoardLayout: number[] = []; // New

        if (currentUserId === gameDetails.createdByUserId) {
          playerCheckedIds = gameDetails.player1CheckedCardIds || [];
          opponentCheckedIds = gameDetails.player2CheckedCardIds || [];
          opponentCardIds = gameDetails.player2SelectedCardIds || [];
          playerBoardLayout = gameDetails.player1BoardLayout || []; // New
          opponentBoardLayout = gameDetails.player2BoardLayout || []; // New
        } else if (currentUserId === gameDetails.player2UserId) {
          playerCheckedIds = gameDetails.player2CheckedCardIds || [];
          opponentCheckedIds = gameDetails.player1CheckedCardIds || [];
          opponentCardIds = gameDetails.player1SelectedCardIds || [];
          playerBoardLayout = gameDetails.player2BoardLayout || []; // New
          opponentBoardLayout = gameDetails.player1BoardLayout || []; // New
        } else {
          console.error('pollGameUpdates: User is not a participant in this game. Current User ID:', currentUserId, 'Created By:', gameDetails.createdByUserId, 'Player 2:', gameDetails.player2UserId, 'Game Details:', gameDetails);
          console.warn('Polling: User is no longer a participant in this game.');
          this.pollingSubscription?.unsubscribe();
          this.router.navigate(['/bingo']);
          return;
        }

        this.bingoService.getBingoCards().subscribe({ // Need allBingoCards for mapping layout
          next: (allBingoCards) => {
            if (opponentCardIds.length > 0 && this.opponentSelectedCards.length === 0) {
                this.opponentSelectedCards = allBingoCards.filter(card => opponentCardIds.includes(card.id));
            }
            // Re-initialize player's board with potentially updated checked cards, using fixed layout
            this.initializeGameBoard(this.gameBoard, allBingoCards, playerBoardLayout, playerCheckedIds);
            this.gameBoard = [...this.gameBoard]; // Trigger change detection

            if (this.opponentSelectedCards.length > 0 && opponentBoardLayout.length > 0) { // Only update opponent's board if they have joined and layout exists
                // Update opponent's board with potentially updated checked cards, using fixed layout
                this.initializeGameBoard(this.opponentGameBoard, allBingoCards, opponentBoardLayout, opponentCheckedIds);
                this.opponentGameBoard = [...this.opponentGameBoard]; // Trigger change detection
            }
            this.cdr.detectChanges(); // Explicitly trigger change detection
          },
          error: (err) => console.error('Error loading bingo cards during poll for layout mapping:', err)
        });
      },
      error: (err) => {
        console.error('Error polling game updates:', err);
      }
    });
  }

  // Modified signature
  initializeGameBoard(board: GameBoardCell[][], allBingoCards: BingoCard[], boardLayout: number[], playerCheckedIds: number[]): void {
    console.log('initializeGameBoard: board (before init):', board, 'allBingoCards count:', allBingoCards.length, 'boardLayout:', boardLayout, 'playerCheckedIds:', playerCheckedIds);
    board.splice(0, board.length); // Explicitly clear the board before populating

    let cardIndex = 0;
    for (let i = 0; i < this.boardSize; i++) {
      board[i] = [];
      for (let j = 0; j < this.boardSize; j++) {
        if (i === Math.floor(this.boardSize / 2) && j === Math.floor(this.boardSize / 2)) {
          board[i][j] = { phrase: 'FREE', isEmpty: true, isChecked: true };
        } else if (boardLayout && cardIndex < boardLayout.length) {
          const cardId = boardLayout[cardIndex];
          const currentPhrase = allBingoCards.find(card => card.id === cardId); // Find actual BingoCard
          if (currentPhrase) { // Defensive check
            board[i][j] = {
              id: cardId,
              phrase: currentPhrase.phrase,
              isEmpty: false,
              isChecked: playerCheckedIds.includes(cardId),
            };
          } else {
            console.error('initializeGameBoard: BingoCard not found for ID:', cardId, 'Board Layout:', boardLayout);
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

  updateGameBoardCheckedStates(board: GameBoardCell[][], playerCheckedIds: number[]): void { // Modified signature
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        const cell = board[i][j];
        if (!cell.isEmpty && cell.id !== undefined) {
          cell.isChecked = playerCheckedIds.includes(cell.id);
        }
      }
    }
  }

  // Remove shuffleArray method - no longer needed
  // shuffleArray(array: any[]): any[] {
  //   for (let i = array.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1));
  //     [array[i], array[j]] = [array[j], array[i]];
  //   }
  //   return array;
  // }

  toggleCellChecked(cell: GameBoardCell): void {
    if (!cell.isEmpty && cell.id !== undefined && this.gameId) {
      this.http.post<any>(`${this.gameApiUrl}/${this.gameId}/checkCell`, { cardId: cell.id }).subscribe({
        next: (updatedGame) => {
          // No need to optimistically update cell.isChecked here, as polling will update it.
          // This prevents potential out-of-sync issues if the backend rejects the move or updates game state differently.
          // console.log(`Cell '${cell.phrase}' is now ${cell.isChecked ? 'checked' : 'unchecked'}`); // Remove optimistic log
        },
        error: (err) => {
          this.errorMessage = err.error || 'Failed to toggle cell.';
          console.error('Error toggling cell:', err);
        }
      });
    }
  }
}