use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateAuthorizerInstruction {
    pub id: i64,
    pub fee: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateAuthorizerInstruction {
    pub fee: u64
}
