use anchor_lang::prelude::*;

#[error_code]
pub enum BetError {
    #[msg("Fee must be at most 10000 bps")]
    InvalidFee,
    #[msg("Option count must be between 2 and 4")]
    InvalidOptionCount,
    #[msg("Deadline must be in the future")]
    DeadlineInPast,
    #[msg("Option index out of range")]
    InvalidOption,
    #[msg("Stake amount must be greater than zero")]
    ZeroAmount,
    #[msg("The event is not in the required state")]
    WrongState,
    #[msg("The deadline has passed")]
    DeadlinePassed,
    #[msg("The deadline has not passed yet")]
    DeadlineNotReached,
    #[msg("The volunteer has a stake in this event")]
    VolunteerHasStake,
    #[msg("The event creator cannot be the volunteer")]
    VolunteerIsCreator,
    #[msg("Signer is not the assigned volunteer")]
    NotAssignedVolunteer,
    #[msg("The volunteer has already voted")]
    AlreadyVoted,
    #[msg("No vote has been cast yet")]
    NoVote,
    #[msg("Revealed verdict does not match the committed hash")]
    HashMismatch,
    #[msg("Revealed verdict equals an earlier round's vote that was recorded as a mismatch")]
    InconsistentReveal,
    #[msg("A mismatch before the final round must use record_mismatch, not reveal")]
    RevealBeforeFinalRound,
    #[msg("Final round mismatch must be revealed")]
    FinalRoundNeedsReveal,
    #[msg("This stake did not win")]
    NotAWinner,
    #[msg("The resolution timeout has not passed")]
    TimeoutNotReached,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
