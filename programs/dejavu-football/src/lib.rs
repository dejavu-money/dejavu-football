use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod dejavu_football {
    use super::*;

    pub fn create_authorizer(
        ctx: Context<CreateAuthorizerInstruction>,
        _auth_id: i64,
    ) -> Result<()> {
        ctx.accounts.authorizer.authority = *ctx.accounts.user.key;
        Ok(())
    }

    pub fn update_oracle(
        ctx: Context<UpdateOracleInstruction>,
        team_a_value: u8,
        team_b_value: u8,
    ) -> Result<()> {
        // set team ids
        ctx.accounts.oracle.results[0] = team_a_value;
        ctx.accounts.oracle.results[1] = team_b_value;
        Ok(())
    }

    pub fn invalidate_oracle(
        ctx: Context<InvalidateOracleInstruction>,
        reason: String,
    ) -> Result<()> {
        ctx.accounts.oracle.is_invalid = true;
        ctx.accounts.oracle_invalid_medata.reason = reason;
        Ok(())
    }

    pub fn create_oracle(
        ctx: Context<CreateOracleInstruction>,
        _auth_id: i64,
        team_a_id: u8,
        team_b_id: u8,
        closed_at: i64,
        finished_at: i64,
    ) -> Result<()> {
        ctx.accounts.oracle.authorizer = ctx.accounts.authorizer.key();

        // set team ids
        ctx.accounts.oracle.team_ids[0] = team_a_id;
        ctx.accounts.oracle.team_ids[1] = team_b_id;
        // set timestamp medatadata
        ctx.accounts.oracle.closed_at = closed_at;
        ctx.accounts.oracle.finished_at = finished_at;

        Ok(())
    }

    pub fn create_room(
        ctx: Context<CreateRoomInstruction>,
        _timestamp: i64,
        player_bet: [u8; 3],
        init_amount: u64,
    ) -> Result<()> {
        // TODO: validate closed_at and finished_at on oracles

        ctx.accounts.room.oracle = ctx.accounts.oracle.key();
        ctx.accounts.room.is_finished = false;
        ctx.accounts.room.created_by = ctx.accounts.user.key();
        ctx.accounts.room.mint_account = ctx.accounts.mint.key();
        ctx.accounts.room.init_amount = init_amount;

        ctx.accounts.players.add_bet(player_bet)?;
        ctx.accounts.player_metadata.created_by = ctx.accounts.user.key();

        // transfer
        let cpi_accounts = Transfer {
            from: ctx.accounts.player_token_account.to_account_info(),
            to: ctx.accounts.vault_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };

        let ctx_transfer =
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

        token::transfer(ctx_transfer, init_amount)?;
        // ctx.accounts.player_token_account.reload()?;
        // msg!("Player account amount: {}", ctx.accounts.player_token_account.amount);

        Ok(())
    }

    pub fn join_room(ctx: Context<JoinRoomInstruction>, player_bet: [u8; 3]) -> Result<()> {
        // TODO: validate closed_at and finished_at on oracles

        ctx.accounts.player_metadata.created_by = ctx.accounts.user.key();
        ctx.accounts.players.add_bet(player_bet)?;

        Ok(())
    }
}

// Room Account and Instructions

#[account]
pub struct Room {
    oracle: Pubkey,       // 32
    created_by: Pubkey,   // 32
    mint_account: Pubkey, // 32,
    is_finished: bool,    // 1
    init_amount: u64,     // 8
}

#[account]
pub struct RoomPlayerMetadata {
    created_by: Pubkey, // 32
}

#[account]
pub struct RoomPlayers {
    list: Vec<[u8; 3]>, // (4 + 3) * player_counts -> [team_a_result, team_b_result, player_key]
}

impl RoomPlayers {
    pub fn calculate_new_space(&self) -> usize {
        let current_space = 8 * self.list.len();
        current_space + 8 + 8
    }

    pub fn add_bet(&mut self, bet: [u8; 3]) -> Result<()> {
        self.validate_bet(&bet)?;
        self.list.push(bet);

        Ok(())
    }

