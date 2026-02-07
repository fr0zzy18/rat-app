import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | undefined;
  private gameUpdateSubject = new Subject<any>(); // To push game updates

  public gameUpdate$: Observable<any> = this.gameUpdateSubject.asObservable();

  constructor() { }

  public startConnection = (token: string): Promise<void> => {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5211/gamehub', {
        accessTokenFactory: () => token // Pass JWT token for authentication
      })
      .build();

    // Register handlers for messages from the hub
    this.hubConnection.on('GameUpdated', (game) => {
      console.log('SignalR: Raw GameUpdated received from hub:', game); // ADD THIS
      console.log('SignalR: GameUpdated received:', game); // Keep this for now
      this.gameUpdateSubject.next(game); // Push the update to subscribers
    });

    this.hubConnection.on('ReceiveMessage', (message) => {
      console.log('SignalR: ReceiveMessage received:', message);
    });

    return this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection started'))
      .catch(err => {
        console.log('Error while starting SignalR connection: ' + err);
        throw err; // Re-throw to propagate the error
      });
  }

  public stopConnection = () => {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR Connection stopped'))
        .catch(err => console.log('Error while stopping SignalR connection: ' + err));
    }
  }

  // Method for clients to call the hub, e.g., to join a game group
  public joinGameGroup = (gameId: string) => {
    console.log(`SignalRService: Attempting to join game group: ${gameId}`); // ADD THIS
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinGame', gameId)
        .catch(err => console.error('Error invoking JoinGame on hub: ' + err));
    } else {
      console.warn('SignalR HubConnection not connected. Cannot invoke JoinGame.');
    }
  }

  // Method for clients to call the hub, e.g., to leave a game group
  public leaveGameGroup = (gameId: string) => {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('LeaveGame', gameId)
        .catch(err => console.error('Error invoking LeaveGame on hub: ' + err));
    } else {
      console.warn('SignalR HubConnection not connected. Cannot invoke LeaveGame.');
    }
  }
}