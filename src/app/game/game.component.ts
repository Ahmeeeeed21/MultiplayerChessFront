// game.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {AuthService} from "../services/auth.service";
import {GameService} from "../services/game.service";
import {WebSocketService} from "../services/websocket.service";
import {MoveHistory} from "../models/move-history/move-history.module";
import {ChessSquare} from "../models/chess-square/chess-square.module";
import {User} from "../models/user/user.module";
import {Game} from "../models/game/game.module";
import {ChessPiece} from "../models/chess-piece/chess-piece.module";
import {Move} from "../models/move/move.module";


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  game: Game | null = null;
  currentUser: User | null = null;
  board: ChessSquare[][] = [];
  selectedSquare: ChessSquare | null = null;
  moveHistory: MoveHistory[] = [];
  isMyTurn = false;
  myColor: 'WHITE' | 'BLACK' | null = null;

  private subscriptions: Subscription[] = [];
  private gameId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private gameService: GameService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      this.gameId = +params['id'];
      this.loadGame();
      this.subscribeToWebSocketEvents();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadGame(): void {
    this.gameService.getGameState(this.gameId).subscribe({
      next: (game) => {
        this.game = game;
        this.determinePlayerColor();
        this.checkIfMyTurn();
        this.initializeBoard();
        this.loadMoveHistory();
      },
      error: (error) => {
        console.error('Error loading game:', error);
        this.router.navigate(['/lobby']);
      }
    });
  }

  loadMoveHistory(): void {
    this.gameService.getMoveHistory(this.gameId).subscribe({
      next: (history) => {
        this.moveHistory = history;
      },
      error: (error) => console.error('Error loading history:', error)
    });
  }

  subscribeToWebSocketEvents(): void {
    // Recevoir les coups de l'adversaire
    this.subscriptions.push(
      this.wsService.move$.subscribe((move) => {
        this.moveHistory.push(move);
        this.loadGame(); // Recharger le plateau
      })
    );

    // Fin de partie
    this.subscriptions.push(
      this.wsService.gameEnd$.subscribe((game) => {
        this.game = game;
        alert(`Game Over! ${game.winner ? game.winner.username + ' wins!' : 'Draw!'}`);
      })
    );
  }

  determinePlayerColor(): void {
    if (!this.game || !this.currentUser) return;

    if (this.game.whitePlayer.id === this.currentUser.id) {
      this.myColor = 'WHITE';
    } else if (this.game.blackPlayer.id === this.currentUser.id) {
      this.myColor = 'BLACK';
    }
  }

  checkIfMyTurn(): void {
    if (!this.game || !this.myColor) return;
    this.isMyTurn = this.game.currentTurn === this.myColor;
  }

  initializeBoard(): void {
    this.board = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // Créer le plateau (inverser pour les noirs)
    for (let rank = 8; rank >= 1; rank--) {
      const row: ChessSquare[] = [];
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const file = files[fileIndex];
        const position = file + rank;
        const isLight = (fileIndex + rank) % 2 === 0;

        row.push({
          file,
          rank,
          position,
          isLight,
          piece: this.getPieceAtPosition(position)
        });
      }
      this.board.push(row);
    }

    // Si je joue les noirs, inverser le plateau
    if (this.myColor === 'BLACK') {
      this.board.reverse();
      this.board.forEach(row => row.reverse());
    }
  }

  getPieceAtPosition(position: string): ChessPiece | undefined {
    // Initialisation simple du plateau
    const initialSetup: { [key: string]: ChessPiece } = {
      'a1': { type: 'ROOK', color: 'WHITE', position: 'a1' },
      'b1': { type: 'KNIGHT', color: 'WHITE', position: 'b1' },
      'c1': { type: 'BISHOP', color: 'WHITE', position: 'c1' },
      'd1': { type: 'QUEEN', color: 'WHITE', position: 'd1' },
      'e1': { type: 'KING', color: 'WHITE', position: 'e1' },
      'f1': { type: 'BISHOP', color: 'WHITE', position: 'f1' },
      'g1': { type: 'KNIGHT', color: 'WHITE', position: 'g1' },
      'h1': { type: 'ROOK', color: 'WHITE', position: 'h1' },

      'a8': { type: 'ROOK', color: 'BLACK', position: 'a8' },
      'b8': { type: 'KNIGHT', color: 'BLACK', position: 'b8' },
      'c8': { type: 'BISHOP', color: 'BLACK', position: 'c8' },
      'd8': { type: 'QUEEN', color: 'BLACK', position: 'd8' },
      'e8': { type: 'KING', color: 'BLACK', position: 'e8' },
      'f8': { type: 'BISHOP', color: 'BLACK', position: 'f8' },
      'g8': { type: 'KNIGHT', color: 'BLACK', position: 'g8' },
      'h8': { type: 'ROOK', color: 'BLACK', position: 'h8' }
    };

    // Pions
    for (let i = 0; i < 8; i++) {
      const file = String.fromCharCode(97 + i); // a-h
      initialSetup[file + '2'] = { type: 'PAWN', color: 'WHITE', position: file + '2' };
      initialSetup[file + '7'] = { type: 'PAWN', color: 'BLACK', position: file + '7' };
    }

    return initialSetup[position];
  }

  onSquareClick(square: ChessSquare): void {
    if (!this.isMyTurn) {
      return;
    }

    // Si aucune pièce n'est sélectionnée
    if (!this.selectedSquare) {
      if (square.piece && square.piece.color === this.myColor) {
        this.selectedSquare = square;
      }
      return;
    }

    // Si on clique sur la même case
    if (this.selectedSquare.position === square.position) {
      this.selectedSquare = null;
      return;
    }

    // Essayer de faire le mouvement
    this.makeMove(this.selectedSquare, square);
  }

  makeMove(from: ChessSquare, to: ChessSquare): void {
    if (!this.game || !this.currentUser || !from.piece) return;

    const move: Move = {
      gameId: this.game.gameId,
      from: from.position,
      to: to.position,
      piece: from.piece.type
    };

    this.gameService.makeMove(move, this.currentUser.id).subscribe({
      next: (moveHistory) => {
        this.moveHistory.push(moveHistory);
        this.selectedSquare = null;
        this.loadGame();
      },
      error: (error) => {
        console.error('Invalid move:', error);
        alert('Invalid move!');
        this.selectedSquare = null;
      }
    });
  }

  getPieceSymbol(piece: ChessPiece): string {
    const symbols: { [key: string]: { [key: string]: string } } = {
      'WHITE': {
        'KING': '♔',
        'QUEEN': '♕',
        'ROOK': '♖',
        'BISHOP': '♗',
        'KNIGHT': '♘',
        'PAWN': '♙'
      },
      'BLACK': {
        'KING': '♚',
        'QUEEN': '♛',
        'ROOK': '♜',
        'BISHOP': '♝',
        'KNIGHT': '♞',
        'PAWN': '♟'
      }
    };

    return symbols[piece.color][piece.type] || '';
  }

  isSquareSelected(square: ChessSquare): boolean {
    return this.selectedSquare?.position === square.position;
  }

  forfeit(): void {
    if (!this.game || !this.currentUser) return;

    if (confirm('Are you sure you want to forfeit?')) {
      const opponentId = this.game.whitePlayer.id === this.currentUser.id
        ? this.game.blackPlayer.id
        : this.game.whitePlayer.id;

      this.gameService.endGame(this.game.gameId, opponentId, 'ABANDONED').subscribe({
        next: () => {
          this.router.navigate(['/lobby']);
        }
      });
    }
  }

  backToLobby(): void {
    this.router.navigate(['/lobby']);
  }
}
