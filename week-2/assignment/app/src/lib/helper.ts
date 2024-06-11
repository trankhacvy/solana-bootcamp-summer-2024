import { Cluster, PublicKey } from "@solana/web3.js";
export const TODO_PROGRAM_ID = new PublicKey(
  "2RdU1ZSRtsFvpY19ZP4fX55iojRoUAQfQXKPbCHtzMZ2"
);

export const TODO_PROGRAM_ID_DEVNET = new PublicKey(
  "2RdU1ZSRtsFvpY19ZP4fX55iojRoUAQfQXKPbCHtzMZ2"
);

export function getProgramId(cluster: Cluster) {
  // console.log(cluster);
  
  switch (cluster) {
    case "devnet":
      return TODO_PROGRAM_ID_DEVNET
    case "testnet":
    case "mainnet-beta":
    default:
      return TODO_PROGRAM_ID;
  }
}
