import {
  LAMPORTS_PER_SOL,
  Keypair,
  SystemProgram,
  PublicKey,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToCheckedInstruction,
} from "@solana/spl-token";
import {
  PROGRAM_ID as METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  payer,
  connection,
  explorerURL,
  printConsoleSeparator,
  buildTransaction,
  savePublicKeyToFile,
  extractSignatureFromFailedTransaction,
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
    await connection.requestAirdrop(payer.publicKey, 10000 * LAMPORTS_PER_SOL);
  }

  const mint = Keypair.generate();
  console.log("Mint address:", mint.publicKey.toBase58());
  const tokenConfig = {
    decimals: 6,
    name: "DP Solana Bootcamp Summer 2024",
    symbol: "DSE",
    uri: "https://raw.githubusercontent.com/duong-se/solana-bootcamp-summer-2024/feat/assignment-one/assets/dse-token.json",
  };

  // create instruction for the token mint account
  const createMintAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: MINT_SIZE,
    lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
    programId: TOKEN_PROGRAM_ID,
  });

    // Initialize that account as a Mint
    const initializeMintIx = createInitializeMint2Instruction(
      mint.publicKey,
      tokenConfig.decimals,
      payer.publicKey,
      payer.publicKey
    );

  const metadataAccount = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.publicKey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )[0];

  console.log("Metadata address:", metadataAccount.toBase58());

  const createMetadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint: mint.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          uri: tokenConfig.uri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        collectionDetails: null,
        isMutable: true,
      },
    }
  );

  const ata = await getAssociatedTokenAddress(
    mint.publicKey,
    payer.publicKey
  )

  console.log(`Token Account address ${ata.toBase58()} for mint account`)

  const createMintTokenAccountIx = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    ata,
    payer.publicKey,
    mint.publicKey
  )

  const mintTokenIx = createMintToCheckedInstruction(
    mint.publicKey,
    ata,
    payer.publicKey,
    100_000_000,
    6
  )

  const receiverPublickey = new PublicKey("63EEC9FfGyksm7PkVC6z8uAmqozbQcTzbkWJNsgqjkFs")
  const ataHost = await getAssociatedTokenAddress(
    mint.publicKey,
    receiverPublickey,
  )

  console.log(`Token Account address ${ataHost} for host Account`)

  const createMintTokenAccount3RDIx = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    ataHost,
    receiverPublickey,
    mint.publicKey
  )


  const mintToken3RDIx = createMintToCheckedInstruction(
    mint.publicKey,
    ataHost,
    payer.publicKey,
    10_000_000,
    6
  )

  const tx = await buildTransaction({
    connection,
    payer: payer.publicKey,
    signers: [
      payer,
      mint,
    ],
    instructions: [
      createMintAccountIx,
      initializeMintIx,
      createMetadataIx,
      createMintTokenAccountIx,
      mintTokenIx,
      createMintTokenAccount3RDIx,
      mintToken3RDIx,
    ],
  });

  printConsoleSeparator();

  try {
    const sig = await connection.sendTransaction(tx);
    console.log("Transaction completed.");
    console.log(explorerURL({ txSignature: sig }));
    savePublicKeyToFile("tokenMint", mint.publicKey);
  } catch (err) {
    console.error("Failed to send transaction:");
    console.log(tx);

    const failedSig = await extractSignatureFromFailedTransaction(
      connection,
      err
    );
    if (failedSig)
      console.log("Failed signature:", explorerURL({ txSignature: failedSig }));

    throw err;
  }
};
runAssignmentOne();
