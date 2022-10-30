use crate::authorizer::accounts::*;
use crate::authorizer::instructions::*;
use anchor_lang::prelude::*;

pub fn create_authorizer_handler(
    ctx: Context<CreateAuthorizerAccounts>,
    instruction: CreateAuthorizerInstruction,
) -> Result<()> {
    ctx.accounts.authorizer.authority = *ctx.accounts.user.key;
    ctx.accounts.authorizer.mint = ctx.accounts.mint.key();
    ctx.accounts.authorizer.fee = instruction.fee;
    Ok(())
}
