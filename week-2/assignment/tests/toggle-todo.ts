import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TodoApp } from "../target/types/todo_app";
import { assert, expect } from "chai";
import { withErrorTest } from "./utils";

describe("todo-app-toggle", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TodoApp as Program<TodoApp>;
  const name = "Kelvin hank";

  const content = "Do Solana bootcamp homework";

  let profile: anchor.web3.PublicKey,
    profileAccount: Awaited<ReturnType<typeof program.account.profile.fetch>>,
    todo: anchor.web3.PublicKey;

  before(async () => {
    // create profile
    [profile] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), provider.publicKey.toBytes()],
      program.programId
    );

    const createProfileTx = await program.methods
      .createProfile(name)
      .accounts({
        creator: provider.publicKey,
        profile,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create profile success", createProfileTx);

    profileAccount = await program.account.profile.fetch(profile);
    const currentTodoCount = profileAccount.todoCount;
    
    // create todo
    [todo] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("todo"), profile.toBytes(), Buffer.from([currentTodoCount])],
      program.programId
    );

    const createTodoTx = await program.methods
      .createTodo(content)
      .accounts({
        creator: provider.publicKey,
        profile,
        todo,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Your transaction signature", createTodoTx);
  });

  it("Toggle todo status successfully", async () => {
    const tx = await program.methods
      .toggleTodo()
      .accounts({
        creator: provider.publicKey,
        profile,
        todo,
      })
      .rpc();

    console.log("Toggle todo status transaction signature", tx);
    const todoAccount = await program.account.todo.fetch(todo);      
    expect(todoAccount.completed).to.equal(true);

    profileAccount = await program.account.profile.fetch(profile);
  });

  it("Toggle todo failed by providing invalid creator", async () => {
    const anotherPayer = anchor.web3.Keypair.generate();

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        anotherPayer.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      )
    );

    console.log("anotherPayer", anotherPayer.publicKey.toBase58());

    withErrorTest(async () => {
      try {
        const tx = await program.methods
          .toggleTodo()
          .accounts({
            creator: anotherPayer.publicKey,
            profile,
            todo,
          })
          .signers([anotherPayer])
          .rpc();

        console.log("Toggle todo transaction signature", tx);

        assert.ok(false);
      } catch (_err) {
        // console.log(_err);
        assert.isTrue(_err instanceof anchor.AnchorError);
        const err: anchor.AnchorError = _err;
        assert.strictEqual(err.error.errorMessage, "Invalid profile");
        assert.strictEqual(err.error.errorCode.number, 6003);
        assert.strictEqual(err.error.errorCode.code, "InvalidProfile");
        assert.strictEqual(
          err.program.toString(),
          program.programId.toString()
        );
      }
    });
  });
});