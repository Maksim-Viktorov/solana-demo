use anchor_lang::prelude::*;

use crate::{constants::BPS_DENOMINATOR, error::BetError, state::Event};

/// a * b / c in u128, floored.
pub fn mul_div(a: u64, b: u64, c: u64) -> Result<u64> {
    let r = (a as u128)
        .checked_mul(b as u128)
        .ok_or(BetError::MathOverflow)?
        .checked_div(c as u128)
        .ok_or(BetError::MathOverflow)?;
    u64::try_from(r).map_err(|_| BetError::MathOverflow.into())
}

pub fn platform_fee(event: &Event) -> Result<u64> {
    mul_div(event.total_pool, event.fee_bps as u64, BPS_DENOMINATOR)
}

/// What is left for bettors: pool minus fee minus judge payments.
pub fn distributable(event: &Event) -> Result<u64> {
    event
        .total_pool
        .checked_sub(platform_fee(event)?)
        .and_then(|x| x.checked_sub(event.judge_paid))
        .ok_or(BetError::MathOverflow.into())
}

/// Moves lamports out of the program-owned vault. Payouts are computed from
/// the event's bookkeeping, never from the vault balance, so the vault's own
/// rent-exempt reserve is never touched.
pub fn pay_from_vault<'info>(vault: &AccountInfo<'info>, to: &AccountInfo<'info>, amount: u64) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    vault.sub_lamports(amount)?;
    to.add_lamports(amount)?;
    Ok(())
}

/// Pays a judge, capped so judge payments can never eat into the platform fee
/// or push the pool accounting negative on tiny pools.
pub fn pay_judge<'info>(
    event: &mut Event,
    vault: &AccountInfo<'info>,
    volunteer: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    let amount = amount.min(distributable(event)?);
    event.judge_paid = event.judge_paid.checked_add(amount).ok_or(BetError::MathOverflow)?;
    pay_from_vault(vault, volunteer, amount)
}

/// Sends the platform fee to the treasury the first time anyone claims.
pub fn collect_fee_once<'info>(event: &mut Event, vault: &AccountInfo<'info>, treasury: &AccountInfo<'info>) -> Result<()> {
    if event.fee_collected {
        return Ok(());
    }
    event.fee_collected = true;
    pay_from_vault(vault, treasury, platform_fee(event)?)
}
