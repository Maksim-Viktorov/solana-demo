pub mod constants;
pub mod error;
pub mod instructions;
pub mod math;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("HofsuPYrMhrRzpt4XFcMr4AvEu98WzTj7YPUofoEtdsv");

#[program]
pub mod bet_escrow {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        treasury: Pubkey,
        fee_bps: u16,
        judge_bonus: u64,
        judge_bounty: u64,
    ) -> Result<()> {
        instructions::initialize_config::handle_initialize_config(ctx, treasury, fee_bps, judge_bonus, judge_bounty)
    }

    pub fn set_kyc(ctx: Context<SetKyc>, user: Pubkey) -> Result<()> {
        instructions::set_kyc::handle_set_kyc(ctx, user)
    }

    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_id: u64,
        option_count: u8,
        rules_hash: [u8; 32],
        deadline: i64,
    ) -> Result<()> {
        instructions::create_event::handle_create_event(ctx, event_id, option_count, rules_hash, deadline)
    }

    pub fn place_stake(ctx: Context<PlaceStake>, option: u8, amount: u64) -> Result<()> {
        instructions::place_stake::handle_place_stake(ctx, option, amount)
    }

    pub fn commit_ai_verdict(ctx: Context<CommitAiVerdict>, verdict_hash: [u8; 32]) -> Result<()> {
        instructions::commit_ai_verdict::handle_commit_ai_verdict(ctx, verdict_hash)
    }

    pub fn assign_volunteer(ctx: Context<AssignVolunteer>, volunteer: Pubkey) -> Result<()> {
        instructions::assign_volunteer::handle_assign_volunteer(ctx, volunteer)
    }

    pub fn cast_vote(ctx: Context<CastVote>, option: u8) -> Result<()> {
        instructions::cast_vote::handle_cast_vote(ctx, option)
    }

    pub fn reveal_and_resolve(ctx: Context<Resolve>, option: u8, salt: [u8; 32]) -> Result<()> {
        instructions::resolve::handle_reveal_and_resolve(ctx, option, salt)
    }

    pub fn record_mismatch(ctx: Context<Resolve>) -> Result<()> {
        instructions::resolve::handle_record_mismatch(ctx)
    }

    pub fn claim_payout(ctx: Context<Claim>) -> Result<()> {
        instructions::claim::handle_claim_payout(ctx)
    }

    pub fn claim_refund(ctx: Context<Claim>) -> Result<()> {
        instructions::claim::handle_claim_refund(ctx)
    }

    pub fn mark_invalid_timeout(ctx: Context<MarkInvalidTimeout>) -> Result<()> {
        instructions::mark_invalid_timeout::handle_mark_invalid_timeout(ctx)
    }
}
