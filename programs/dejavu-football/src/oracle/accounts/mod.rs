use anchor_lang::prelude::*;

use crate::shared::Errors;
use crate::AuthorizerAccount;
use crate::CreateAuthorizerInstruction;

#[account]
pub struct Oracle {
    pub authorizer: Pubkey, // 32
    pub teams_ids: [u8; 2], // 2
    pub results: [u8; 2],   // 2
    pub closed_at: i64,     // 8
    pub finished_at: i64,   // 8
    pub is_finished: bool,  // 1
    pub is_invalid: bool,   // 1
    pub context: u8,        // 1
    pub context_id: u64,    // 8
}

#[account]
pub struct OracleInvalidMetadata {
    pub reason: String,
}

#[derive(Accounts)]
#[instruction(instruction: CreateAuthorizerInstruction)]
pub struct CreateOracleAccounts<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 2 + 2 + 8 + 8 + 1 + 1 + 1 + 8,
        seeds = [
            authorizer.key().as_ref(),
            format!("{}", instruction.id).as_bytes().as_ref()
        ],
        bump,
        constraint = authorizer.authority == *user.key,
    )]
    pub oracle: Account<'info, Oracle>,
    pub authorizer: Account<'info, AuthorizerAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateOracleAccounts<'info> {
    #[account(
        mut,
        constraint = oracle.authorizer == *authorizer.to_account_info().key,
        constraint = authorizer.authority == *user.to_account_info().key,
        constraint = oracle.is_invalid == false,
        constraint = oracle.is_finished == false
    )]
    pub oracle: Account<'info, Oracle>,
    pub authorizer: Account<'info, AuthorizerAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(reason: String)]
pub struct InvalidateOracleAccounts<'info> {
    #[account(
        mut,
        constraint = oracle.authorizer == *authorizer.to_account_info().key,
        constraint = authorizer.authority == *user.to_account_info().key,
        constraint = oracle.is_invalid == false,
        constraint = oracle.is_finished == false
    )]
    pub oracle: Account<'info, Oracle>,
    #[account(
        init,
        payer = user,
        space = 8 + 4 + reason.len(),
        seeds = [oracle.key().as_ref(), b"invalid"], 
        bump,
        constraint = authorizer.authority == *user.key,
    )]
    pub oracle_invalid_medata: Account<'info, OracleInvalidMetadata>,
    pub authorizer: Account<'info, AuthorizerAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl Oracle {
    pub fn validate(&self) -> Result<()> {
        let timestamp = Clock::get()?.unix_timestamp;

        if self.is_invalid {
            return err!(Errors::OracleInvalid);
        }

        if timestamp >= self.closed_at {
            return err!(Errors::OracleExpired);
        }

        Ok(())
    }
}
