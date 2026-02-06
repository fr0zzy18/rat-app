import { Injectable } from '@angular/core';
import { BingoCard } from '../models/bingo-card.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private selectedCards: BingoCard[] = [];

  constructor() { }

  setSelectedCards(cards: BingoCard[]): void {
    this.selectedCards = cards;
  }

  getSelectedCards(): BingoCard[] {
    return this.selectedCards;
  }

  clearSelectedCards(): void {
    this.selectedCards = [];
  }
}
