import { environment } from '@env/environment';
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
  private signalRReconnectedSubscription: Subscription | undefined; // New subscription
  
  myBoardDisplayName: string = 'Your Board';
  opponentBoardDisplayName: string = "Opponent's Board";

  winnerMessage: string | null = null;
  isGameFinished: boolean = false;

  // Properties for Game ID visibility and copy functionality
  showGameIdSection: boolean = false;
  copyFeedbackMessage: string = '';
  isGameCreator: boolean = false;

  // New properties for timer functionality
  isPlayer2Joined: boolean = false;
  isGameInProgress: boolean = false;
  isGamePaused: boolean = false; // New property for game paused state
  gameStartTime: Date | null = null;
  pausedTime: Date | null = null; // New property to store the time when the game was paused
  private timerInterval: any; // To store setInterval reference
  displayTimer: string = '00:00:00';

  get isBoardInactiveAndFaded(): boolean {
    return this.isGameCreator && !this.isPlayer2Joined && !this.isGameFinished;
  }
  
  private gameApiUrl = `${environment.apiUrl}/api/game`;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private gameService: GameService,
    private http: HttpClient,
    private authService: AuthService,
    private bingoService: BingoService,
    private cdr: ChangeDetectorRef,
    private signalrService: SignalRService
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
      this.setupSignalR();
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
    if (this.signalRReconnectedSubscription) { // Unsubscribe from new subscription
      this.signalRReconnectedSubscription.unsubscribe();
    }
    this.stopTimer(); // Ensure timer is stopped on component destruction
  }

  async setupSignalR(): Promise<void> {
    const token = this.authService.getToken();
    if (token) {
      try {
        await this.signalrService.startConnection(token);
        console.log('SignalR Connection established, joining game group...');
        this.signalrService.joinGameGroup(this.gameId!);

        this.gameUpdateSubscription = this.signalrService.gameUpdate$.subscribe(
          (gameDetails) => {
            console.log('Received game update via SignalR:', gameDetails);
            this.updateGameRoomUI(gameDetails);
          },
          (error) => {
            console.error('SignalR GameUpdate error:', error);
          }
        );

        // New: Subscribe to reconnection events and rejoin group
        this.signalRReconnectedSubscription = this.signalrService.reconnected$.subscribe(
          (connectionId) => {
            console.log(`GameRoomComponent: SignalR reconnected with ID: ${connectionId}. Rejoining game group: ${this.gameId}`);
            if (this.gameId) {
              this.signalrService.joinGameGroup(this.gameId);
              // Re-fetch game details to ensure UI is up-to-date after reconnection
              this.fetchGameDetails(); 
            }
          }
        );

      } catch (err) {
        console.error('Failed to start SignalR connection or join game group:', err);
        this.errorMessage = 'Failed to connect to real-time game updates.';
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
        this.cdr.detectChanges();
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
    console.log('updateGameRoomUI: Received gameDetails:', gameDetails); // ADD THIS
    console.log('updateGameRoomUI: gameDetails.status:', gameDetails.status); // ADD THIS

    const currentUserId = Number(this.authService.currentUserValue?.id);
    if (isNaN(currentUserId)) {
      console.error('updateGameRoomUI: Invalid currentUserId:', this.authService.currentUserValue?.id);
      this.errorMessage = 'Invalid user ID. Please log in again.';
      this.router.navigate(['/login']);
      return;
    }

    // Determine if current user is the game creator
    this.isGameCreator = (currentUserId === gameDetails.createdByUserId);
    this.isPlayer2Joined = gameDetails.player2UserId !== null; // Update player2 joined status
    this.isGameInProgress = gameDetails.status === "InProgress"; // Update game in progress status
    this.isGamePaused = gameDetails.status === "Paused"; // New: Set game paused status
    this.gameStartTime = new Date(gameDetails.gameStartedDate); // Set game start time

    console.log('updateGameRoomUI: isGameInProgress set to:', this.isGameInProgress); // ADD THIS
    console.log('updateGameRoomUI: isGamePaused set to:', this.isGamePaused); // ADD THIS
    console.log('updateGameRoomUI: gameStartTime set to:', this.gameStartTime); // ADD THIS

    // New: Handle pausedTime
    if (this.isGamePaused && gameDetails.lastActivityDate) { // Assuming backend sends lastActivityDate
      this.pausedTime = new Date(gameDetails.lastActivityDate);
    } else {
      this.pausedTime = null;
    }
    console.log('updateGameRoomUI: pausedTime set to:', this.pausedTime); // ADD THIS

    // Set display
    if (this.isGameCreator) {
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

    // --- Handle game finished state and winner message ---
    this.isGameFinished = false; // Reset by default
    this.winnerMessage = null;   // Reset by default

    if (gameDetails.status === "Player1Won" || gameDetails.status === "Player2Won") {
      this.isGameFinished = true;
      this.stopTimer(); // Stop timer when game is finished
      const winnerName = gameDetails.status === "Player1Won"
        ? gameDetails.createdByUsername
        : gameDetails.player2Username;
      this.winnerMessage = `Congratulations, ${winnerName}! You won the game!`;
    }

    // --- Timer logic ---
    if (this.isGameInProgress && !this.isGameFinished && !this.isGamePaused && !this.timerInterval) {
      this.startTimer();
    } else if (!this.isGameInProgress || this.isGameFinished || this.isGamePaused) { // Updated condition
      this.stopTimer();
    }
    // --- End Timer logic ---

    let playerSelectedCardIds: number[] = [];
    let playerCheckedIds: number[] = [];
    let playerBoardLayout: number[] = [];
    let opponentSelectedCardIds: number[] = [];
    let opponentCheckedIds: number[] = [];
    let opponentBoardLayout: number[] = [];

    if (this.isGameCreator) {
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
        this.cdr.detectChanges();
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
          board[i][j] = { phrase: 'RAT', isEmpty: true, isChecked: true };
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
    if (this.isGameFinished || this.isGamePaused || this.isBoardInactiveAndFaded) { // Prevent clicks if game is finished, paused, or board is inactive
      console.log('Game is finished, paused, or board is inactive, cannot click cells.');
      return;
    }
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

  // New: Navigate back to the bingo selection page
  goBackToBingo(): void {
    this.router.navigate(['/bingo']);
  }

  // New: Toggle visibility of Game ID section
  toggleGameIdVisibility(): void {
    this.showGameIdSection = !this.showGameIdSection;
    if (!this.showGameIdSection) {
      this.copyFeedbackMessage = ''; // Clear message when hiding
    }
  }

  // New: Copy Game ID to clipboard
  async copyGameIdToClipboard(): Promise<void> {
    if (this.gameId) {
      try {
        await navigator.clipboard.writeText(this.gameId);
        this.copyFeedbackMessage = 'Copied!';
        this.cdr.detectChanges(); // Manually trigger change detection
        setTimeout(() => {
          this.copyFeedbackMessage = '';
          this.cdr.detectChanges(); // Manually trigger change detection to clear the message
        }, 2000); // Clear message after 2 seconds
      } catch (err) {
        console.error('Failed to copy Game ID:', err);
        this.copyFeedbackMessage = 'Copy failed!';
        this.cdr.detectChanges(); // Manually trigger change detection
        setTimeout(() => {
          this.copyFeedbackMessage = '';
          this.cdr.detectChanges(); // Manually trigger change detection to clear the message
        }, 2000);
      }
    }
  }

  // New: Start the game timer
  private startTimer(): void {
    if (this.gameStartTime && !this.timerInterval) {
      this.timerInterval = setInterval(() => {
        const now = new Date();
        const elapsedMilliseconds = now.getTime() - this.gameStartTime!.getTime();
        const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = elapsedSeconds % 60;

        this.displayTimer = 
          `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
        this.cdr.detectChanges(); // Manually trigger change detection for timer update
      }, 1000);
    }
  }

  // New: Stop the game timer
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  // Helper function to pad single digits with a leading zero
  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}