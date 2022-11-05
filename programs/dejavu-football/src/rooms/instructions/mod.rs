use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PlayerBetInstruction {
    pub result_team_a: u8,
    pub result_team_b: u8,
    pub player_room_index: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateRoomInstruction {
    pub id: i64,
    pub player_bet: PlayerBetInstruction,
    pub init_amount: u64,
}
