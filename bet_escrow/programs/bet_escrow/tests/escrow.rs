use {
    anchor_lang::{
        prelude::{Clock, Pubkey},
        solana_program::{instruction::Instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    bet_escrow::{
        accounts as acc, constants::*, error::BetError, instruction as ix,
        state::{Event, EventState},
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_sha256_hasher::hashv,
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

const SOL: u64 = 1_000_000_000;
const FEE_BPS: u16 = 200; // 2%
const BONUS: u64 = SOL / 20; // 0.05 SOL
const BOUNTY: u64 = SOL / 100; // 0.01 SOL
const EVENT_ID: u64 = 7;
const SALT: [u8; 32] = [42; 32];

struct Ctx {
    svm: LiteSVM,
    authority: Keypair,
    treasury: Pubkey,
    creator: Keypair,
    event: Pubkey,
    deadline: i64,
}

fn config_pda() -> Pubkey {
    Pubkey::find_program_address(&[CONFIG_SEED], &bet_escrow::ID).0
}
fn kyc_pda(user: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[KYC_SEED, user.as_ref()], &bet_escrow::ID).0
}
fn event_pda(creator: &Pubkey, id: u64) -> Pubkey {
    Pubkey::find_program_address(&[EVENT_SEED, creator.as_ref(), &id.to_le_bytes()], &bet_escrow::ID).0
}
fn vault_pda(event: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[VAULT_SEED, event.as_ref()], &bet_escrow::ID).0
}
fn stake_pda(event: &Pubkey, user: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[STAKE_SEED, event.as_ref(), user.as_ref()], &bet_escrow::ID).0
}
fn verdict_hash(option: u8) -> [u8; 32] {
    hashv(&[&[option][..], &SALT[..]]).to_bytes()
}
fn code(e: BetError) -> String {
    format!("Custom({})", u32::from(e))
}

impl Ctx {
    /// Fee payer is always the authority, so user balance deltas are exact.
    fn send(&mut self, data: impl InstructionData, accounts: impl ToAccountMetas, signers: &[&Keypair]) -> Result<(), String> {
        let instruction = Instruction::new_with_bytes(bet_escrow::ID, &data.data(), accounts.to_account_metas(None));
        let mut all: Vec<&Keypair> = vec![&self.authority];
        all.extend(signers.iter().copied().filter(|k| k.pubkey() != self.authority.pubkey()));
        let msg = Message::new_with_blockhash(&[instruction], Some(&self.authority.pubkey()), &self.svm.latest_blockhash());
        let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &all).unwrap();
        let res = self.svm.send_transaction(tx).map(|_| ()).map_err(|e| format!("{:?}", e.err));
        self.svm.expire_blockhash();
        res
    }

    fn user(&mut self, kyc: bool) -> Keypair {
        let k = Keypair::new();
        self.svm.airdrop(&k.pubkey(), 10 * SOL).unwrap();
        if kyc {
            self.set_kyc(&k.pubkey());
        }
        k
    }

    fn set_kyc(&mut self, user: &Pubkey) {
        let a = acc::SetKyc {
            authority: self.authority.pubkey(),
            config: config_pda(),
            kyc_record: kyc_pda(user),
            system_program: system_program::ID,
        };
        self.send(ix::SetKyc { user: *user }, a, &[]).unwrap();
    }

    fn stake(&mut self, user: &Keypair, option: u8, amount: u64) -> Result<(), String> {
        let a = acc::PlaceStake {
            user: user.pubkey(),
            user_kyc: kyc_pda(&user.pubkey()),
            event: self.event,
            vault: vault_pda(&self.event),
            stake: stake_pda(&self.event, &user.pubkey()),
            system_program: system_program::ID,
        };
        self.send(ix::PlaceStake { option, amount }, a, &[user])
    }

    fn warp_past_deadline(&mut self, extra: i64) {
        let mut clock = self.svm.get_sysvar::<Clock>();
        clock.unix_timestamp = self.deadline + 1 + extra;
        self.svm.set_sysvar(&clock);
    }

    fn commit(&mut self, option: u8) {
        let a = acc::CommitAiVerdict { authority: self.authority.pubkey(), config: config_pda(), event: self.event };
        self.send(ix::CommitAiVerdict { verdict_hash: verdict_hash(option) }, a, &[]).unwrap();
    }

    fn assign(&mut self, volunteer: &Pubkey) -> Result<(), String> {
        let a = acc::AssignVolunteer {
            authority: self.authority.pubkey(),
            config: config_pda(),
            event: self.event,
            volunteer_kyc: kyc_pda(volunteer),
            volunteer_stake: stake_pda(&self.event, volunteer),
        };
        self.send(ix::AssignVolunteer { volunteer: *volunteer }, a, &[])
    }

    fn vote(&mut self, volunteer: &Keypair, option: u8) {
        let a = acc::CastVote { volunteer: volunteer.pubkey(), event: self.event };
        self.send(ix::CastVote { option }, a, &[volunteer]).unwrap();
    }

    fn resolve_accounts(&self, volunteer: &Pubkey) -> acc::Resolve {
        acc::Resolve {
            authority: self.authority.pubkey(),
            config: config_pda(),
            event: self.event,
            vault: vault_pda(&self.event),
            volunteer: *volunteer,
        }
    }

    fn reveal(&mut self, volunteer: &Pubkey, option: u8) -> Result<(), String> {
        let a = self.resolve_accounts(volunteer);
        self.send(ix::RevealAndResolve { option, salt: SALT }, a, &[])
    }

    fn mismatch(&mut self, volunteer: &Pubkey) -> Result<(), String> {
        let a = self.resolve_accounts(volunteer);
        self.send(ix::RecordMismatch {}, a, &[])
    }

    fn claim_accounts(&self, user: &Pubkey) -> acc::Claim {
        acc::Claim {
            user: *user,
            config: config_pda(),
            treasury: self.treasury,
            event: self.event,
            vault: vault_pda(&self.event),
            stake: stake_pda(&self.event, user),
        }
    }

    fn claim_payout(&mut self, user: &Keypair) -> Result<(), String> {
        let a = self.claim_accounts(&user.pubkey());
        self.send(ix::ClaimPayout {}, a, &[user])
    }

    fn claim_refund(&mut self, user: &Keypair) -> Result<(), String> {
        let a = self.claim_accounts(&user.pubkey());
        self.send(ix::ClaimRefund {}, a, &[user])
    }

    fn event(&self) -> Event {
        let data = self.svm.get_account(&self.event).unwrap().data;
        Event::try_deserialize(&mut &data[..]).unwrap()
    }

    fn balance(&self, k: &Pubkey) -> u64 {
        self.svm.get_balance(k).unwrap_or(0)
    }
}

