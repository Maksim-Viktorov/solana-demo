use anchor_lang::prelude::*;

use crate::{constants::*, state::{Config, KycRecord}};

#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct SetKyc<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = authority)]
    pub config: Account<'info, Config>,
    #[account(init, payer = authority, space = 8 + KycRecord::INIT_SPACE, seeds = [KYC_SEED, user.as_ref()], bump)]
    pub kyc_record: Account<'info, KycRecord>,
    pub system_program: Program<'info, System>,
}

pub fn handle_set_kyc(ctx: Context<SetKyc>, user: Pubkey) -> Result<()> {
    ctx.accounts.kyc_record.set_inner(KycRecord {
        user,
        verified_at: Clock::get()?.unix_timestamp,
        bump: ctx.bumps.kyc_record,
    });
    Ok(())
}
