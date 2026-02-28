export interface GameResponse {
  id: string;
  createdByUserId: number;
  createdByUsername: string;
  player1SelectedCardIds: number[];
  player1CheckedCardIds: number[];
  player2UserId?: number;
  player2Username?: string;
  player2SelectedCardIds?: number[];
  player2CheckedCardIds?: number[];
  player1BoardLayout: number[];
  player2BoardLayout?: number[];
  status: string;
  createdDate: Date;
  gameStartedDate?: Date;
  lastActivityDate?: Date;
}