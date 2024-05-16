use anchor_lang::prelude::*;

declare_id!("Hf2EujMsJotwDcSkTxo2uvfTZtfFQcoLVTKjRvmr6jKz");

#[program]
pub mod assignment {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
