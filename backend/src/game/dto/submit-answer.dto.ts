export interface SubmitAnswerDto {
    roomId: string;
    roundNumber: number;
    answer: string;
    snippetDurationUsed?: number;
}