import type { Address, Lamports, Signature, TransactionSigner } from "@solana/kit";
import type { ProofType, VerdictChoice } from "@/lib/types";

// Typed stubs for the onchain program. A separate session is writing the
// program. Once its client is generated, fill these in and point the data
// service at them.

export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID as Address | undefined;

function notImplemented(name: string): never {
  throw new Error(`lib/solana/program.ts: ${name} is not implemented yet`);
}

export interface CreateEventArgs {
  creator: TransactionSigner;
  eventId: string;
  optionIds: string[];
  proofType: ProofType;
  deadline: Date;
  rulesHash: string; // hash of the AI-drafted rules, stored onchain
}

export async function createEvent(args: CreateEventArgs): Promise<Signature> {
  void args;
  return notImplemented("createEvent");
}

export interface PlaceStakeArgs {
  staker: TransactionSigner;
  eventId: string;
  optionId: string;
  amount: Lamports;
}

export async function placeStake(args: PlaceStakeArgs): Promise<Signature> {
  void args;
  return notImplemented("placeStake");
}

export interface SubmitEvidenceArgs {
  submitter: TransactionSigner;
  eventId: string;
  evidenceHash: string; // file itself lives offchain
}

export async function submitEvidence(args: SubmitEvidenceArgs): Promise<Signature> {
  void args;
  return notImplemented("submitEvidence");
}

// Server only: signed by the platform authority.
export interface CommitAiVerdictArgs {
  eventId: string;
  commitment: string; // hash(choice + salt), revealed at resolution
}

export async function commitAiVerdict(args: CommitAiVerdictArgs): Promise<Signature> {
  void args;
  return notImplemented("commitAiVerdict");
}

// Server only: signed by the platform authority.
export interface AssignVolunteerArgs {
  eventId: string;
  volunteer: Address;
  round: 1 | 2 | 3;
}

export async function assignVolunteer(args: AssignVolunteerArgs): Promise<Signature> {
  void args;
  return notImplemented("assignVolunteer");
}

export interface CastVoteArgs {
  volunteer: TransactionSigner;
  eventId: string;
  round: 1 | 2 | 3;
  choice: VerdictChoice;
}

export async function castVote(args: CastVoteArgs): Promise<Signature> {
  void args;
  return notImplemented("castVote");
}

// Server only: reveals the AI verdict and settles the round.
export interface ResolveArgs {
  eventId: string;
  revealedChoice: VerdictChoice;
  salt: string;
}

export async function resolve(args: ResolveArgs): Promise<Signature> {
  void args;
  return notImplemented("resolve");
}

export interface ClaimArgs {
  claimant: TransactionSigner;
  eventId: string;
}

export async function claimPayout(args: ClaimArgs): Promise<Signature> {
  void args;
  return notImplemented("claimPayout");
}

export async function claimRefund(args: ClaimArgs): Promise<Signature> {
  void args;
  return notImplemented("claimRefund");
}
