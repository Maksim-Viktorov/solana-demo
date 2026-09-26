use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::BetError,
    state::{Event, EventState},
};

#[derive(Accounts)]
pub struct MarkInvalidTimeout<'info> {
    /// Anyone can call this.
    pub caller: Signer<'info>,
    #[account(mut)]
    pub event: Account<'info, Event>,
}

pub fn handle_mark_invalid_timeout(ctx: Context<MarkInvalidTimeout>) -> Result<()> {
    let event = &mut ctx.accounts.event;
    require!(
        matches!(event.state, EventState::Open | EventState::Locked | EventState::AwaitingVote),
        BetError::WrongState
    );
    let cutoff = event.deadline.checked_add(RESOLUTION_TIMEOUT_SECS).ok_or(BetError::MathOverflow)?;
    require!(Clock::get()?.unix_timestamp > cutoff, BetError::TimeoutNotReached);
    event.state = EventState::Invalid;
    event.current_volunteer = Pubkey::default();
    Ok(())
}
