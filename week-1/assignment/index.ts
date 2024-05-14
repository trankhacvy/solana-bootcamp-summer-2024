import "@solana/web3.js";
import dotenv from "dotenv";
import { connection, getPayer, STATIC_PUBLICKEY } from "./lib/vars";
import { Keypair, SystemProgram } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  bundlrStorage,
  keypairIdentity,
  Metaplex,
  PublicKey,
} from "@metaplex-foundation/js";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  buildTransaction,
  explorerURL,
  extractSignatureFromFailedTransaction,
  printConsoleSeparator,
  savePublicKeyToFile,
} from "./lib/helpers";
dotenv.config();

const createToken = async () => {
  const payer = getPayer();
  console.log("Payer address:", payer.publicKey.toBase58());

  // generate a new keypair to be used for our mint
  const mintKeypair = Keypair.generate();

  console.log("Mint address:", mintKeypair.publicKey.toBase58());

  // define the assorted token config settings
  const tokenConfig = {
    // define how many decimals we want our tokens to have
    decimals: 6,
    //
    name: "Kelvinhank",
    //
    symbol: "KVH",
    //
    uri: "https://raw.githubusercontent.com/kelvinhank/solana-bootcamp-summer-2024/main/assets/sbs-token.json",
  };

  /**
   * Build the 2 instructions required to create the token mint:
   * - standard "create account" to allocate space on chain
   * - initialize the token mint
   */

  // create instruction for the token mint account
  const createMintAccountInstruction = SystemProgram.createAccount({
    fromPubkey: getPayer().publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    // the `space` required for a token mint is accessible in the `@solana/spl-token` sdk
    space: MINT_SIZE,
    // store enough lamports needed for our `space` to be rent exempt
    lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
    // tokens are owned by the "token program"
    programId: TOKEN_PROGRAM_ID,
  });

  // Initialize that account as a Mint
  const initializeMintInstruction = createInitializeMint2Instruction(
    mintKeypair.publicKey,
    tokenConfig.decimals,
    payer.publicKey,
    payer.publicKey
  );

  // derive the pda address for the Metadata account
  const metadataAccount = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      PROGRAM_ID.toBuffer(),
      mintKeypair.publicKey.toBuffer(),
    ],
    PROGRAM_ID
  )[0];

  console.log("Metadata address:", metadataAccount.toBase58());

  // Create the Metadata account for the Mint
  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint: mintKeypair.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          creators: null,
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          uri: tokenConfig.uri,
          sellerFeeBasisPoints: 0,
          collection: null,
          uses: null,
        },
        // `collectionDetails` - for non-nft type tokens, normally set to `null` to not have a value set
        collectionDetails: null,
        // should the metadata be updatable?
        isMutable: true,
      },
    }
  );

  /**
   * Mint 100 tokens
   */

  const associatedTokenAddress = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    payer.publicKey
  );
  const ataInstruction = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    associatedTokenAddress,
    payer.publicKey,
    mintKeypair.publicKey,
    TOKEN_PROGRAM_ID
  );

  const mintToInstruction = createMintToInstruction(
    mintKeypair.publicKey,
    associatedTokenAddress,
    payer.publicKey,
    100_000_000,
    [],
    TOKEN_PROGRAM_ID
  );

  // Mint 10 tokens
  const staticAssociatedToken = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    STATIC_PUBLICKEY
  );

  const staticAtaInstruction = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    staticAssociatedToken,
    STATIC_PUBLICKEY,
    mintKeypair.publicKey
  );

  const mintToStaticInstruction = createMintToInstruction(
    mintKeypair.publicKey,
    staticAssociatedToken,
    payer.publicKey,
    10_000_000,
    [],
    TOKEN_PROGRAM_ID
  );

  /**
   * Build the transaction to send to the blockchain
   */

  const tx = await buildTransaction({
    connection,
    payer: payer.publicKey,
    signers: [payer, mintKeypair],
    instructions: [
      createMintAccountInstruction,
      initializeMintInstruction,
      createMetadataInstruction,
      ataInstruction,
      mintToInstruction,
      staticAtaInstruction,
      mintToStaticInstruction,
    ],
  });

  printConsoleSeparator();

  try {
    // actually send the transaction
    const sig = await connection.sendTransaction(tx);

    // print the explorer url
    console.log("Transaction completed.");
    console.log(explorerURL({ txSignature: sig }));

    // locally save our addresses for the demo
    savePublicKeyToFile("tokenMint", mintKeypair.publicKey);
  } catch (err) {
    console.error("Failed to send transaction:");
    console.log(tx);

    // attempt to extract the signature from the failed transaction
    const failedSig = await extractSignatureFromFailedTransaction(
      connection,
      err
    );
    if (failedSig)
      console.log("Failed signature:", explorerURL({ txSignature: failedSig }));

    throw err;
  }
};

const createNFT = async () => {
  const payer = getPayer();
  console.log("Payer address:", payer.publicKey.toBase58());
  /**
   * define our ship's JSON metadata
   */
  const metadata = {
    name: "Kelvinhank",
    symbol: "KVH",
    description: "NFT for Kelvinhank",
    image:
      "https://raw.githubusercontent.com/kelvinhank/solana-bootcamp-summer-2024/main/assets/logo.png",
  };

  /**
   * Use the Metaplex sdk to handle most NFT actions
   */

  // create an instance of Metaplex sdk for use
  const metaplex = Metaplex.make(connection)
    // set our keypair to use, and pay for the transaction
    .use(keypairIdentity(payer))
    // define a storage mechanism to upload with
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );

  console.log("Uploading metadata...");

  // upload the JSON metadata
  const { uri } = await metaplex.nfts().uploadMetadata(metadata);

  console.log("Metadata uploaded:", uri);

  printConsoleSeparator("NFT details");

  console.log("Creating NFT using Metaplex...");

  const tokenMint = Keypair.generate();

  // create a new nft using the metaplex sdk
  const { nft, response } = await metaplex.nfts().create({
    uri,
    name: metadata.name,
    symbol: metadata.symbol,
    useNewMint: tokenMint,

    // `sellerFeeBasisPoints` is the royalty that you can define on nft
    sellerFeeBasisPoints: 1000, // Represents 10.00%.

    //
    isMutable: true,
  });

  console.log(nft);

  printConsoleSeparator("NFT created:");
  console.log(explorerURL({ txSignature: response.signature }));

  printConsoleSeparator("Find by mint:");

  // you can also use the metaplex sdk to retrieve info about the NFT's mint
  const mintInfo = await metaplex.nfts().findByMint({
    mintAddress: tokenMint.publicKey,
  });
  console.log(mintInfo);
};

// MAIN RUNNING CODE

(async () => {
  await createToken();
  await createNFT();
})()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
