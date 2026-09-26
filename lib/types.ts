// Shared domain types. Amounts are lamports as decimal strings so they survive
// JSON and Server Component serialization without losing precision.

export type WalletAddress = string;
export type Lamports = string;
export type IsoDate = string;

export type EventStatus =
  | "open" // accepting stakes
  | "awaiting_evidence" // deadline passed, waiting for proof
  | "in_review" // AI has ruled (hidden), volunteers reviewing
  | "resolved" // volunteer matched AI, winners paid
  | "invalid" // 3 volunteers disagreed, refunds minus fee
  | "rejected"; // AI refused the event (not provable or harmful)

export type ProofType = "photo" | "video" | "document" | "screenshot" | "link";

export interface EventOption {
  id: string;
  label: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  creator: WalletAddress;
  subject: string; // the person the event is about
  rules: string[];
  options: EventOption[];
  proofType: ProofType;
  proofRequirement: string;
  deadline: IsoDate;
  createdAt: IsoDate;
  status: EventStatus;
  totalPool: Lamports;
  poolByOption: Record<string, Lamports>;
  winningOptionId?: string; // only set once resolved
}

export interface Stake {
  id: string;
  eventId: string;
  wallet: WalletAddress;
  optionId: string;
  amount: Lamports;
  placedAt: IsoDate;
  txSignature?: string;
  payoutClaimed?: boolean;
}

export interface Evidence {
  id: string;
  eventId: string;
  uploadedBy: WalletAddress;
  kind: ProofType;
  url: string;
  description: string;
  uploadedAt: IsoDate;
}

// "unprovable" means the evidence doesn't prove either option.
export type VerdictChoice = string | "unprovable";

export interface AiVerdict {
  eventId: string;
  choice: VerdictChoice;
  confidence: number; // 0..1
  reasoning: string;
  commitment: string; // hash committed onchain so the verdict can't change later
  committedAt: IsoDate;
}

export type CaseStatus = "assigned" | "voted" | "expired";
export type CaseOutcome = "matched" | "not_matched" | "invalid";

export interface VolunteerCase {
  id: string;
  number: number; // public case number shown on profiles
  eventId: string;
  volunteer: WalletAddress;
  round: 1 | 2 | 3;
  assignedAt: IsoDate;
  status: CaseStatus;
  rewardMatch: Lamports; // bonus if the vote matches the AI
  rewardBounty: Lamports; // fixed bounty if it doesn't
  outcome?: CaseOutcome;
}

export interface Vote {
  caseId: string;
  volunteer: WalletAddress;
  choice: VerdictChoice;
  castAt: IsoDate;
}

export interface TrustScore {
  total: number; // 0..100
  kyc: number;
  bettingHistory: number;
  judgingAccuracy: number;
  accountAge: number;
}

export interface UserProfile {
  wallet: WalletAddress;
  displayName: string;
  avatarUrl?: string;
  joinedAt: IsoDate;
  kycVerified: boolean;
  trust: TrustScore;
}

// ---- View models ----

// Everything a blind reviewer may see. Built by whitelisting fields, so
// participants, stakes, pool sizes and the AI verdict can never leak into it.
export interface BlindCaseView {
  caseId: string;
  caseNumber: number;
  round: 1 | 2 | 3;
  status: CaseStatus;
  rewardMatch: Lamports;
  rewardBounty: Lamports;
  event: {
    title: string;
    rules: string[];
    options: EventOption[];
    proofType: ProofType;
    proofRequirement: string;
    deadline: IsoDate;
  };
  evidence: Pick<Evidence, "id" | "kind" | "url" | "description">[];
  outcome?: CaseOutcome;
}

export interface JudgeStats {
  casesJudged: number;
  matchRate: number; // 0..1
  earned: Lamports;
}

export interface UserStats {
  betsPlaced: number;
  betsWon: number;
  totalStaked: Lamports;
  totalWon: Lamports;
}

// Own profile gets full detail, other profiles get case numbers only.
export type JudgingHistoryEntry =
  | { visibility: "full"; caseNumber: number; eventTitle: string; choice: VerdictChoice; outcome?: CaseOutcome }
  | { visibility: "public"; caseNumber: number };

export interface BetWithEvent {
  stake: Stake;
  event: Event;
}
