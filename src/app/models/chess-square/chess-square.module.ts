import {ChessPiece} from "../chess-piece/chess-piece.module";

export interface ChessSquare {
  file: string; // a-h
  rank: number; // 1-8
  position: string; // "a1", "e4", etc.
  piece?: ChessPiece;
  isLight: boolean;
}