fn setup() -> Ctx {
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(env!("CARGO_TARGET_TMPDIR"), "/../deploy/bet_escrow.so"));
    svm.add_program(bet_escrow::ID, bytes).unwrap();
    let authority = Keypair::new();
    svm.airdrop(&authority.pubkey(), 100 * SOL).unwrap();
    let treasury = Pubkey::new_unique();
    let now = svm.get_sysvar::<Clock>().unix_timestamp;
    let deadline = now + 3600;
    let creator = Keypair::new();
    let event = event_pda(&creator.pubkey(), EVENT_ID);
    let mut ctx = Ctx { svm, authority, treasury, creator, event, deadline };

    let a = acc::InitializeConfig {
        authority: ctx.authority.pubkey(),
        config: config_pda(),
        system_program: system_program::ID,
    };
    ctx.send(ix::InitializeConfig { treasury, fee_bps: FEE_BPS, judge_bonus: BONUS, judge_bounty: BOUNTY }, a, &[])
        .unwrap();

    let creator = ctx.creator.insecure_clone();
    ctx.svm.airdrop(&creator.pubkey(), 10 * SOL).unwrap();
    ctx.set_kyc(&creator.pubkey());
    let a = acc::CreateEvent {
        creator: creator.pubkey(),
        config: config_pda(),
        creator_kyc: kyc_pda(&creator.pubkey()),
        event,
        vault: vault_pda(&event),
        system_program: system_program::ID,
    };
    ctx.send(ix::CreateEvent { event_id: EVENT_ID, option_count: 2, rules_hash: [1; 32], deadline }, a, &[&creator])
        .unwrap();
    ctx
}