    fn validate_bet(&self, new_bet: &[u8; 3]) -> Result<()> {
        for bet in self.list.iter() {
            let [current_team_a_value, current_team_b_value, _] = bet;
            let [new_team_a_value, new_team_b_value, _] = new_bet;

            if current_team_a_value == new_team_a_value && current_team_b_value == new_team_b_value
            {
                return err!(Errors::BetDuplicated);
            }
        }

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(timestamp: i64, player_bet: [u8; 3])]
pub struct CreateRoomInstruction<'info> {
    oracle: Account<'info, Oracle>,
    mint: Account<'info, Mint>,
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 32 + 1 + 8,
        seeds = [user.key().as_ref(), format!("room-{}", timestamp).as_bytes().as_ref()], 
        bump
    )]
    room: Account<'info, Room>,
    #[account(
        init,
        payer = user,
        space = 8 + 32,
        seeds = [room.key().as_ref(), format!("player-{}", player_bet[2]).as_bytes().as_ref()], 
        bump
    )]
    player_metadata: Account<'info, RoomPlayerMetadata>,
    #[account(
        init,
        payer = user,
        space = 8 + 8,
        seeds = [room.key().as_ref(), b"players"], 
        bump
    )]
    players: Account<'info, RoomPlayers>,
    #[account(
        init,
        payer = user,
        token::mint = mint,
        token::authority = room,
        seeds = [room.key().as_ref(), b"vault".as_ref()],
        bump
    )]
    vault_account: Account<'info, TokenAccount>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
    #[account(mut)]
    player_token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
#[instruction(player_bet: [u8; 3])]
pub struct JoinRoomInstruction<'info> {
    oracle: Account<'info, Oracle>,
    mint: Account<'info, Mint>,
    room: Account<'info, Room>,
    #[account(
        init,
        payer = user,
        space = 8 + 32,
        seeds = [room.key().as_ref(), format!("player-{}", player_bet[2]).as_bytes().as_ref()], 
        bump
    )]
    player_metadata: Account<'info, RoomPlayerMetadata>,
    #[account(
        mut,
        seeds = [room.key().as_ref(), b"players"], 
        bump,
        realloc = players.calculate_new_space(),
        realloc::payer = user,
        realloc::zero = false,
    )]
    players: Account<'info, RoomPlayers>,
    vault_account: Account<'info, TokenAccount>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
    #[account(mut)]
    player_token_account: Account<'info, TokenAccount>,
}

// Oracle Account and Instructions
#[account]
pub struct AuthorizerAccount {
    authority: Pubkey, // 32
}

#[account]
pub struct Oracle {
    authorizer: Pubkey, // 32
    team_ids: [u8; 2],  // 2
    results: [u8; 2],   // 2
    closed_at: i64,     // 8
    finished_at: i64,   // 8
    is_finished: bool,  // 1
    is_invalid: bool,   // 1
}

#[account]
pub struct OracleInvalidMetadata {
    reason: String,
}

#[derive(Accounts)]
#[instruction(oracle_id: i64)]
pub struct CreateOracleInstruction<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 2 + 2 + 8 + 8 + 1 + 1,
        seeds = [authorizer.key().as_ref(), format!("id-{}", oracle_id).as_bytes().as_ref()], 
        bump,
        constraint = authorizer.authority == *user.key,
    )]
    oracle: Account<'info, Oracle>,
    authorizer: Account<'info, AuthorizerAccount>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateOracleInstruction<'info> {
    #[account(
        mut,
        constraint = oracle.authorizer == *authorizer.to_account_info().key,
        constraint = authorizer.authority == *user.to_account_info().key,
        constraint = oracle.is_invalid == false,
        constraint = oracle.is_finished == false
    )]
    oracle: Account<'info, Oracle>,
    authorizer: Account<'info, AuthorizerAccount>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(reason: String)]
pub struct InvalidateOracleInstruction<'info> {
    #[account(
        mut,
        constraint = oracle.authorizer == *authorizer.to_account_info().key,
        constraint = authorizer.authority == *user.to_account_info().key,
        constraint = oracle.is_invalid == false,
        constraint = oracle.is_finished == false
    )]
    oracle: Account<'info, Oracle>,
    #[account(
        init,
        payer = user,
        space = 8 + 4 + reason.len(),
        seeds = [oracle.key().as_ref(), b"invalid"], 
        bump,
        constraint = authorizer.authority == *user.key,
    )]
    oracle_invalid_medata: Account<'info, OracleInvalidMetadata>,
    authorizer: Account<'info, AuthorizerAccount>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auth_id: i64)]
pub struct CreateAuthorizerInstruction<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32,
        seeds = [user.key().as_ref(), format!("id-{}", auth_id).as_bytes().as_ref()], 
        bump
    )]
    authorizer: Account<'info, AuthorizerAccount>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

// errors
#[error_code]
pub enum Errors {
    #[msg("The current timestamp should be greater than closed_at")]
    TimeInvalid,
    #[msg("Oracle expired")]
    OracleExpired,
    #[msg("Another player has the same bet")]
    BetDuplicated,
}
