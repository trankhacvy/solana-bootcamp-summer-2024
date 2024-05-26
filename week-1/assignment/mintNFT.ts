/**
 * Demonstrates how to mint NFTs and store their metadata on chain using the Metaplex MetadataProgram
 */

import { Keypair } from "@solana/web3.js";
import {
  Metaplex,
  bundlrStorage,
  keypairIdentity,
} from "@metaplex-foundation/js";

import {
  payer,
  connection,
  explorerURL,
  printConsoleSeparator,
} from "./helpers";

(async () => {
  console.log("Payer address:", payer.publicKey.toBase58());
  const metadata = {
    name: "DSE Solana Bootcamp Summer 2024",
    symbol: "DSE",
    description: "DSE Solana Bootcamp Summer 2024",
    image: "https://arweave.net/M5oKnjLYIKPS68QDQr-5gG6DzFh5fHTkGk-VAZw8H90",
    seller_fee_basis_points: 500,
    external_url: "https://www.cutedog.com/",
    attributes: [
      {
        trait_type: "Dog breed",
        value: "Baby Labrador Retriever",
      },
    ],
    collection: {
      name: "Labrador Retriever",
      family: "Cute Doggos",
    },
    properties: {
      files: [
        {
          uri: "https://arweave.net/M5oKnjLYIKPS68QDQr-5gG6DzFh5fHTkGk-VAZw8H90",
          type: "image/png",
        },
      ],
      category: "image",
      maxSupply: 0,
      creators: [
        {
          address: "22LHwfhQhtxjQ7hyKQYecbZ3zBx6PRcrsXKLDGprivpY",
          share: 100,
        },
      ],
    },
  };
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );

  console.log("Uploading metadata...");
  const { uri } = await metaplex.nfts().uploadMetadata(metadata);

  console.log("Metadata uploaded:", uri);

  printConsoleSeparator("NFT details");

  console.log("Creating NFT using Metaplex...");

  const tokenMint = Keypair.generate();

  const { nft, response } = await metaplex.nfts().create({
    uri,
    name: metadata.name,
    symbol: metadata.symbol,
    useNewMint: tokenMint,
    sellerFeeBasisPoints: 1000,
    isMutable: true,
  });

  console.log(nft);

  printConsoleSeparator("NFT created:");
  console.log(explorerURL({ txSignature: response.signature }));

  /**
   *
   */

  printConsoleSeparator("Find by mint:");

  // you can also use the metaplex sdk to retrieve info about the NFT's mint
  const mintInfo = await metaplex.nfts().findByMint({
    mintAddress: tokenMint.publicKey,
  });
  console.log(mintInfo);
})();
