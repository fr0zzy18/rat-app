import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PlayerService, Player } from '../../core/services/player.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
   <div class="dashboard-container">
    <div class="ranking-panel">
      <header class="ranking-header">
        <h2>Global Rankings</h2>
        <div class="status-readout">
          <span class="label">Total Operatives:</span>
          <span class="value">{{ players.length }}</span>
        </div>
      </header>

      <div class="table-wrapper">
        <div *ngIf="loading" class="loading-state">
          <div class="scanner-bar"></div>
          <p>SCANNING DATABASE...</p>
        </div>

        <div *ngIf="!loading && players.length === 0" class="empty-state">
          <p>[ NO OPERATIVES DETECTED IN SECTOR ]</p>
          <p class="hint">Initialize recruitment via the Players deck.</p>
        </div>

        <table *ngIf="!loading && players.length > 0" class="ranking-table">
          <thead>
            <tr>
              <th class="rank-col">Rank</th>
              <th>Operative</th>
              <th>Guild</th>
              <th>Spec / Class</th>
              <th class="center">ILVL</th>
              <th class="right">M+ Score</th>
              <th class="center">Faction</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let player of players; let i = index" class="ranking-row">
              <td class="rank-col">
                <span class="rank-badge" [class.top-three]="i < 3">#{{ i + 1 }}</span>
              </td>
              <td class="operative-col">
                <div class="operative-info">
                  <img [src]="player.thumbnail_url" class="avatar" alt="">
                  <span class="name" [style.color]="getClassColor(player.class)">{{ player.name }}</span>
                </div>
              </td>
              <td class="guild-col">{{ player.guildName || '---' }}</td>
              <td class="spec-class-col">
                <span class="spec-class" [style.color]="getClassColor(player.class)">
                  {{ player.active_spec_name }} {{ player.class }}
                </span>
              </td>
              <td class="center ilvl-col">{{ player.itemLevelEquipped | number:'1.0-1' }}</td>
              <td class="right score-col">{{ player.mythicPlusScore | number:'1.0-0' }}</td>
              <td class="center faction-col">
                <img [src]="'assets/icon/' + (player.faction | lowercase) + '.png'" class="faction-icon" alt="">
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `,
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  players: Player[] = [];
  loading: boolean = true;
  
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

  getClassColor(className: string): string {
    return this.classColors[className] || '#ffffff';
  }
}
