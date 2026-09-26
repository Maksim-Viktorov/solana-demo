use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::BetError,
    state::{Config, Event, EventState},
};

#[derive(Accounts)]
pub struct CommitAiVerdict<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = authority)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub event: Account<'info, Event>,
}

/// Stores only sha256(option || salt). The option stays offchain until
/// reveal_and_resolve, so chain state never shows the AI verdict to volunteers.
pub fn handle_commit_ai_verdict(ctx: Context<CommitAiVerdict>, verdict_hash: [u8; 32]) -> Result<()> {
    let event = &mut ctx.accounts.event;
    require!(event.state == EventState::Open, BetError::WrongState);
    require!(Clock::get()?.unix_timestamp >= event.deadline, BetError::DeadlineNotReached);
    event.verdict_hash = verdict_hash;
    event.state = EventState::Locked;
    Ok(())
}
