import type { AiVerdict, Event, Evidence, Stake, UserProfile, Vote, VolunteerCase } from "@/lib/types";

const SOL = BigInt(1_000_000_000);
const sol = (n: number) => ((BigInt(Math.round(n * 1000)) * SOL) / BigInt(1000)).toString();
const DAY = 24 * 60 * 60 * 1000;
// Relative dates so "open" events stay in the future however old the seed is.
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY).toISOString();

export const ALICE = "2No5yEb32DrKdD7HAnFu63FngfmAtBDziyhL8LZgADih";
export const BOB = "PqJfQvdj7tqdU5DEccQWDAvdxczrhU9ghUNZFaE9xvo";

export const seedUsers: UserProfile[] = [
  {
    wallet: ALICE,
    displayName: "Alice Byrne",
    joinedAt: daysFromNow(-120),
    kycVerified: true,
    trust: { bettor: 0.92, volunteer: 0.97, proofOnTime: 0.96, evidenceAccepted: 1, disputesLost: 1 },
  },
  {
    wallet: BOB,
    displayName: "Bob Okafor",
    joinedAt: daysFromNow(-45),
    kycVerified: true,
    trust: { bettor: 0.74, volunteer: 0.81, proofOnTime: 0.88, evidenceAccepted: 0.9, disputesLost: 2 },
  },
];

const yesNo = (eventId: string) => [
  { id: `${eventId}-yes`, label: "Yes" },
  { id: `${eventId}-no`, label: "No" },
];

function event(e: Omit<Event, "options" | "totalPool" | "poolByOption"> & { pools: [number, number] }): Event {
  const options = yesNo(e.id);
  const { pools, ...rest } = e;
  return {
    ...rest,
    options,
    totalPool: sol(pools[0] + pools[1]),
    poolByOption: { [options[0].id]: sol(pools[0]), [options[1].id]: sol(pools[1]) },
  };
}

export const seedEvents: Event[] = [
  event({
    id: "evt-1",
    title: "Will Conor pass his driving test by Friday?",
    description: "Conor's third attempt at the full driving test, booked at the Finglas centre.",
    creator: ALICE,
    subject: "Conor",
    category: "life",
    rules: [
      "Resolves Yes if Conor passes the full driving test on or before the deadline.",
      "A rescheduled test after the deadline resolves No.",
    ],
    proofType: "document",
    proofRequirement: "Photo of the official pass certificate showing Conor's name and the test date.",
    deadline: daysFromNow(3),
    createdAt: daysFromNow(-4),
    status: "open",
    pools: [2.5, 1.2],
  }),
  event({
    id: "evt-2",
    title: "Will Priya run a sub-25 minute 5k this Saturday?",
    description: "Priya is running the Phoenix Park parkrun.",
    creator: BOB,
    subject: "Priya",
    category: "sports",
    rules: ["Resolves Yes if Priya's official parkrun time is under 25:00.", "Unofficial watch times do not count."],
    proofType: "link",
    proofRequirement: "Link to the official parkrun results page listing Priya's time.",
    deadline: daysFromNow(5),
    createdAt: daysFromNow(-2),
    status: "open",
    pools: [0.8, 0.6],
  }),
  event({
    id: "evt-3",
    title: "Will Sam finish reading Dune before the deadline?",
    description: "Sam claims he will finally finish the book.",
    creator: ALICE,
    subject: "Sam",
    category: "study",
    rules: ["Resolves Yes if Sam's Goodreads shows Dune as read with a finish date before the deadline."],
    proofType: "screenshot",
    proofRequirement: "Screenshot of Sam's Goodreads profile with Dune marked as read and the finish date visible.",
    deadline: daysFromNow(-1),
    createdAt: daysFromNow(-14),
    status: "awaiting_evidence",
    pools: [0.5, 0.9],
  }),
  event({
    id: "evt-4",
    title: "Will Mia hit 10,000 steps every day this week?",
    description: "Seven days in a row, tracked on her phone.",
    creator: BOB,
    subject: "Mia",
    category: "sports",
    rules: ["Resolves Yes if every day Monday to Sunday shows at least 10,000 steps.", "One missed day resolves No."],
    proofType: "screenshot",
    proofRequirement: "Screenshot of the weekly step view in Apple Health or Google Fit showing all 7 days.",
    deadline: daysFromNow(-2),
    createdAt: daysFromNow(-10),
    status: "in_review",
    pools: [1.0, 1.4],
  }),
  event({
    id: "evt-5",
    title: "Will Tom submit his thesis by the 15th?",
    description: "Final-year thesis submission deadline.",
    creator: ALICE,
    subject: "Tom",
    category: "study",
    rules: ["Resolves Yes if the university submission portal confirms receipt before the deadline."],
    proofType: "screenshot",
    proofRequirement: "Screenshot of the submission confirmation email with the timestamp.",
    deadline: daysFromNow(-9),
    createdAt: daysFromNow(-30),
    status: "resolved",
    pools: [3.0, 1.0],
    winningOptionId: "evt-5-yes",
  }),
  event({
    id: "evt-6",
    title: "Will Jake go two weeks without coffee?",
    description: "Jake says he is quitting caffeine.",
    creator: ALICE,
    subject: "Jake",
    category: "life",
    rules: ["Resolves Yes if Jake's card statement shows no coffee shop purchases for 14 days."],
    proofType: "document",
    proofRequirement: "Bank statement export covering the 14 days, with merchant names visible.",
    deadline: daysFromNow(-20),
    createdAt: daysFromNow(-40),
    status: "invalid",
    pools: [0.4, 0.7],
  }),
];

