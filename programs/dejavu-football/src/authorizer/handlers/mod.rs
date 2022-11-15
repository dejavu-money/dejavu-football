use crate::authorizer::accounts::*;
use crate::authorizer::instructions::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

pub fn create_authorizer_handler(
    ctx: Context<CreateAuthorizerAccounts>,
    instruction: CreateAuthorizerInstruction,
) -> Result<()> {
    ctx.accounts.authorizer.authority = *ctx.accounts.user.key;
    ctx.accounts.authorizer.mint = ctx.accounts.mint.key();
    ctx.accounts.authorizer.fee = instruction.fee;
    ctx.accounts.authorizer.id = instruction.id;
    Ok(())
}

pub fn update_authorizer_handler(
    ctx: Context<UpdateAuthorizerAccounts>,
    instruction: UpdateAuthorizerInstruction,
) -> Result<()> {
    ctx.accounts.authorizer.fee = instruction.fee;
    Ok(())
}

pub fn withdraw_from_authorizer_handler(
    ctx: Context<WithdrawFromAuthorizerAccounts>,
    instruction: WithdrawFromAuthorizerInstruction,
) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.authorizer_token_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.authorizer.to_account_info(),
    };

    let ctx_transfer = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    let authorizer_seed = *ctx.bumps.get("authorizer").unwrap();

    token::transfer(
        ctx_transfer.with_signer(&[&&[
            "authorizer".as_bytes().as_ref(),
            &format!("{}", ctx.accounts.authorizer.id)
                .as_bytes()
                .as_ref(),
            &[authorizer_seed],
        ][..]]),
        instruction.amount,
    )?;

    Ok(())
}
