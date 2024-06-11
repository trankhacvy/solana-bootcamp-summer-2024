use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod todo_program {
    use super::*;
    pub fn create_profile(ctx: Context<CreateProfile>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(mut)]
    pub creator: Signer<'info>
    ,
    #[account(
        init,
        payer=creator,
        space=8 + Profile::SPACE
    )]
    pub profile: Account<'info,Profile>,
    program
}
