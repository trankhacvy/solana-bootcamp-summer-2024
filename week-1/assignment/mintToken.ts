/**
 * Demonstrates how to create new SPL tokens (aka "minting tokens") into an existing SPL Token Mint
 */

import { PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createAccount,
} from "@solana/spl-token";

import {
  payer,
  connection,
  loadPublicKeysFromFile,
  explorerURL,
} from "./helpers";

const mintToken = async () => {
  console.log("Payer address:", payer.publicKey.toBase58());

  const localKeys = loadPublicKeysFromFile();

  // ensure the desired script was already run
  if (!localKeys?.tokenMint)
    return console.warn(
      "No local keys were found. Please run '3.createTokenWithMetadata.ts'"
    );

  const tokenMint: PublicKey = localKeys.tokenMint;

  console.log("==== Local PublicKeys loaded ====");
  console.log("Token's mint address:", tokenMint.toBase58());
  console.log(explorerURL({ address: tokenMint.toBase58() }));


  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    payer.publicKey,
  ).then(ata => ata.address);

  console.log("Token account address:", tokenAccount.toBase58());

  const amountOfTokensToMint = 100_000_000;

  console.log("Minting some tokens to the ata...", tokenAccount);
  const mintSig = await mintTo(
    connection,
    payer,
    tokenMint,
    tokenAccount,
    payer,
    amountOfTokensToMint,
  );

  console.log(explorerURL({ txSignature: mintSig }));

  const tokenMintOne = new PublicKey(
    "63EEC9FfGyksm7PkVC6z8uAmqozbQcTzbkWJNsgqjkFs"
  );
  const tokenAccountOne = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMintOne,
    payer.publicKey,
  ).then(ata => ata.address);

  console.log("Token account one address:", tokenAccountOne.toBase58());

  const amountOfTokensToMintOne = 10_000_000;
  console.log("Minting some tokens to the ata...", tokenAccountOne);
  const mintSigOne = await mintTo(
    connection,
    payer,
    tokenMintOne,
    tokenAccountOne,
    payer,
    amountOfTokensToMintOne
  );


  console.log(explorerURL({ txSignature: mintSigOne }));
};

mintToken();
