import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BingoCard } from '../../core/models/bingo-card.model';
import { GameService } from '../../core/services/game.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { BingoService } from '../../core/services/bingo.service';
// SignalR imports
import { SignalRService } from '../../core/services/signalr.service';
import { Subscription } from 'rxjs';

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
  private gameUpdateSubscription: Subscription | undefined; // For SignalR updates
  
  myBoardDisplayName: string = 'Your Board'; // New
  opponentBoardDisplayName: string = "Opponent's Board"; // New
  
  private gameApiUrl = 'http://localhost:5211/api/game';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private gameService: GameService,
    private http: HttpClient,
    private authService: AuthService,
    private bingoService: BingoService,
    private cdr: ChangeDetectorRef,
    private signalrService: SignalRService // Inject SignalRService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.gameId = params.get('gameId');

      if (!this.gameId) {
        this.errorMessage = 'Game ID is missing.';
        this.router.navigate(['/bingo']);
        return;
      }

      this.fetchGameDetails(); // Initial fetch
      this.setupSignalR(); // Setup SignalR instead of polling
    });
  }

  ngOnDestroy(): void {
    if (this.gameId) {
      this.signalrService.leaveGameGroup(this.gameId);
    }
    this.signalrService.stopConnection();
    if (this.gameUpdateSubscription) {
      this.gameUpdateSubscription.unsubscribe();
    }
  }

  async setupSignalR(): Promise<void> { // Mark as async
    const token = this.authService.getToken();
    if (token) {
      try {
        await this.signalrService.startConnection(token); // Await the connection
        console.log('SignalR Connection established, joining game group...');
        this.signalrService.joinGameGroup(this.gameId!); // Now safe to join group

        this.gameUpdateSubscription = this.signalrService.gameUpdate$.subscribe(
          (gameDetails) => {
            console.log('Received game update via SignalR:', gameDetails);
            this.updateGameRoomUI(gameDetails);
          },
          (error) => {
            console.error('SignalR GameUpdate error:', error);
          }
        );
      } catch (err) {
        console.error('Failed to start SignalR connection or join game group:', err);
        this.errorMessage = 'Failed to connect to real-time game updates.';
        // Optionally navigate away or show a critical error message
        this.router.navigate(['/bingo']);
      }
    } else {
      console.error('No JWT token found for SignalR connection.');
      this.router.navigate(['/login']);
    }
  }

  fetchGameDetails(): void {
    this.loading = true;
    this.http.get<any>(`${this.gameApiUrl}/${this.gameId}`).subscribe({
      next: (gameDetails) => {
        console.log('fetchGameDetails: Game Details:', gameDetails);
        this.updateGameRoomUI(gameDetails);
        this.loading = false;
        this.cdr.detectChanges(); // Explicitly trigger change detection
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error || 'Failed to load game details.';
        console.error('Error loading game details:', err);
        this.loading = false;
        this.router.navigate(['/bingo']);
      }
    });
  }

  updateGameRoomUI(gameDetails: any): void {
    const currentUserId = Number(this.authService.currentUserValue?.id); // Convert to number
    if (isNaN(currentUserId)) {
      console.error('updateGameRoomUI: Invalid currentUserId:', this.authService.currentUserValue?.id);
      this.errorMessage = 'Invalid user ID. Please log in again.';
      this.router.navigate(['/login']);
      return;
    }

    // Set display names
    if (currentUserId === gameDetails.createdByUserId) {
      this.myBoardDisplayName = gameDetails.createdByUsername;
      this.opponentBoardDisplayName = gameDetails.player2Username ?? "Waiting for Opponent...";
    } else if (currentUserId === gameDetails.player2UserId) {
      this.myBoardDisplayName = gameDetails.player2Username ?? "Your Board";
      this.opponentBoardDisplayName = gameDetails.createdByUsername;
    } else {
      console.error('updateGameRoomUI: User is not a participant in this game. Current User ID:', currentUserId, 'Created By:', gameDetails.createdByUserId, 'Player 2:', gameDetails.player2UserId, 'Game Details:', gameDetails);
      this.errorMessage = 'You are not a participant in this game.';
      this.router.navigate(['/bingo']);
      return;
    }

    let playerSelectedCardIds: number[] = [];
    let playerCheckedIds: number[] = [];
    let playerBoardLayout: number[] = [];
    let opponentSelectedCardIds: number[] = [];
    let opponentCheckedIds: number[] = [];
    let opponentBoardLayout: number[] = [];

    if (currentUserId === gameDetails.createdByUserId) {
      playerSelectedCardIds = gameDetails.player1SelectedCardIds || [];
      playerCheckedIds = gameDetails.player1CheckedCardIds || [];
      playerBoardLayout = gameDetails.player1BoardLayout || [];
      opponentSelectedCardIds = gameDetails.player2SelectedCardIds || [];
      opponentCheckedIds = gameDetails.player2CheckedCardIds || [];
      opponentBoardLayout = gameDetails.player2BoardLayout || [];
    } else if (currentUserId === gameDetails.player2UserId) {
      playerSelectedCardIds = gameDetails.player2SelectedCardIds || [];
      playerCheckedIds = gameDetails.player2CheckedCardIds || [];
      playerBoardLayout = gameDetails.player2BoardLayout || [];
      opponentSelectedCardIds = gameDetails.player1SelectedCardIds || [];
      opponentCheckedIds = gameDetails.player1CheckedCardIds || [];
      opponentBoardLayout = gameDetails.player1BoardLayout || [];
    } else {
      console.error('updateGameRoomUI: User is not a participant in this game. Current User ID:', currentUserId, 'Created By:', gameDetails.createdByUserId, 'Player 2:', gameDetails.player2UserId, 'Game Details:', gameDetails);
      this.errorMessage = 'You are not a participant in this game.';
      this.router.navigate(['/bingo']);
      return;
    }
    console.log('updateGameRoomUI: playerSelectedCardIds for current user:', playerSelectedCardIds);

    this.bingoService.getBingoCards().subscribe({
      next: (allBingoCards) => {
        this.selectedBingoCards = allBingoCards.filter(card => playerSelectedCardIds.includes(card.id));
        console.log('updateGameRoomUI: selectedBingoCards (after filter):', this.selectedBingoCards);
        this.opponentSelectedCards = allBingoCards.filter(card => opponentSelectedCardIds.includes(card.id));
        if (this.selectedBingoCards.length !== 24 || (opponentSelectedCardIds.length > 0 && this.opponentSelectedCards.length !== 24)) {
          this.errorMessage = 'Error: Incorrect number of selected cards for this game.';
          this.router.navigate(['/bingo']);
          return;
        }
        
        this.initializeGameBoard(this.gameBoard, allBingoCards, playerBoardLayout, playerCheckedIds);
        this.gameBoard = [...this.gameBoard];
        console.log('updateGameRoomUI: this.gameBoard (after update):', this.gameBoard);
        
        if (this.opponentSelectedCards.length > 0 && opponentBoardLayout.length > 0) {
            this.initializeGameBoard(this.opponentGameBoard, allBingoCards, opponentBoardLayout, opponentCheckedIds);
            this.opponentGameBoard = [...this.opponentGameBoard];
        }
        this.cdr.detectChanges(); // Explicitly trigger change detection
      },
      error: (err) => {
        this.errorMessage = 'Failed to load bingo cards for the game.';
        console.error('Error loading bingo cards:', err);
      }
    });
  }


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
          const currentPhrase = allBingoCards.find(card => card.id === cardId);
          if (currentPhrase) {
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
    console.log('initializeGameBoard: board (after init):', board);
  }

  // shuffleArray method removed as it's now handled by backend

  updateGameBoardCheckedStates(board: GameBoardCell[][], playerCheckedIds: number[]): void {
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        const cell = board[i][j];
        if (!cell.isEmpty && cell.id !== undefined) {
          cell.isChecked = playerCheckedIds.includes(cell.id);
        }
      }
    }
  }

  toggleCellChecked(cell: GameBoardCell): void {
    if (!cell.isEmpty && cell.id !== undefined && this.gameId) {
      this.http.post<any>(`${this.gameApiUrl}/${this.gameId}/checkCell`, { cardId: cell.id }).subscribe({
        next: (updatedGame) => {
          // No need to optimistically update cell.isChecked here, as SignalR will update it.
          // The GameUpdated message will trigger updateGameRoomUI
        },
        error: (err) => {
          this.errorMessage = err.error || 'Failed to toggle cell.';
          console.error('Error toggling cell:', err);
        }
      });
    }
  }
}