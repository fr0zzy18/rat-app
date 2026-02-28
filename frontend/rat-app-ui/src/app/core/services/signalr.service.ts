import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | undefined;
  private gameUpdateSubject = new Subject<any>();
  private reconnectedSubject = new Subject<string | undefined>();

  public gameUpdate$: Observable<any> = this.gameUpdateSubject.asObservable();
  public reconnected$: Observable<string | undefined> = this.reconnectedSubject.asObservable();

  constructor() { }

  public startConnection = (token: string): Promise<void> => {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();
    this.hubConnection.on('GameUpdated', (game) => {
      console.log('SignalR: Raw GameUpdated received from hub:', game);
      this.gameUpdateSubject.next(game);
    });

    this.hubConnection.on('ReceiveMessage', (message) => {
      console.log('SignalR: ReceiveMessage received:', message);
    });
    this.hubConnection.onreconnected(connectionId => {
      console.log(`SignalR: Reconnected with connectionId: ${connectionId}`);
      this.reconnectedSubject.next(connectionId);
    });

    return this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection started'))
      .catch(err => {
        console.log('Error while starting SignalR connection: ' + err);
        throw err;
      });
  }

  public stopConnection = () => {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR Connection stopped'))
        .catch(err => console.log('Error while stopping SignalR connection: ' + err));
    }
  }
  public joinGameGroup = (gameId: string) => {
    console.log(`SignalRService: Attempting to join game group: ${gameId}`);
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinGame', gameId)
        .catch(err => console.error('Error invoking JoinGame on hub: ' + err));
    } else {
      console.warn('SignalR HubConnection not connected. Cannot invoke JoinGame.');
    }
  }
  public leaveGameGroup = (gameId: string) => {
    if (this.hubConnection) {
      if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
        this.hubConnection.invoke('LeaveGame', gameId)
          .catch(err => console.error('Error invoking LeaveGame on hub: ' + err));
      } else {
        console.warn('SignalR HubConnection not connected. Cannot invoke LeaveGame.');
      }
    }
  }
}