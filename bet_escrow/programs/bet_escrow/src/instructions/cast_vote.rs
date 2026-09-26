use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::BetError,
    state::{Event, EventState},
};

#[derive(Accounts)]
pub struct CastVote<'info> {
    pub volunteer: Signer<'info>,
    #[account(mut)]
    pub event: Account<'info, Event>,
}

pub fn handle_cast_vote(ctx: Context<CastVote>, option: u8) -> Result<()> {
    let event = &mut ctx.accounts.event;
    require!(event.state == EventState::AwaitingVote, BetError::WrongState);
    require_keys_eq!(ctx.accounts.volunteer.key(), event.current_volunteer, BetError::NotAssignedVolunteer);
    require!(event.current_vote.is_none(), BetError::AlreadyVoted);
    require!(option < event.option_count || option == UNPROVABLE, BetError::InvalidOption);
    event.current_vote = Some(option);
    Ok(())
}