fn mul_div(a: u64, b: u64, c: u64) -> u64 {
    (a as u128 * b as u128 / c as u128) as u64
}

#[test]
fn happy_path_round_one_match_and_winners_claim() {
    let mut c = setup();
    let (bob, carol, dan, vic) = (c.user(true), c.user(true), c.user(true), c.user(true));
    c.stake(&bob, 0, 2 * SOL).unwrap();
    c.stake(&carol, 0, SOL).unwrap();
    c.stake(&dan, 1, 3 * SOL).unwrap();

    c.warp_past_deadline(0);
    c.commit(0);
    // Only the hash is onchain, not the option.
    assert_eq!(c.event().verdict_hash, verdict_hash(0));
    assert_eq!(c.event().state, EventState::Locked);

    c.assign(&vic.pubkey()).unwrap();
    c.vote(&vic, 0);
    let vic_before = c.balance(&vic.pubkey());
    c.reveal(&vic.pubkey(), 0).unwrap();

    let e = c.event();
    assert_eq!(e.state, EventState::Resolved);
    assert_eq!(e.winning_option, Some(0));
    assert_eq!(c.balance(&vic.pubkey()) - vic_before, BONUS);

    let pool = 6 * SOL;
    let fee = mul_div(pool, FEE_BPS as u64, 10_000);
    let distributable = pool - fee - BONUS;
    for (user, amount) in [(&bob, 2 * SOL), (&carol, SOL)] {
        let before = c.balance(&user.pubkey());
        let stake_rent = c.balance(&stake_pda(&c.event, &user.pubkey()));
        c.claim_payout(user).unwrap();
        let got = c.balance(&user.pubkey()) - before - stake_rent;
        assert_eq!(got, mul_div(amount, distributable, 3 * SOL));
    }
    // Fee paid to the treasury exactly once across both claims.
    assert_eq!(c.balance(&c.treasury), fee);

    // Losers and double claims are rejected.
    assert!(c.claim_payout(&dan).unwrap_err().contains(&code(BetError::NotAWinner)));
    assert!(c.claim_payout(&bob).is_err());
    // Vault never dips below its rent reserve.
    assert!(c.balance(&vault_pda(&c.event)) > 0);
}

#[test]
fn three_mismatches_make_event_invalid_and_everyone_refunds() {
    let mut c = setup();
    let (bob, dan) = (c.user(true), c.user(true));
    let vols = [c.user(true), c.user(true), c.user(true)];
    c.stake(&bob, 0, 2 * SOL).unwrap();
    c.stake(&dan, 1, 4 * SOL).unwrap();

    c.warp_past_deadline(0);
    c.commit(0);

    for (round, v) in vols.iter().enumerate() {
        c.assign(&v.pubkey()).unwrap();
        c.vote(v, if round == 2 { UNPROVABLE } else { 1 });
        let before = c.balance(&v.pubkey());
        if round < 2 {
            // Revealing on an early mismatch would leak the verdict, so it is refused.
            assert!(c.reveal(&v.pubkey(), 0).unwrap_err().contains(&code(BetError::RevealBeforeFinalRound)));
            c.mismatch(&v.pubkey()).unwrap();
            assert_eq!(c.event().state, EventState::Locked);
            assert_eq!(c.event().round as usize, round + 2);
        } else {
            assert!(c.mismatch(&v.pubkey()).unwrap_err().contains(&code(BetError::FinalRoundNeedsReveal)));
            c.reveal(&v.pubkey(), 0).unwrap();
        }
        assert_eq!(c.balance(&v.pubkey()) - before, BOUNTY);
    }
    assert_eq!(c.event().state, EventState::Invalid);

    let pool = 6 * SOL;
    let fee = mul_div(pool, FEE_BPS as u64, 10_000);
    let distributable = pool - fee - 3 * BOUNTY;
    for (user, amount) in [(&bob, 2 * SOL), (&dan, 4 * SOL)] {
        let before = c.balance(&user.pubkey());
        let stake_rent = c.balance(&stake_pda(&c.event, &user.pubkey()));
        c.claim_refund(user).unwrap();
        assert_eq!(c.balance(&user.pubkey()) - before - stake_rent, mul_div(amount, distributable, pool));
    }
    assert_eq!(c.balance(&c.treasury), fee);
    assert!(c.claim_refund(&bob).is_err());
}

