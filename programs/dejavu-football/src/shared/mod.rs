use anchor_lang::prelude::*;

#[error_code]
pub enum Errors {
    OracleExpired,
    OracleInvalid,
    BetDuplicated,
    UnauthroizedWithdraw,
    ValueOverFlowed,
}
