import { Injectable, OnDestroy } from '@angular/core';
import { BingoCard } from '../models/bingo-card.model';
import * as signalR from '@microsoft/signalr'; // Import SignalR
import { Observable, Subject } from 'rxjs'; // Import Observable and Subject
import { GameResponse } from '../models/game-response.model'; // Import GameResponse

@Injectable({
  providedIn: 'root'
})
export class GameService implements OnDestroy {
  private selectedCards: BingoCard[] = [];
  private gameId: string | null = null; // New: Property to store the Game ID

  private hubConnection: signalR.HubConnection;
  private waitingGameAddedSubject = new Subject<GameResponse>();
  public waitingGameAdded$: Observable<GameResponse> = this.waitingGameAddedSubject.asObservable();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5211/gamehub', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.startConnection();
    this.addSignalRListeners();
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }

  private async startConnection(): Promise<void> {
    try {
      await this.hubConnection.start();
      console.log('SignalR Connected!');
    } catch (err) {
      console.error('Error while starting SignalR connection: ' + err);
      setTimeout(() => this.startConnection(), 5000); // Retry connection after 5 seconds
    }
  }

  private stopConnection(): void {
    this.hubConnection.stop()
      .then(() => console.log('SignalR Disconnected.'))
      .catch(err => console.error('Error while stopping SignalR connection: ' + err));
  }

  private addSignalRListeners(): void {
    this.hubConnection.on('WaitingGameAdded', (game: GameResponse) => {
      console.log('Received WaitingGameAdded:', game);
      this.waitingGameAddedSubject.next(game);
    });
    // You can add other listeners here for game updates, etc.
  }

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

