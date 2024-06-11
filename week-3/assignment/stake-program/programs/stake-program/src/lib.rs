use anchor_lang::prelude::*;
use instructions::*;



declare_id!("Gg5p4qsRXpneeSSiLUces9sMM3F3wp5AArGR9RnSrDky");

#[program]
pub mod stake_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    pub fn stake(ctx:Context<Stake>,amount:u64) ->Result<()>{
        instructions::stake(ctx,amount)
        Ok(())
    }
    
    pub fn unstake(ctx:Context<Unstake>) ->Result<()>{
        instructions::unstake(ctx)
        Ok(())
    }
}


