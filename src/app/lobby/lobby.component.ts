// lobby.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {User} from "../models/user/user.module";
import {GameInvitation} from "../models/game-invitation/game-invitation.module";
import {AuthService} from "../services/auth.service";
import {GameService} from "../services/game.service";
import {WebSocketService} from "../services/websocket.service";

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  onlineUsers: User[] = [];
  pendingInvitations: GameInvitation[] = [];
  sentInvitations: GameInvitation[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private wsService: WebSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadOnlineUsers();
    this.loadInvitations();
    this.checkForActiveGame();
    this.subscribeToWebSocketEvents();

    // Rafraîchir la liste toutes les 5 secondes
    setInterval(() => this.loadOnlineUsers(), 5000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadOnlineUsers(): void {
    this.authService.getOnlineUsers().subscribe({
      next: (users) => {
        this.onlineUsers = users.filter(u => u.id !== this.currentUser?.id);
      },
      error: (error) => console.error('Error loading online users:', error)
    });
  }

  loadInvitations(): void {
    if (!this.currentUser) return;

    this.gameService.getPendingInvitations(this.currentUser.id).subscribe({
      next: (invitations) => {
        this.pendingInvitations = invitations;
      },
      error: (error) => console.error('Error loading invitations:', error)
    });

    this.gameService.getSentInvitations(this.currentUser.id).subscribe({
      next: (invitations) => {
        this.sentInvitations = invitations;
      },
      error: (error) => console.error('Error loading sent invitations:', error)
    });
  }

  checkForActiveGame(): void {
    if (!this.currentUser) return;

    this.gameService.getActiveGame(this.currentUser.id).subscribe({
      next: (game) => {
        if (game) {
          this.router.navigate(['/game', game.gameId]);
        }
      },
      error: () => {
        // Pas de partie active
      }
    });
  }

  subscribeToWebSocketEvents(): void {
    // Recevoir une invitation
    this.subscriptions.push(
      this.wsService.invitation$.subscribe((invitation) => {
        this.pendingInvitations.push(invitation);
      })
    );

    // Recevoir une réponse d'invitation
    this.subscriptions.push(
      this.wsService.invitationResponse$.subscribe((invitation) => {
        if (invitation.status === 'ACCEPTED') {
          // Créer la partie
          this.gameService.createGame(invitation.id).subscribe({
            next: (game) => {
              this.router.navigate(['/game', game.gameId]);
            },
            error: (error) => console.error('Error creating game:', error)
          });
        } else {
          this.sentInvitations = this.sentInvitations.filter(i => i.id !== invitation.id);
        }
      })
    );

    // Démarrage de partie
    this.subscriptions.push(
      this.wsService.gameStart$.subscribe((game) => {
        this.router.navigate(['/game', game.gameId]);
      })
    );
  }

  invitePlayer(playerId: number): void {
    if (!this.currentUser) return;

    this.gameService.sendInvitation(this.currentUser.id, playerId).subscribe({
      next: (invitation) => {
        this.sentInvitations.push(invitation);
      },
      error: (error) => {
        console.error('Error sending invitation:', error);
        alert('Failed to send invitation');
      }
    });
  }

  acceptInvitation(invitation: GameInvitation): void {
    this.gameService.respondToInvitation(invitation.id, true).subscribe({
      next: () => {
        // Créer la partie
        this.gameService.createGame(invitation.id).subscribe({
          next: (game) => {
            this.router.navigate(['/game', game.gameId]);
          },
          error: (error) => console.error('Error creating game:', error)
        });
      },
      error: (error) => console.error('Error accepting invitation:', error)
    });
  }

  declineInvitation(invitation: GameInvitation): void {
    this.gameService.respondToInvitation(invitation.id, false).subscribe({
      next: () => {
        this.pendingInvitations = this.pendingInvitations.filter(i => i.id !== invitation.id);
      },
      error: (error) => console.error('Error declining invitation:', error)
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.wsService.disconnect();
        this.router.navigate(['/login']);
      }
    });
  }

  hasSentInvitation(userId: number): boolean {
    return this.sentInvitations.some(inv => inv.receiver.id === userId);
  }
}
