use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::BetError,
    state::{Config, Event, EventState, KycRecord},
};

#[derive(Accounts)]
#[instruction(volunteer: Pubkey)]
pub struct AssignVolunteer<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = authority)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub event: Account<'info, Event>,
    #[account(seeds = [KYC_SEED, volunteer.as_ref()], bump = volunteer_kyc.bump)]
    pub volunteer_kyc: Account<'info, KycRecord>,
    /// CHECK: the would-be Stake PDA for this volunteer. Must not be a
    /// program-owned (initialized) account, which proves they did not stake.
    #[account(seeds = [STAKE_SEED, event.key().as_ref(), volunteer.as_ref()], bump)]
    pub volunteer_stake: UncheckedAccount<'info>,
}

pub fn handle_assign_volunteer(ctx: Context<AssignVolunteer>, volunteer: Pubkey) -> Result<()> {
    let stake = &ctx.accounts.volunteer_stake;
    // Anyone can send lamports to the address, so check owner and data, not lamports.
    require!(
        stake.owner != &crate::ID && stake.data_is_empty(),
        BetError::VolunteerHasStake
    );

    let event = &mut ctx.accounts.event;
    require!(event.state == EventState::Locked, BetError::WrongState);
    require_keys_neq!(volunteer, event.creator, BetError::VolunteerIsCreator);

    event.current_volunteer = volunteer;
    event.current_vote = None;
    event.state = EventState::AwaitingVote;
    Ok(())
}
