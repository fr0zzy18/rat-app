import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BingoCard } from '../../core/models/bingo-card.model';
import { BingoService } from '../../core/services/bingo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

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
  canDelete: boolean = false; // New property
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private bingoService: BingoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.getBingoCards();
    this.checkRoles();
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
  }
}
