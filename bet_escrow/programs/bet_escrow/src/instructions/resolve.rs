use anchor_lang::prelude::*;
use solana_sha256_hasher::hashv;

use crate::{
    constants::*,
    error::BetError,
    math::pay_judge,
    state::{Config, Event, EventState, Vault},
};

/// Shared by reveal_and_resolve and record_mismatch.
#[derive(Accounts)]
pub struct Resolve<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = authority)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub event: Account<'info, Event>,
    #[account(mut, seeds = [VAULT_SEED, event.key().as_ref()], bump = event.vault_bump)]
    pub vault: Account<'info, Vault>,
    /// CHECK: receives the judge payment; must be the assigned volunteer.
    #[account(mut, address = event.current_volunteer @ BetError::NotAssignedVolunteer)]
    pub volunteer: UncheckedAccount<'info>,
}

/// Reveals the AI verdict. Allowed when the vote matches, or on a mismatch in
/// the final round. Earlier mismatches go through record_mismatch so the
/// verdict stays hidden from the next volunteer.
pub fn handle_reveal_and_resolve(ctx: Context<Resolve>, option: u8, salt: [u8; 32]) -> Result<()> {
    let config = &ctx.accounts.config;
    let vault = ctx.accounts.vault.to_account_info();
    let volunteer = ctx.accounts.volunteer.to_account_info();
    let event = &mut ctx.accounts.event;

    require!(event.state == EventState::AwaitingVote, BetError::WrongState);
    let vote = event.current_vote.ok_or(BetError::NoVote)?;
    require!(hashv(&[&[option][..], &salt[..]]).to_bytes() == event.verdict_hash, BetError::HashMismatch);
    // Proves every earlier record_mismatch was honest.
    let earlier = (event.round - 1) as usize;
    require!(!event.past_votes[..earlier].contains(&option), BetError::InconsistentReveal);

    if vote == option {
        pay_judge(event, &vault, &volunteer, config.judge_bonus)?;
        if option == UNPROVABLE || event.option_totals[option as usize] == 0 {
            // Nothing provable, or nobody backed the winner: refund everyone.
            event.state = EventState::Invalid;
        } else {
            event.state = EventState::Resolved;
            event.winning_option = Some(option);
        }
    } else {
        require!(event.round == MAX_ROUNDS, BetError::RevealBeforeFinalRound);
        pay_judge(event, &vault, &volunteer, config.judge_bounty)?;
        event.state = EventState::Invalid;
    }
    event.current_volunteer = Pubkey::default();
    Ok(())
}

/// Mismatch in round 1 or 2: pay the bounty and wait for the next volunteer,
/// without revealing the verdict.
pub fn handle_record_mismatch(ctx: Context<Resolve>) -> Result<()> {
    let config = &ctx.accounts.config;
    let vault = ctx.accounts.vault.to_account_info();
    let volunteer = ctx.accounts.volunteer.to_account_info();
    let event = &mut ctx.accounts.event;

    require!(event.state == EventState::AwaitingVote, BetError::WrongState);
    let vote = event.current_vote.ok_or(BetError::NoVote)?;
    require!(event.round < MAX_ROUNDS, BetError::FinalRoundNeedsReveal);

    pay_judge(event, &vault, &volunteer, config.judge_bounty)?;
    let idx = (event.round - 1) as usize;
    event.past_votes[idx] = vote;
    event.round = event.round.checked_add(1).ok_or(BetError::MathOverflow)?;
    event.current_volunteer = Pubkey::default();
    event.current_vote = None;
    event.state = EventState::Locked;
    Ok(())
}
