import {User} from "../user/user.module";

export interface Game {
  gameId: number;
  whitePlayer: User;
  blackPlayer: User;
  status: 'IN_PROGRESS' | 'CHECKMATE' | 'STALEMATE' | 'DRAW' | 'ABANDONED';
  currentBoardState: string;
  currentTurn: 'WHITE' | 'BLACK';
  winner?: User;
  startedAt: Date;
}
