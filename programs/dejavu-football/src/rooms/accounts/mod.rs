use crate::shared::Errors;
use crate::AuthorizerAccount;
use crate::CreateRoomInstruction;
use crate::PlayerBetInstruction;

use crate::Oracle;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[account]
pub struct Room {
    pub oracle: Pubkey,    // 32
    pub key: i64,          // 8
    pub is_finished: bool, // 1
    pub init_amount: u64,  // 8
    pub players_count: u8, // 1
}

#[account]
pub struct RoomsHistory {
    pub room: Pubkey,          // 32
    pub created_by: Pubkey,    // 32
    pub token_account: Pubkey, // 32
    pub key: u8,               // 1
    pub withdrew: bool,        // 1
    pub version: i16,          // 2
    pub created_at: i64,       // 8
}

#[account]
pub struct RoomPlayers {
    pub list: Vec<[u8; 3]>, // (4 + 3) * player_counts -> [team_a_result, team_b_result, player_key]
}

#[derive(Accounts)]
#[instruction(instruction: CreateRoomInstruction)]
pub struct CreateRoomAccounts<'info> {
    pub oracle: Account<'info, Oracle>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 8 + 1 + 8 + 1,
        seeds = [oracle.key().as_ref(), format!("room-{}", instruction.id).as_bytes().as_ref()], 
        bump,
        constraint = mint.key() == authorizer.mint,
        constraint = oracle.authorizer.key() == authorizer.key()
    )]
    pub room: Account<'info, Room>,
    #[account(
        init,
        payer = payer,
        space = 8 + 32+ 32 + 32 + 1 + 1 + 2 + 8,
        seeds = [room.key().as_ref(), format!("player-{}", instruction.player_bet.player_room_index).as_bytes().as_ref()], 
        bump
    )]
    pub room_history: Account<'info, RoomsHistory>,
    #[account(
        init,
        payer = payer,
        space = 8 + 8,
        seeds = [room.key().as_ref(), b"players"], 
        bump
    )]
    pub players: Account<'info, RoomPlayers>,
    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = room,
        seeds = [room.key().as_ref(), b"vault".as_ref()],
        bump
    )]
    pub vault_account: Account<'info, TokenAccount>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    #[account(mut)]
    pub player_token_account: Box<Account<'info, TokenAccount>>,
    pub authorizer: Box<Account<'info, AuthorizerAccount>>,
    #[account(mut)]
    pub payer_token_account: Box<Account<'info, TokenAccount>>,
}

#[derive(Accounts)]
#[instruction(instruction: PlayerBetInstruction)]
pub struct JoinRoomAccounts<'info> {
    pub authorizer: Box<Account<'info, AuthorizerAccount>>,
    pub oracle: Account<'info, Oracle>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub room: Account<'info, Room>,
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 32 + 1 + 1 + 2 + 8,
        seeds = [room.key().as_ref(), format!("player-{}", instruction.player_room_index).as_bytes().as_ref()], 
        bump,
        constraint = mint.key() == authorizer.mint,
        constraint = oracle.authorizer.key() == authorizer.key()
    )]
    pub room_history: Account<'info, RoomsHistory>,
    #[account(
        mut,
        seeds = [room.key().as_ref(), b"players"], 
        bump,
        realloc = players.calculate_new_space(),
        realloc::payer = payer,
        realloc::zero = false,
    )]
    pub players: Account<'info, RoomPlayers>,
    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    #[account(mut)]
    pub player_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub payer_token_account: Box<Account<'info, TokenAccount>>,
}

#[derive(Accounts)]
pub struct WithdrawAccounts<'info> {
    pub oracle: Account<'info, Oracle>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [room.oracle.as_ref(), format!("room-{}", room.key).as_bytes().as_ref()], bump)]
    pub room: Account<'info, Room>,
    #[account(mut,
        seeds = [
            room.key().as_ref(),
            format!("player-{}", room_history.key).as_bytes().as_ref()
        ],
        bump
    )]
    pub room_history: Account<'info, RoomsHistory>,
    #[account(seeds = [room.key().as_ref(), b"players"], bump)]
    pub players: Account<'info, RoomPlayers>,
    #[account(mut, seeds = [room.key().as_ref(), b"vault".as_ref()], bump)]
    pub vault_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    #[account(
        mut,
        constraint = room_history.room.key() == room.key() && room_history.created_by == user.key(),
        constraint = oracle.is_finished == true && room_history.withdrew == false,
        constraint = room_history.created_by == user.key() && room_history.token_account == player_token_account.key(),
        constraint = room.oracle == oracle.key()
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    pub authorizer: Box<Account<'info, AuthorizerAccount>>,
    #[account(mut, seeds = [authorizer.key().as_ref(), b"vault".as_ref()], bump)]
    pub authorizer_vault_account: Box<Account<'info, TokenAccount>>,
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

    pub fn get_winner_player_key(&self, oracle: &Account<Oracle>) -> Option<u8> {
        let players_results = self.list.iter();

        for result in players_results {
            let [a, b] = oracle.results;

            if a == result[0] && b == result[1] {
                return Some(result[2]);
            }
        }

        None
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
