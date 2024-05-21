use anchor_lang::prelude::*;
use state::{Profile,Todo}
use error::AppError


declare_id!("Hf2EujMsJotwDcSkTxo2uvfTZtfFQcoLVTKjRvmr6jKz");

mod constant;
#[program]
pub mod assignment {
    use super::*;

    pub fn createProfile(ctx: Context<CreateProfile>,name: String) -> Result<()> {
        require!(name.len()<=100,AppError::NameTooLong);
         let key = ctx.accounts.profile.key();
         let profile = &mut ctx.accounts.profile;
         profile.key = key;
         profile.name = name;   
         profile.authority=ctx.accounts.creator.key();
         profile.todo_count = 0;
         Ok(())
    }
}



pub fn create_todo(ctx:Context<CreateTodo>,content: String) ->Result<[]>{
    if content.len()>200 {
        return err(!AppError::ContentTooLong);
    }
    let profile = &mut ctx.accounts.profile;
    let todo = &mut ctx.accounts.todo;
    todo.content = content;
    todo.profile = profile.key(); 
    todo.completed = false;
    profile.todo_count += 1;
OK(())
}


pub fn update_todo(ctx:Context<UpdateTodo>,content: String) ->Result<[]>{
    if content.len()>200 {
        return err(!AppError::ContentTooLong);
    }
    let profile = &mut ctx.accounts.profile;
    let todo = &mut ctx.accounts.todo;
    OK(())
}

pub fn delete_todo(ctx:Context<DeleteTodo>) ->Result<[]>{
    let todo = &mut ctx.accounts.todo;
    todo.delete();
    OK(())
    
}

pub fn toggle_todo(ctx:Context<ToggleTodo>) ->Result<[]>{
    let profile = &mut ctx.accounts.profile;
    let todo = &mut ctx.accounts.todo;
    if !todo.completed  {
        profile.todo_count-=1;
    }
    todo.completed = !todo.completed;
OK(())
}


#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space: 8 /* account discriminator */ + Profile::SPACE,
        seeds=[PROFILE_SEED,creator.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, Profile>

    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct CreateTodo<'info>{
    #[account(mut)]
    creator: Signer<'info>
    
    #[account(mut,constraint = profile.authority==creator.key() @ AppError::InvalidAuthority)]
    profile: Account<'info, Profile>

    #[account(
        init,payer=creator,
        space: 8 + Todo::INIT_SPACE,
        seeds=[TODO_SEED,profile.key().as_ref(),profile.todo_count.to_le_bytes().as_ref()],
        bump
    )]
    todo: Account<'info,Todo>

    pub system_program: Program<'info, System>,
}



#[derive(Accounts)
pub struct ToggleTodo<'info>{
    #[account(mut,constraint = profile.authority=creator.key() @AppError::InvalidAuthority)]
    profile : Account<'info,Profile>

    #(account(mut))
    todo: Account<'info,Todo>,

    pub system_program: Program<'info, System>,
}]

#[derive(Accounts)]
pub struct UpdateTodo<'info>{   
    #[account(mut,constraint = profile.authority=creator.key() @AppError::InvalidAuthority)]
    profile : Account<'info,Profile>

    #(account(mut))
    todo: Account<'info,Todo>,

    pub system_program: Program<'info, System>,

}



#[derive(Accounts)]
pub struct DeleteTodo<'info>{   }
#[account(mut,constraint = profile.authority=creator.key() @AppError::InvalidAuthority)]
profile : Account<'info,Profile>

#(account(mut))
todo: Account<'info,Todo>,

pub system_program: Program<'info, System>,
