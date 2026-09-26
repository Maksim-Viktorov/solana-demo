use anchor_lang::prelude::*;

use crate::{constants::*, error::BetError, state::Config};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + Config::INIT_SPACE, seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_config(
    ctx: Context<InitializeConfig>,
    treasury: Pubkey,
    fee_bps: u16,
    judge_bonus: u64,
    judge_bounty: u64,
) -> Result<()> {
    require!(fee_bps as u64 <= BPS_DENOMINATOR, BetError::InvalidFee);
    ctx.accounts.config.set_inner(Config {
        authority: ctx.accounts.authority.key(),
        treasury,
        fee_bps,
        judge_bonus,
        judge_bounty,
        bump: ctx.bumps.config,
    });
    Ok(())
}
