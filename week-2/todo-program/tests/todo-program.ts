import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TodoProgram } from '../target/types/todo_program';

describe('todo-program', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.TodoProgram as Program<TodoProgram>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
