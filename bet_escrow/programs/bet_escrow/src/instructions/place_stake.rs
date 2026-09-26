use anchor_lang::{prelude::*, system_program};

use crate::{
    constants::*,
    error::BetError,
    state::{Event, EventState, KycRecord, Stake, Vault},
};

#[derive(Accounts)]
pub struct PlaceStake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(seeds = [KYC_SEED, user.key().as_ref()], bump = user_kyc.bump)]
    pub user_kyc: Account<'info, KycRecord>,
    #[account(mut)]
    pub event: Account<'info, Event>,
    #[account(mut, seeds = [VAULT_SEED, event.key().as_ref()], bump = event.vault_bump)]
    pub vault: Account<'info, Vault>,
    #[account(
        init,
        payer = user,
        space = 8 + Stake::INIT_SPACE,
        seeds = [STAKE_SEED, event.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub stake: Account<'info, Stake>,
    pub system_program: Program<'info, System>,
}

pub fn handle_place_stake(ctx: Context<PlaceStake>, option: u8, amount: u64) -> Result<()> {
    let event = &mut ctx.accounts.event;
    require!(event.state == EventState::Open, BetError::WrongState);
    require!(Clock::get()?.unix_timestamp < event.deadline, BetError::DeadlinePassed);
    require!(option < event.option_count, BetError::InvalidOption);
    require!(amount > 0, BetError::ZeroAmount);

    system_program::transfer(
        CpiContext::new(
            system_program::ID,
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        amount,
    )?;

    let i = option as usize;
    event.option_totals[i] = event.option_totals[i].checked_add(amount).ok_or(BetError::MathOverflow)?;
    event.total_pool = event.total_pool.checked_add(amount).ok_or(BetError::MathOverflow)?;

    ctx.accounts.stake.set_inner(Stake {
        event: event.key(),
        user: ctx.accounts.user.key(),
        option,
        amount,
        bump: ctx.bumps.stake,
    });
    Ok(())
}
