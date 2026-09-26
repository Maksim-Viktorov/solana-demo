use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub judge_bonus: u64,
    pub judge_bounty: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct KycRecord {
    pub user: Pubkey,
    pub verified_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum EventState {
    /// Accepting stakes until the deadline.
    Open,
    /// AI verdict committed, waiting for a volunteer to be assigned.
    Locked,
    /// Volunteer assigned, waiting for (or holding) their vote.
    AwaitingVote,
    Resolved,
    Invalid,
}

#[account]
#[derive(InitSpace)]
pub struct Event {
    pub creator: Pubkey,
    pub event_id: u64,
    pub option_count: u8,
    pub rules_hash: [u8; 32],
    pub deadline: i64,
    pub state: EventState,
    pub winning_option: Option<u8>,
    /// 1..=3
    pub round: u8,
    /// Pubkey::default() when nobody is assigned.
    pub current_volunteer: Pubkey,
    pub current_vote: Option<u8>,
    /// Votes from rounds recorded as mismatches, checked at reveal time.
    pub past_votes: [u8; 2],
    /// sha256(option || salt). The option itself is never stored before reveal.
    pub verdict_hash: [u8; 32],
    pub total_pool: u64,
    pub option_totals: [u64; 4],
    /// Snapshot of the config fee when the event was created.
    pub fee_bps: u16,
    pub fee_collected: bool,
    /// Bonuses and bounties already paid out of the vault.
    pub judge_paid: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

/// Program-owned vault, so the program can move lamports out directly.
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub event: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Stake {
    pub event: Pubkey,
    pub user: Pubkey,
    pub option: u8,
    pub amount: u64,
    pub bump: u8,
}
