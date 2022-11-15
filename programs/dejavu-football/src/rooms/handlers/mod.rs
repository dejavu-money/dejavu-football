use super::{
    accounts::{CreateRoomAccounts, JoinRoomAccounts, WithdrawAccounts},
    instructions::CreateRoomInstruction,
    instructions::PlayerBetInstruction,
};
use crate::shared::Errors;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
const ROOM_HISTORY_VERSION: i16 = 0;

pub fn create_room_handler(
    ctx: Context<CreateRoomAccounts>,
    instruction: CreateRoomInstruction,
) -> Result<()> {
    // validations
    ctx.accounts.oracle.validate()?;
    ctx.accounts.room_history.created_at = Clock::get()?.unix_timestamp;
    ctx.accounts.room.oracle = ctx.accounts.oracle.key();
    ctx.accounts.room.is_finished = false;
    ctx.accounts.room.init_amount = instruction.init_amount;
    ctx.accounts.room.players_count = 1;
    ctx.accounts.room.key = instruction.id;

    ctx.accounts.players.add_bet([
        instruction.player_bet.result_team_a,
        instruction.player_bet.result_team_b,
        instruction.player_bet.player_room_index,
    ])?;
    ctx.accounts.room_history.created_by = ctx.accounts.user.key();
    ctx.accounts.room_history.token_account = ctx.accounts.player_token_account.key();
    ctx.accounts.room_history.key = instruction.player_bet.player_room_index;
    ctx.accounts.room_history.room = ctx.accounts.room.key();
    ctx.accounts.room_history.version = ROOM_HISTORY_VERSION;

    // transfer
    let cpi_accounts = Transfer {
        from: ctx.accounts.player_token_account.to_account_info(),
        to: ctx.accounts.vault_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };

    let ctx_transfer = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    token::transfer(ctx_transfer, instruction.init_amount)?;

    Ok(())
}

pub fn join_room_handler(
    ctx: Context<JoinRoomAccounts>,
    player_bet: PlayerBetInstruction,
) -> Result<()> {
    // validations
    ctx.accounts.oracle.validate()?;

    ctx.accounts.room_history.created_at = Clock::get()?.unix_timestamp;
    ctx.accounts.room_history.version = ROOM_HISTORY_VERSION;
    ctx.accounts.room_history.created_by = ctx.accounts.user.key();
    ctx.accounts.room_history.room = ctx.accounts.room.key();
    ctx.accounts.room_history.token_account = ctx.accounts.player_token_account.key();
    ctx.accounts.room_history.key = player_bet.player_room_index;
    ctx.accounts.room.players_count += 1;
    ctx.accounts.players.add_bet([
        player_bet.result_team_a,
        player_bet.result_team_b,
        player_bet.player_room_index,
    ])?;

    // transfer
    let cpi_accounts = Transfer {
        from: ctx.accounts.player_token_account.to_account_info(),
        to: ctx.accounts.vault_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };

    let ctx_transfer = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    token::transfer(ctx_transfer, ctx.accounts.room.init_amount)?;

    Ok(())
}

pub fn withdraw_handler(ctx: Context<WithdrawAccounts>) -> Result<()> {
    // TODO: validate that the oracle is finished
    // TODO: validate that playerKey belongs to this room

    match ctx
        .accounts
        .players
        .get_winner_player_key(&ctx.accounts.oracle)
    {
        Some(player_key) => {
            // validate pda
            let (player_meta_pda, _) = Pubkey::find_program_address(
                &[
                    &ctx.accounts.room.key().as_ref(),
                    format!("player-{}", player_key).as_bytes().as_ref(),
                ],
                ctx.program_id,
            );

            if ctx.accounts.room_history.key() != player_meta_pda
                || ctx.accounts.room_history.created_by != ctx.accounts.user.key()
                || ctx.accounts.room_history.token_account
                    != ctx.accounts.player_token_account.key()
                || ctx.accounts.room_history.withdrew
                || !ctx.accounts.oracle.is_finished
                || ctx.accounts.oracle.key() != ctx.accounts.room.oracle
            {
                return err!(Errors::UnauthroizedWithdraw);
            }

            let total_deposited =
                ctx.accounts.room.init_amount * ctx.accounts.players.list.len() as u64;
            let fee = total_deposited
                .checked_div(100)
                .ok_or(Errors::ValueOverFlowed)?
                .checked_mul(ctx.accounts.authorizer.fee)
                .ok_or(Errors::ValueOverFlowed)?;

            let total_award = total_deposited - fee;

            // transfer award to the plaer
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_account.to_account_info(),
                to: ctx.accounts.player_token_account.to_account_info(),
                authority: ctx.accounts.room.to_account_info(),
            };

            ctx.accounts.room_history.withdrew = true;
            ctx.accounts.room.is_finished = true;

            let room_seed = *ctx.bumps.get("room").unwrap();
            let ctx_transfer =
                CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

            token::transfer(
                ctx_transfer.with_signer(&[&&[
                    &ctx.accounts.room.oracle.as_ref(),
                    &format!("room-{}", ctx.accounts.room.key)
                        .as_bytes()
                        .as_ref()[..],
                    &[room_seed],
                ][..]]),
                total_award,
            )?;

            // transfer fee
            if fee > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.vault_account.to_account_info(),
                    to: ctx.accounts.authorizer_vault_account.to_account_info(),
                    authority: ctx.accounts.room.to_account_info(),
                };

                let room_seed = *ctx.bumps.get("room").unwrap();
                let ctx_transfer =
                    CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

                token::transfer(
                    ctx_transfer.with_signer(&[&&[
                        &ctx.accounts.room.oracle.as_ref(),
                        &format!("room-{}", ctx.accounts.room.key)
                            .as_bytes()
                            .as_ref()[..],
                        &[room_seed],
                    ][..]]),
                    fee,
                )?;
            }
        }

        None => {
            // validate pda
            let (player_meta_pda, _) = Pubkey::find_program_address(
                &[
                    &ctx.accounts.room.key().as_ref(),
                    format!("player-{}", ctx.accounts.room_history.key)
                        .as_bytes()
                        .as_ref(),
                ],
                ctx.program_id,
            );

            if ctx.accounts.room_history.key() != player_meta_pda
                || ctx.accounts.room_history.created_by != ctx.accounts.user.key()
                || ctx.accounts.room_history.token_account
                    != ctx.accounts.player_token_account.key()
                || ctx.accounts.room_history.withdrew
                || !ctx.accounts.oracle.is_finished
                || ctx.accounts.oracle.key() != ctx.accounts.room.oracle
            {
                return err!(Errors::UnauthroizedWithdraw);
            }

            ctx.accounts.room_history.withdrew = true;
            ctx.accounts.room.is_finished = true;

            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_account.to_account_info(),
                to: ctx.accounts.player_token_account.to_account_info(),
                authority: ctx.accounts.room.to_account_info(),
            };

            let room_seed = *ctx.bumps.get("room").unwrap();
            let ctx_transfer =
                CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

            token::transfer(
                ctx_transfer.with_signer(&[&&[
                    &ctx.accounts.room.oracle.as_ref(),
                    &format!("room-{}", ctx.accounts.room.key)
                        .as_bytes()
                        .as_ref()[..],
                    &[room_seed],
                ][..]]),
                ctx.accounts.room.init_amount,
            )?;
        }
    }

    Ok(())
}
