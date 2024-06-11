use anchor_lang::prelude::*;
#[account]
pub struct Profile {
    pub name: String,

    pub key: Pubkey,

    pub authority: Pubkey,
}

impl Profile{
    const SPACE: usize = (4+100)+32+
}
#[account]
pub struct Todo {
    pub content: String,

    pub completed: bool,
}
