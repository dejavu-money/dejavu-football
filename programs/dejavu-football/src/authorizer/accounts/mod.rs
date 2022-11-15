use crate::{CreateAuthorizerInstruction, UpdateAuthorizerInstruction};
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;

#[account]
#[derive(Debug)]
pub struct AuthorizerAccount {
    pub authority: Pubkey, // 32
    pub mint: Pubkey,      // 32
    pub fee: u64,          // 8
}

#[derive(Accounts)]
#[instruction(instruction: CreateAuthorizerInstruction)]
pub struct CreateAuthorizerAccounts<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 8,
        seeds = [
            "authorizer".as_bytes().as_ref(), 
            format!("{}", instruction.id).as_bytes().as_ref()
        ],
        bump
    )]
    pub authorizer: Account<'info, AuthorizerAccount>,
    #[account(
        init,
        payer = user,
        token::mint = mint,
        token::authority = authorizer,
        seeds = [authorizer.key().as_ref(), b"vault".as_ref()],
        bump
    )]
    pub vault_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = user,
        token::mint = mint,
        token::authority = authorizer,
        seeds = [authorizer.key().as_ref(), b"events".as_ref()],
        bump
    )]
    pub events_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub mint: Account<'info, Mint>,
}

#[derive(Accounts)]
#[instruction(instruction: UpdateAuthorizerInstruction)]
pub struct UpdateAuthorizerAccounts<'info> {
    #[account(
        mut, 
        constraint = authorizer.authority == *user.to_account_info().key
    )]
    pub authorizer: Account<'info, AuthorizerAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>
}

