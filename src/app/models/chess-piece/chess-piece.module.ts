export interface ChessPiece {
  type: 'PAWN' | 'KNIGHT' | 'BISHOP' | 'ROOK' | 'QUEEN' | 'KING';
  color: 'WHITE' | 'BLACK';
  position: string;
}
