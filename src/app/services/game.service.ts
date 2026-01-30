import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {Game} from "../models/game/game.module";
import {GameInvitation} from "../models/game-invitation/game-invitation.module";
import {Move} from "../models/move/move.module";
import {MoveHistory} from "../models/move-history/move-history.module";



@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'http://localhost:8080/api';
  private currentGameSubject = new BehaviorSubject<Game | null>(null);
  public currentGame$ = this.currentGameSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Invitations
  sendInvitation(senderId: number, receiverId: number): Observable<GameInvitation> {
    const params = new HttpParams().set('senderId', senderId.toString());
    return this.http.post<GameInvitation>(
      `${this.apiUrl}/invitations/send`,
      { receiverId },
      { params }
    );
  }

  respondToInvitation(invitationId: number, accepted: boolean): Observable<GameInvitation> {
    return this.http.post<GameInvitation>(`${this.apiUrl}/invitations/respond`, {
      invitationId,
      accepted
    });
  }

  getPendingInvitations(userId: number): Observable<GameInvitation[]> {
    return this.http.get<GameInvitation[]>(`${this.apiUrl}/invitations/pending/${userId}`);
  }

  getSentInvitations(userId: number): Observable<GameInvitation[]> {
    return this.http.get<GameInvitation[]>(`${this.apiUrl}/invitations/sent/${userId}`);
  }

  // Games
  createGame(invitationId: number): Observable<Game> {
    const params = new HttpParams().set('invitationId', invitationId.toString());
    return this.http.post<Game>(`${this.apiUrl}/games/create`, null, { params }).pipe(
      tap(game => this.currentGameSubject.next(game))
    );
  }

  makeMove(move: Move, playerId: number): Observable<MoveHistory> {
    const params = new HttpParams().set('playerId', playerId.toString());
    return this.http.post<MoveHistory>(`${this.apiUrl}/games/move`, move, { params });
  }

  getGameState(gameId: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/games/${gameId}`).pipe(
      tap(game => this.currentGameSubject.next(game))
    );
  }

  getActiveGame(userId: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/games/active/${userId}`).pipe(
      tap(game => this.currentGameSubject.next(game))
    );
  }

  getMoveHistory(gameId: number): Observable<MoveHistory[]> {
    return this.http.get<MoveHistory[]>(`${this.apiUrl}/games/${gameId}/moves`);
  }

  endGame(gameId: number, winnerId?: number, status: string = 'ABANDONED'): Observable<void> {
    let params = new HttpParams().set('status', status);
    if (winnerId) {
      params = params.set('winnerId', winnerId.toString());
    }
    return this.http.post<void>(`${this.apiUrl}/games/${gameId}/end`, null, { params }).pipe(
      tap(() => this.currentGameSubject.next(null))
    );
  }

  getCurrentGame(): Game | null {
    return this.currentGameSubject.value;
  }

  setCurrentGame(game: Game | null): void {
    this.currentGameSubject.next(game);
  }
}

