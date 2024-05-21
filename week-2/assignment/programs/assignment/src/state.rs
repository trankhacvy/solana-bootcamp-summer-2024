use anchor_lang:prelude::*;

#[account]
pub struct Profile{
    pub key: Pubkey,
    pub name: String,
    pub authority: Pubkey,
    pub todo_count:u8
}

impl Profile{
    pub const SPACE: usize =32 + // Pubkey 
                            (4+100) // String 100
                            + 32 // Pubkey
                            +1 // u8
}

#[account]
#[derive(InitSpace)]
pub struct Todo{
    pub profile: Pubkey,
    #[max_len(200)]
    pub content: String,
    pub completed: bool
}