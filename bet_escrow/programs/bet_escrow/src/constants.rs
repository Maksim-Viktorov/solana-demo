use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
#[constant]
pub const KYC_SEED: &[u8] = b"kyc";
#[constant]
pub const EVENT_SEED: &[u8] = b"event";
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";
#[constant]
pub const STAKE_SEED: &[u8] = b"stake";

pub const MIN_OPTIONS: u8 = 2;
pub const MAX_OPTIONS: u8 = 4;
pub const MAX_ROUNDS: u8 = 3;
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Vote / verdict value for "evidence doesn't prove either option".
#[constant]
pub const UNPROVABLE: u8 = 255;

/// After deadline + this, anyone can mark a stuck event Invalid.
#[constant]
pub const RESOLUTION_TIMEOUT_SECS: i64 = 72 * 60 * 60;
