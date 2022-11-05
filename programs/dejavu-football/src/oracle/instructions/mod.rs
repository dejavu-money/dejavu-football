use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateOracleInstruction {
    pub id: i64,
    pub teams_ids: [u8; 2],
    pub closed_at: i64,
    pub finished_at: i64,
    pub context: u8,
    pub context_id: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateOracleInstruction {
    pub results: [u8; 2],
    pub is_finished: bool,
}
