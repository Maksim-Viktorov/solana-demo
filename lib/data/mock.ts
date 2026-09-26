import type { DataService } from "./service";
import type { AiVerdict, BlindCaseView, CaseOutcome, Event, UserProfile, VolunteerCase } from "@/lib/types";
import { seedCases, seedEvents, seedEvidence, seedStakes, seedUsers, seedVerdicts, seedVotes } from "./seed";

// In-memory store, kept on globalThis so it survives dev hot reloads.
// Resets when the server restarts. Bump STORE_VERSION whenever the seed or
// types change shape, so a running dev server picks up the new seed.
const STORE_VERSION = 2;
function createStore() {
  return {
    events: structuredClone(seedEvents),
    stakes: structuredClone(seedStakes),
    evidence: structuredClone(seedEvidence),
    verdicts: structuredClone(seedVerdicts),
    cases: structuredClone(seedCases),
    votes: structuredClone(seedVotes),
    users: structuredClone(seedUsers),
  };
}
const g = globalThis as unknown as { __mockStore?: ReturnType<typeof createStore> & { version: number } };
if (g.__mockStore?.version !== STORE_VERSION) g.__mockStore = { ...createStore(), version: STORE_VERSION };
const db = g.__mockStore;

const MAX_ROUNDS = 3;
const sum = (xs: string[]) => xs.reduce((a, b) => a + BigInt(b), BigInt(0)).toString();

function newUser(wallet: string): UserProfile {
  return {
    wallet,
    displayName: `${wallet.slice(0, 4)}...${wallet.slice(-4)}`,
    joinedAt: new Date().toISOString(),
    kycVerified: false,
    trust: { bettor: 1, volunteer: 1, proofOnTime: 1, evidenceAccepted: 1, disputesLost: 0 },
  };
}

function toBlindView(c: VolunteerCase, event: Event): BlindCaseView {
  // Whitelist only. Do not spread event or case objects in here.
  return {
    caseId: c.id,
    caseNumber: c.number,
    round: c.round,
    status: c.status,
    rewardMatch: c.rewardMatch,
    rewardBounty: c.rewardBounty,
    outcome: c.outcome,
    event: {
      title: event.title,
      rules: event.rules,
      options: event.options,
      proofType: event.proofType,
      proofRequirement: event.proofRequirement,
      deadline: event.deadline,
    },
    evidence: db.evidence
      .filter((e) => e.eventId === event.id)
      .map((e) => ({ id: e.id, kind: e.kind, url: e.url, description: e.description })),
  };
}