export const seedStakes: Stake[] = [
  { id: "stk-1", eventId: "evt-1", wallet: ALICE, optionId: "evt-1-yes", amount: sol(1.5), placedAt: daysFromNow(-3) },
  { id: "stk-2", eventId: "evt-1", wallet: BOB, optionId: "evt-1-no", amount: sol(1.2), placedAt: daysFromNow(-3) },
  { id: "stk-3", eventId: "evt-2", wallet: BOB, optionId: "evt-2-yes", amount: sol(0.8), placedAt: daysFromNow(-1) },
  { id: "stk-4", eventId: "evt-3", wallet: ALICE, optionId: "evt-3-no", amount: sol(0.5), placedAt: daysFromNow(-12) },
  { id: "stk-5", eventId: "evt-4", wallet: BOB, optionId: "evt-4-no", amount: sol(1.4), placedAt: daysFromNow(-9) },
  { id: "stk-6", eventId: "evt-5", wallet: ALICE, optionId: "evt-5-yes", amount: sol(2.0), placedAt: daysFromNow(-25), payoutClaimed: true },
  { id: "stk-7", eventId: "evt-6", wallet: ALICE, optionId: "evt-6-yes", amount: sol(0.4), placedAt: daysFromNow(-35) },
];

export const seedEvidence: Evidence[] = [
  {
    id: "evd-1",
    eventId: "evt-4",
    uploadedBy: BOB,
    kind: "screenshot",
    url: "/placeholder-evidence.png",
    description: "Apple Health weekly view, 7 days.",
    uploadedAt: daysFromNow(-1),
  },
  {
    id: "evd-2",
    eventId: "evt-5",
    uploadedBy: ALICE,
    kind: "screenshot",
    url: "/placeholder-evidence.png",
    description: "Submission confirmation email.",
    uploadedAt: daysFromNow(-8),
  },
  {
    id: "evd-3",
    eventId: "evt-6",
    uploadedBy: ALICE,
    kind: "document",
    url: "/placeholder-evidence.png",
    description: "Bank statement export, partially cropped.",
    uploadedAt: daysFromNow(-19),
  },
];

export const seedVerdicts: AiVerdict[] = [
  {
    eventId: "evt-4",
    choice: "evt-4-no",
    confidence: 0.91,
    reasoning: "Thursday shows 8,412 steps, below the 10,000 threshold.",
    commitment: "mock-commitment-evt-4",
    committedAt: daysFromNow(-1),
  },
  {
    eventId: "evt-5",
    choice: "evt-5-yes",
    confidence: 0.97,
    reasoning: "Confirmation email timestamp is two days before the deadline.",
    commitment: "mock-commitment-evt-5",
    committedAt: daysFromNow(-8),
  },
  {
    eventId: "evt-6",
    choice: "evt-6-yes",
    confidence: 0.55,
    reasoning: "No coffee merchants visible, but the export is cropped.",
    commitment: "mock-commitment-evt-6",
    committedAt: daysFromNow(-19),
  },
];

export const seedCases: VolunteerCase[] = [
  {
    id: "case-1",
    number: 1042,
    eventId: "evt-4",
    volunteer: ALICE,
    round: 1,
    assignedAt: daysFromNow(-1),
    status: "assigned",
    rewardMatch: sol(0.05),
    rewardBounty: sol(0.01),
  },
  {
    id: "case-2",
    number: 1017,
    eventId: "evt-5",
    volunteer: BOB,
    round: 1,
    assignedAt: daysFromNow(-8),
    status: "voted",
    rewardMatch: sol(0.05),
    rewardBounty: sol(0.01),
    outcome: "matched",
  },
  {
    id: "case-3",
    number: 998,
    eventId: "evt-6",
    volunteer: BOB,
    round: 3,
    assignedAt: daysFromNow(-18),
    status: "voted",
    rewardMatch: sol(0.05),
    rewardBounty: sol(0.01),
    outcome: "invalid",
  },
];

export const seedVotes: Vote[] = [
  { caseId: "case-2", volunteer: BOB, choice: "evt-5-yes", castAt: daysFromNow(-7) },
  { caseId: "case-3", volunteer: BOB, choice: "unprovable", castAt: daysFromNow(-17) },
];
