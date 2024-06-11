import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TodoApp } from "../target/types/todo_app";
import { assert, expect } from "chai";
import { withErrorTest } from "./utils";

describe("todo-app-delete", () => {
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

  it("Delete todo successfully", async () => {
    profileAccount = await program.account.profile.fetch(profile);
    const currentTodoCount = profileAccount.todoCount;

    const balanceBefore = await provider.connection.getBalance(
      provider.publicKey
    );
    console.log("balanceBefore", balanceBefore / anchor.web3.LAMPORTS_PER_SOL);

    const tx = await program.methods
      .deleteTodo()
      .accounts({
        creator: provider.publicKey,
        profile,
        todo,
      })
      .rpc();

    console.log("Delete todo status transaction signature", tx);

    withErrorTest(async () => {
      try {
        await program.account.todo.fetch(todo);
      } catch (_err) {
        assert.isTrue(_err instanceof anchor.AnchorError);
        const err: anchor.AnchorError = _err;
        assert.isTrue(err.error.errorMessage.includes("Account does not exist or has no data"), "PDA was not deleted");
        assert.strictEqual(
          err.program.toString(),
          program.programId.toString()
        );
      }
    });

    profileAccount = await program.account.profile.fetch(profile);
    expect(profileAccount.todoCount).to.equal(currentTodoCount - 1);


    const balanceAfter = await provider.connection.getBalance(
      provider.publicKey
    );
    console.log("balanceAfter", balanceAfter / anchor.web3.LAMPORTS_PER_SOL);
    // get the rent fee back
    expect(balanceAfter).to.be.gte(balanceBefore);
  });

  it("Delete todo failed by providing invalid creator", async () => {
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
          .deleteTodo()
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