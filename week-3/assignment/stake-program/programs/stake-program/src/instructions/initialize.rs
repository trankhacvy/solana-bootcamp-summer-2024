use crate::contants::REWARD_VAULT_SEED;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>
    pub mint: Account<'info,Mint>,

    #[account(
        init_if_needed,
        payer = admin,
        seeds:[REWARD_VAULT_SEED],
        bump,
        token::mint=mint ,// verify that mint account associates with reward_vault account , Mint reference TokenAccount
        token::authority = reward_vault
    )]
    pub reward_vault: Account<'info, TokenAccount>
    pub token_program:Program<'info,Token>,
    pub system_program:Program<'info,System>
}

pub fn initialize(ctx:Context<Initialize>) -> Result<()>{
    Ok(())
}