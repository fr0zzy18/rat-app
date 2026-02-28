export enum SuggestionStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2
}

export interface Suggestion {
  id?: number;
  phrase: string;
  suggestedByUserName: string;
  createdAt: Date;
  status: SuggestionStatus;
}