export const mockDataService: DataService = {
  async listEvents() {
    return db.events.filter((e) => e.status !== "rejected");
  },

  async getEvent(id) {
    return db.events.find((e) => e.id === id) ?? null;
  },

  async getStakesForEvent(eventId) {
    return db.stakes.filter((s) => s.eventId === eventId);
  },

  async getEvidence(eventId) {
    return db.evidence.filter((e) => e.eventId === eventId);
  },

  async getUser(wallet) {
    return db.users.find((u) => u.wallet === wallet) ?? null;
  },

  async listVerifiedUsers() {
    return db.users.filter((u) => u.kycVerified);
  },

  async setKycVerified(wallet) {
    let user = db.users.find((u) => u.wallet === wallet);
    if (!user) {
      user = newUser(wallet);
      db.users.push(user);
    }
    user.kycVerified = true;
    return user;
  },

  async getUserStats(wallet) {
    const stakes = db.stakes.filter((s) => s.wallet === wallet);
    const won = stakes.filter((s) => db.events.find((e) => e.id === s.eventId)?.winningOptionId === s.optionId);
    return {
      betsPlaced: stakes.length,
      betsWon: won.length,
      totalStaked: sum(stakes.map((s) => s.amount)),
      // TODO: real payout math once the program defines it.
      totalWon: sum(won.map((s) => s.amount)),
    };
  },

  async getBetsForUser(wallet) {
    return db.stakes
      .filter((s) => s.wallet === wallet)
      .map((stake) => ({ stake, event: db.events.find((e) => e.id === stake.eventId)! }));
  },

  async getJudgingHistory(wallet, viewer) {
    const cases = db.cases.filter((c) => c.volunteer === wallet && c.status === "voted");
    if (viewer !== wallet) {
      return cases.map((c) => ({ visibility: "public" as const, caseNumber: c.number }));
    }
    return cases.map((c) => ({
      visibility: "full" as const,
      caseNumber: c.number,
      eventTitle: db.events.find((e) => e.id === c.eventId)?.title ?? "",
      choice: db.votes.find((v) => v.caseId === c.id)?.choice ?? "unprovable",
      outcome: c.outcome,
    }));
  },

  async getAssignedCase(volunteer) {
    return db.cases.find((c) => c.volunteer === volunteer && c.status === "assigned") ?? null;
  },

  async getBlindCase(caseId, volunteer) {
    const c = db.cases.find((x) => x.id === caseId);
    // Only the assigned volunteer may open a case.
    if (!c || c.volunteer !== volunteer) return null;
    const event = db.events.find((e) => e.id === c.eventId);
    return event ? toBlindView(c, event) : null;
  },

  async getJudgeStats(volunteer) {
    const voted = db.cases.filter((c) => c.volunteer === volunteer && c.status === "voted");
    const matched = voted.filter((c) => c.outcome === "matched");
    return {
      casesJudged: voted.length,
      matchRate: voted.length ? matched.length / voted.length : 0,
      earned: sum(voted.map((c) => (c.outcome === "matched" ? c.rewardMatch : c.rewardBounty))),
    };
  },

  async assignVolunteer(eventId) {
    const event = db.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found");
    const previous = db.cases.filter((c) => c.eventId === eventId);
    if (previous.length >= MAX_ROUNDS) throw new Error("All review rounds used");

    const excluded = new Set([
      event.creator,
      ...db.stakes.filter((s) => s.eventId === eventId).map((s) => s.wallet),
      ...previous.map((c) => c.volunteer),
    ]);
    const candidates = db.users.filter((u) => u.kycVerified && !excluded.has(u.wallet));
    if (candidates.length === 0) throw new Error("No eligible volunteer");
    // TODO: use verifiable randomness onchain (e.g. a VRF) instead of Math.random.
    const volunteer = candidates[Math.floor(Math.random() * candidates.length)];

    const c: VolunteerCase = {
      id: `case-${db.cases.length + 1}-${Date.now()}`,
      number: Math.max(...db.cases.map((x) => x.number)) + 1,
      eventId,
      volunteer: volunteer.wallet,
      round: (previous.length + 1) as VolunteerCase["round"],
      assignedAt: new Date().toISOString(),
      status: "assigned",
      rewardMatch: "50000000",
      rewardBounty: "10000000",
    };
    db.cases.push(c);
    return c;
  },

  async castVote(caseId, volunteer, choice) {
    const c = db.cases.find((x) => x.id === caseId);
    if (!c || c.volunteer !== volunteer) throw new Error("Case not found");
    if (c.status !== "assigned") throw new Error("Already voted");
    const event = db.events.find((e) => e.id === c.eventId)!;
    const verdict = db.verdicts.find((v) => v.eventId === c.eventId);
    if (!verdict) throw new Error("AI verdict not committed yet");

    db.votes.push({ caseId, volunteer, choice, castAt: new Date().toISOString() });
    c.status = "voted";

    let outcome: CaseOutcome;
    if (choice === verdict.choice) {
      outcome = "matched";
      if (choice === "unprovable") {
        // Both agree the evidence proves nothing: refund like an invalid bet.
        event.status = "invalid";
      } else {
        event.status = "resolved";
        event.winningOptionId = choice;
      }
    } else if (c.round >= MAX_ROUNDS) {
      outcome = "invalid";
      event.status = "invalid";
    } else {
      outcome = "not_matched";
      await this.assignVolunteer(event.id).catch((e) => console.warn("[mock] could not assign next volunteer", e));
    }
    c.outcome = outcome;
    return outcome;
  },

  async commitAiVerdict(verdict: AiVerdict) {
    db.verdicts = db.verdicts.filter((v) => v.eventId !== verdict.eventId);
    db.verdicts.push(verdict);
  },
};
