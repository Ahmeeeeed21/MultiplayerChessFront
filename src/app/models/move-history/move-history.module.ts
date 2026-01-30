export interface MoveHistory {
  id: number;
  moveNumber: number;
  playerName: string;
  from: string;
  to: string;
  piece: string;
  notation: string;
  isCheck: boolean;
  isCheckmate: boolean;
  timestamp: Date;
}
