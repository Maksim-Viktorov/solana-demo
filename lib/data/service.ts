import type {
  BetWithEvent,
  BlindCaseView,
  CaseOutcome,
  Event,
  JudgeStats,
  JudgingHistoryEntry,
  Stake,
  UserProfile,
  UserStats,
  VerdictChoice,
  VolunteerCase,
  WalletAddress,
  AiVerdict,
  Evidence,
} from "@/lib/types";

// The single boundary between pages/API routes and data. Swap the mock
// implementation in lib/data/index.ts for one backed by program calls.
export interface DataService {
  // Events
  listEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | null>;
  getStakesForEvent(eventId: string): Promise<Stake[]>;
  getEvidence(eventId: string): Promise<Evidence[]>;

  // Users
  getUser(wallet: WalletAddress): Promise<UserProfile | null>;
  listVerifiedUsers(): Promise<UserProfile[]>;
  setKycVerified(wallet: WalletAddress): Promise<UserProfile>;
  getUserStats(wallet: WalletAddress): Promise<UserStats>;
  getBetsForUser(wallet: WalletAddress): Promise<BetWithEvent[]>;
  getJudgingHistory(wallet: WalletAddress, viewer: WalletAddress | null): Promise<JudgingHistoryEntry[]>;

  // Volunteers. Anything a volunteer sees must go through getBlindCase.
  getAssignedCase(volunteer: WalletAddress): Promise<VolunteerCase | null>;
  getBlindCase(caseId: string, volunteer: WalletAddress): Promise<BlindCaseView | null>;
  getJudgeStats(volunteer: WalletAddress): Promise<JudgeStats>;
  assignVolunteer(eventId: string): Promise<VolunteerCase>;
  castVote(caseId: string, volunteer: WalletAddress, choice: VerdictChoice): Promise<CaseOutcome>;

  // AI verdict is write-only from the outside: nothing returns it to clients.
  commitAiVerdict(verdict: AiVerdict): Promise<void>;
}
