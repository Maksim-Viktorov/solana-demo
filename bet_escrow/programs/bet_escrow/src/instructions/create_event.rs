use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::BetError,
    state::{Config, Event, EventState, KycRecord, Vault},
};

#[derive(Accounts)]
#[instruction(event_id: u64)]
pub struct CreateEvent<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(seeds = [KYC_SEED, creator.key().as_ref()], bump = creator_kyc.bump)]
    pub creator_kyc: Account<'info, KycRecord>,
    #[account(
        init,
        payer = creator,
        space = 8 + Event::INIT_SPACE,
        seeds = [EVENT_SEED, creator.key().as_ref(), &event_id.to_le_bytes()],
        bump
    )]
    pub event: Account<'info, Event>,
    #[account(init, payer = creator, space = 8 + Vault::INIT_SPACE, seeds = [VAULT_SEED, event.key().as_ref()], bump)]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_event(
    ctx: Context<CreateEvent>,
    event_id: u64,
    option_count: u8,
    rules_hash: [u8; 32],
    deadline: i64,
) -> Result<()> {
    require!((MIN_OPTIONS..=MAX_OPTIONS).contains(&option_count), BetError::InvalidOptionCount);
    require!(deadline > Clock::get()?.unix_timestamp, BetError::DeadlineInPast);

    ctx.accounts.vault.set_inner(Vault { event: ctx.accounts.event.key(), bump: ctx.bumps.vault });
    ctx.accounts.event.set_inner(Event {
        creator: ctx.accounts.creator.key(),
        event_id,
        option_count,
        rules_hash,
        deadline,
        state: EventState::Open,
        winning_option: None,
        round: 1,
        current_volunteer: Pubkey::default(),
        current_vote: None,
        past_votes: [0; 2],
        verdict_hash: [0; 32],
        total_pool: 0,
        option_totals: [0; 4],
        fee_bps: ctx.accounts.config.fee_bps,
        fee_collected: false,
        judge_paid: 0,
        bump: ctx.bumps.event,
        vault_bump: ctx.bumps.vault,
    });
    Ok(())
}