#[test]
fn staker_and_creator_cannot_be_volunteers() {
    let mut c = setup();
    let bob = c.user(true);
    c.stake(&bob, 0, SOL).unwrap();
    c.warp_past_deadline(0);
    c.commit(0);
    assert!(c.assign(&bob.pubkey()).unwrap_err().contains(&code(BetError::VolunteerHasStake)));
    let creator = c.creator.pubkey();
    assert!(c.assign(&creator).unwrap_err().contains(&code(BetError::VolunteerIsCreator)));
    let vic = c.user(true);
    c.assign(&vic.pubkey()).unwrap();
}

#[test]
fn non_kyc_wallet_cannot_stake() {
    let mut c = setup();
    let eve = c.user(false);
    // 3012 = Anchor AccountNotInitialized: the KycRecord PDA does not exist.
    assert!(c.stake(&eve, 0, SOL).unwrap_err().contains("Custom(3012)"));
    let bob = c.user(true);
    c.stake(&bob, 0, SOL).unwrap();
    c.warp_past_deadline(0);
    assert!(c.stake(&bob, 0, SOL).is_err());
}

#[test]
fn dishonest_mismatch_blocks_reveal() {
    let mut c = setup();
    let bob = c.user(true);
    c.stake(&bob, 0, SOL).unwrap();
    let (v1, v2) = (c.user(true), c.user(true));
    c.warp_past_deadline(0);
    c.commit(0);
    c.assign(&v1.pubkey()).unwrap();
    c.vote(&v1, 0);
    // Authority wrongly records a matching vote as a mismatch...
    c.mismatch(&v1.pubkey()).unwrap();
    c.assign(&v2.pubkey()).unwrap();
    c.vote(&v2, 0);
    // ...so the verdict can never be revealed, and only the timeout can end it.
    assert!(c.reveal(&v2.pubkey(), 0).unwrap_err().contains(&code(BetError::InconsistentReveal)));
}

#[test]
fn stuck_event_can_be_marked_invalid_after_timeout() {
    let mut c = setup();
    let bob = c.user(true);
    c.stake(&bob, 0, SOL).unwrap();
    let anyone = c.user(false);
    let a = acc::MarkInvalidTimeout { caller: anyone.pubkey(), event: c.event };
    c.warp_past_deadline(0);
    assert!(c
        .send(ix::MarkInvalidTimeout {}, a, &[&anyone])
        .unwrap_err()
        .contains(&code(BetError::TimeoutNotReached)));
    c.warp_past_deadline(RESOLUTION_TIMEOUT_SECS);
    let a = acc::MarkInvalidTimeout { caller: anyone.pubkey(), event: c.event };
    c.send(ix::MarkInvalidTimeout {}, a, &[&anyone]).unwrap();
    assert_eq!(c.event().state, EventState::Invalid);
    c.claim_refund(&bob).unwrap();
}
