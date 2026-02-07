export interface GameResponse {
  id: string; // Assuming GUID is string in frontend
  createdByUserId: number;
  createdByUsername: string;
  player1SelectedCardIds: number[];
  player1CheckedCardIds: number[];
  player2UserId?: number; // Optional
  player2Username?: string; // Optional
  player2SelectedCardIds?: number[]; // Optional
  player2CheckedCardIds?: number[]; // Optional
  player1BoardLayout: number[];
  player2BoardLayout?: number[]; // Optional
  status: string;
  createdDate: Date;
  gameStartedDate?: Date; // Optional
  lastActivityDate?: Date; // Optional
}