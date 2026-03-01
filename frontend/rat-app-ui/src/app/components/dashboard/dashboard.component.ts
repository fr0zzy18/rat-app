import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PlayerService, Player } from '../../core/services/player.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  players: Player[] = [];
  loading: boolean = true;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 1;

  classColors: { [key: string]: string } = {
    'Death Knight': '#C41F3B',
    'Demon Hunter': '#A330C9',
    'Druid': '#FF7D0A',
    'Evoker': '#33937F',
    'Hunter': '#ABD473',
    'Mage': '#3FC7EB',
    'Monk': '#00FF96',
    'Paladin': '#F58CBA',
    'Priest': '#FFFFFF',
    'Rogue': '#FFF569',
    'Shaman': '#0070DE',
    'Warlock': '#8787ED',
    'Warrior': '#C79C6E'
  };

  constructor(
    public authService: AuthService,
    private playerService: PlayerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.playerService.getAllPlayers().subscribe({
      next: (players) => {
        this.players = players.sort((a, b) => b.mythicPlusScore - a.mythicPlusScore);
        this.totalPages = Math.ceil(this.players.length / this.pageSize);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching rankings:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get pagedPlayers(): Player[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.players.slice(startIndex, startIndex + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
      // Scroll to top of panel on page change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getClassColor(className: string): string {
    return this.classColors[className] || '#ffffff';
  }
}