import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import {GameInvitation} from "../models/game-invitation/game-invitation.module";
import {Game} from "../models/game/game.module";
import {MoveHistory} from "../models/move-history/move-history.module";


@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private invitationSubject = new Subject<GameInvitation>();
  private invitationResponseSubject = new Subject<GameInvitation>();
  private gameStartSubject = new Subject<Game>();
  private moveSubject = new Subject<MoveHistory>();
  private gameEndSubject = new Subject<Game>();
  private onlineUsersSubject = new Subject<any>();

  public invitation$ = this.invitationSubject.asObservable();
  public invitationResponse$ = this.invitationResponseSubject.asObservable();
  public gameStart$ = this.gameStartSubject.asObservable();
  public move$ = this.moveSubject.asObservable();
  public gameEnd$ = this.gameEndSubject.asObservable();
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  constructor() {}

  connect(userId: number): void {
    const socket = new SockJS('http://localhost:8088/ws');

    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket');

      // S'abonner aux invitations
      this.stompClient?.subscribe(`/user/${userId}/queue/invitations`, (message: IMessage) => {
        const invitation = JSON.parse(message.body);
        this.invitationSubject.next(invitation);
      });

      // S'abonner aux réponses d'invitation
      this.stompClient?.subscribe(`/user/${userId}/queue/invitation-responses`, (message: IMessage) => {
        const invitation = JSON.parse(message.body);
        this.invitationResponseSubject.next(invitation);
      });

      // S'abonner au démarrage de partie
      this.stompClient?.subscribe(`/user/${userId}/queue/game-start`, (message: IMessage) => {
        const game = JSON.parse(message.body);
        this.gameStartSubject.next(game);
      });

      // S'abonner aux coups
      this.stompClient?.subscribe(`/user/${userId}/queue/moves`, (message: IMessage) => {
        const move = JSON.parse(message.body);
        this.moveSubject.next(move);
      });

      // S'abonner à la fin de partie
      this.stompClient?.subscribe(`/user/${userId}/queue/game-end`, (message: IMessage) => {
        const game = JSON.parse(message.body);
        this.gameEndSubject.next(game);
      });

      // S'abonner aux utilisateurs en ligne
      this.stompClient?.subscribe('/topic/online-users', (message: IMessage) => {
        const users = JSON.parse(message.body);
        this.onlineUsersSubject.next(users);
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  isConnected(): boolean {
    return this.stompClient !== null && this.stompClient.connected;
  }
}
