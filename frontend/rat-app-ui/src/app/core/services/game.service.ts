import { Injectable } from '@angular/core';
import { BingoCard } from '../models/bingo-card.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private selectedCards: BingoCard[] = [];
  private gameId: string | null = null; // New: Property to store the Game ID

  constructor() { }

  setSelectedCards(cards: BingoCard[]): void {
    this.selectedCards = cards;
  }

  getSelectedCards(): BingoCard[] {
    return this.selectedCards;
  }

  setGameId(id: string): void { // New: Method to set Game ID
    this.gameId = id;
  }

  getGameId(): string | null { // New: Method to get Game ID
    return this.gameId;
  }

  clearSelectedCards(): void {
    this.selectedCards = [];
    this.gameId = null; // New: Clear Game ID when cards are cleared
  }
}
