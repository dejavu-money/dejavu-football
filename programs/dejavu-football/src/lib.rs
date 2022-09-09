use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod dejavu_football {
    use super::*;

    pub fn create_authorizer(ctx: Context<AuthInstruction>, _auth_id: i64) -> Result<()> {
        ctx.accounts.authorizer.authority = *ctx.accounts.user.key;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {
}

#[account]
pub struct AuthorizerAccount {
    authority: Pubkey // 32
}

#[derive(Accounts)]
#[instruction(auth_id: i64)]
pub struct AuthInstruction<'info> {
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


