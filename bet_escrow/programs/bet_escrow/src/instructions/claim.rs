use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::BetError,
    math::{collect_fee_once, distributable, mul_div, pay_from_vault},
    state::{Config, Event, EventState, Stake, Vault},
};

/// Shared by claim_payout and claim_refund. Closing the stake makes each
/// claim one-shot and returns its rent to the user.
#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    /// CHECK: fee destination, pinned to the config.
    #[account(mut, address = config.treasury)]
    pub treasury: UncheckedAccount<'info>,
    #[account(mut)]
    pub event: Account<'info, Event>,
    #[account(mut, seeds = [VAULT_SEED, event.key().as_ref()], bump = event.vault_bump)]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        close = user,
        seeds = [STAKE_SEED, event.key().as_ref(), user.key().as_ref()],
        bump = stake.bump,
        has_one = user,
        has_one = event,
    )]
    pub stake: Account<'info, Stake>,
}

pub fn handle_claim_payout(ctx: Context<Claim>) -> Result<()> {
    let vault = ctx.accounts.vault.to_account_info();
    let event = &mut ctx.accounts.event;
    require!(event.state == EventState::Resolved, BetError::WrongState);
    let winner = event.winning_option.ok_or(BetError::WrongState)?;
    require!(ctx.accounts.stake.option == winner, BetError::NotAWinner);

    // Pro-rata share of what is left after fee and judge payments.
    let payout = mul_div(ctx.accounts.stake.amount, distributable(event)?, event.option_totals[winner as usize])?;
    collect_fee_once(event, &vault, &ctx.accounts.treasury.to_account_info())?;
    pay_from_vault(&vault, &ctx.accounts.user.to_account_info(), payout)
}

pub fn handle_claim_refund(ctx: Context<Claim>) -> Result<()> {
    let vault = ctx.accounts.vault.to_account_info();
    let event = &mut ctx.accounts.event;
    require!(event.state == EventState::Invalid, BetError::WrongState);

    // Stake back, scaled down by the same fee and judge payments for everyone.
    let refund = mul_div(ctx.accounts.stake.amount, distributable(event)?, event.total_pool)?;
    collect_fee_once(event, &vault, &ctx.accounts.treasury.to_account_info())?;
    pay_from_vault(&vault, &ctx.accounts.user.to_account_info(), refund)
}
