import {
  LAMPORTS_PER_SOL,
  Keypair,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  payer,
  connection,
  explorerURL,
  printConsoleSeparator,
} from "./helpers";

const runAssignmentOne = async () => {
  console.log("Payer address:", payer.publicKey.toBase58());
  const currentBalance = await connection.getBalance(payer.publicKey);
  console.log("Current balance of 'payer' (in lamports):", currentBalance);
  console.log(
    "Current balance of 'payer' (in SOL):",
    currentBalance / LAMPORTS_PER_SOL
  );
  if (currentBalance <= LAMPORTS_PER_SOL) {
    console.log("Low balance, requesting an airdrop...");
    await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
  }

  const newAccountKeypair = Keypair.generate();
  const newAccountSpace = 0;
  const newAccountLamports = await connection.getMinimumBalanceForRentExemption(
    newAccountSpace
  );
  console.log("Total lamports:", newAccountLamports);
  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: newAccountKeypair.publicKey,
    lamports: newAccountLamports,
    space: newAccountSpace,
    programId: SystemProgram.programId,
  });
  const recentBlockhash = await connection
    .getLatestBlockhash()
    .then((res) => res.blockhash);
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash,
    instructions: [createAccountInstruction],
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  tx.sign([payer, newAccountKeypair]);
  console.log("tx after signing:", tx);
  const signature = await connection.sendTransaction(tx);
  printConsoleSeparator();
  console.log("Transaction completed.");
  console.log(explorerURL({ txSignature: signature }));
};
runAssignmentOne();
