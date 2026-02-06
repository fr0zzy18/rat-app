import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute and Router
import { BingoCard } from '../../core/models/bingo-card.model';
import { GameService } from '../../core/services/game.service'; // Will create this service soon

// Define the interface for a single cell on the game board
interface GameBoardCell {
  id?: number; // Optional: if it corresponds to a BingoCard id
  phrase: string | null; // The phrase from the bingo card, or null for empty
  isEmpty: boolean; // True if the cell is empty
  isChecked: boolean; // True if the cell is checked
}

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.css']
})
export class GameRoomComponent implements OnInit {
  gameBoard: GameBoardCell[][] = [];
  selectedBingoCards: BingoCard[] = [];
  boardSize: number = 5; // 5x5 board

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private gameService: GameService // Inject the new GameService
  ) {}

  ngOnInit(): void {
    // Retrieve selected cards from the GameService
    this.selectedBingoCards = this.gameService.getSelectedCards();

    if (this.selectedBingoCards.length === 0) {
      // If no cards are selected, redirect back to bingo card selection
      this.router.navigate(['/bingo']);
      return;
    }
    this.initializeGameBoard();
  }

  initializeGameBoard(): void {
    const cardPhrases = this.selectedBingoCards.map(card => ({ id: card.id, phrase: card.phrase }));
    const shuffledPhrases = this.shuffleArray(cardPhrases);

    let cardIndex = 0;
    for (let i = 0; i < this.boardSize; i++) {
      this.gameBoard[i] = [];
      for (let j = 0; j < this.boardSize; j++) {
        if (i === Math.floor(this.boardSize / 2) && j === Math.floor(this.boardSize / 2)) {
          // Center cell
          this.gameBoard[i][j] = { phrase: 'FREE', isEmpty: true, isChecked: true };
        } else if (shuffledPhrases && cardIndex < shuffledPhrases.length) { // MODIFIED LINE
          // Fill with selected cards
          this.gameBoard[i][j] = {
            id: shuffledPhrases[cardIndex].id,
            phrase: shuffledPhrases[cardIndex].phrase,
            isEmpty: false,
            isChecked: false
          };
          cardIndex++;
        } else {
          // This case should ideally not be reached if exactly 24 cards are selected for a 5x5 board with one empty cell.
          // Adding a fallback for safety or if board size/card count changes.
          this.gameBoard[i][j] = { phrase: null, isEmpty: true, isChecked: false };
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
    if (!cell.isEmpty) {
      cell.isChecked = !cell.isChecked;
      // Here you might add logic to check for bingo wins
      console.log(`Cell '${cell.phrase}' is now ${cell.isChecked ? 'checked' : 'unchecked'}`);
    }
  }
}