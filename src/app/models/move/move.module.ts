export interface Move {
  gameId: number;
  from: string;
  to: string;
  piece: string;
  promotionPiece?: string;
}
