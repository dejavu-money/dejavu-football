use anchor_lang::prelude::*;

use super::{
    accounts::{CreateOracleAccounts, InvalidateOracleAccounts, UpdateOracleAccounts},
    instructions::{CreateOracleInstruction, UpdateOracleInstruction},
};

pub fn create_oracle_handler(
    ctx: Context<CreateOracleAccounts>,
    instruction: CreateOracleInstruction,
) -> Result<()> {
    //set authorizer
    ctx.accounts.oracle.authorizer = ctx.accounts.authorizer.key();

    // set team ids
    ctx.accounts.oracle.teams_ids = instruction.teams_ids;

    // set timestamp metadata
    ctx.accounts.oracle.finished_at = instruction.finished_at;
    ctx.accounts.oracle.closed_at = instruction.closed_at;
    ctx.accounts.oracle.context = instruction.context;
    ctx.accounts.oracle.context_id = instruction.context_id;

    Ok(())
}

pub fn update_oracle_handler(
    ctx: Context<UpdateOracleAccounts>,
    instruction: UpdateOracleInstruction,
) -> Result<()> {
    ctx.accounts.oracle.results = instruction.results;
    ctx.accounts.oracle.is_finished = instruction.is_finished;
    Ok(())
}

pub fn invalidate_oracle_handler(
    ctx: Context<InvalidateOracleAccounts>,
    reason: String,
) -> Result<()> {
    ctx.accounts.oracle.is_finished = false;
    ctx.accounts.oracle.is_invalid = true;
    ctx.accounts.oracle_invalid_medata.reason = reason;

    Ok(())
}
