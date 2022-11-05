mod authorizer;
mod oracle;
mod rooms;
mod shared;

use anchor_lang::prelude::*;

use crate::authorizer::accounts::*;
use crate::authorizer::handlers::*;
use crate::authorizer::instructions::*;
use crate::oracle::accounts::*;
use crate::oracle::handlers::*;
use crate::oracle::instructions::*;
use crate::rooms::accounts::*;
use crate::rooms::handlers::*;
use crate::rooms::instructions::*;

declare_id!("GYVyvTHnPuFuSFC2gtM2q6veYq1UuSpamCe1PsD2fZ4L");

#[program]
pub mod dejavu_football {
    use super::*;
    use crate::rooms::instructions::CreateRoomInstruction;

    /* Authorizer Instructions */
    pub fn create_authorizer(
        ctx: Context<CreateAuthorizerAccounts>,
        instruction: CreateAuthorizerInstruction,
    ) -> Result<()> {
        create_authorizer_handler(ctx, instruction)
    }
    /* Authorizer Instructions */

    /* Oracle Instructions */
    pub fn create_oracle(
        ctx: Context<CreateOracleAccounts>,
        instruction: CreateOracleInstruction,
    ) -> Result<()> {
        create_oracle_handler(ctx, instruction)
    }

    pub fn update_oracle(
        ctx: Context<UpdateOracleAccounts>,
        instruction: UpdateOracleInstruction,
    ) -> Result<()> {
        update_oracle_handler(ctx, instruction)
    }

    pub fn invalidate_oracle(ctx: Context<InvalidateOracleAccounts>, reason: String) -> Result<()> {
        invalidate_oracle_handler(ctx, reason)
    }
    /* Oracle Instructions */

    /* Room Instructions */
    pub fn create_room(
        ctx: Context<CreateRoomAccounts>,
        instruction: CreateRoomInstruction,
    ) -> Result<()> {
        create_room_handler(ctx, instruction)
    }

    pub fn join_room(
        ctx: Context<JoinRoomAccounts>,
        player_bet: PlayerBetInstruction,
    ) -> Result<()> {
        join_room_handler(ctx, player_bet)
    }

    pub fn withdraw(ctx: Context<WithdrawAccounts>) -> Result<()> {
        withdraw_handler(ctx)
    }
    /* Room Instructions */
}
