import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import {
  Connection,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
dotenv.config();
const DEFAULT_KEY_DIR_NAME = ".local_keys";
export const CLUSTER_URL = process.env.RPC_URL ?? clusterApiUrl("devnet");

export const payer = process.env?.LOCAL_PAYER_JSON_ABSPATH
  ? loadKeypairFromMachine(process.env?.LOCAL_PAYER_JSON_ABSPATH)
  : loadOrGenerateKeypair("payer");

export const testWallet = loadOrGenerateKeypair("testWallet");

export function loadKeypairFromMachine(absPath: string): Keypair {
  try {
    if (!absPath) throw Error("No path provided");
    if (!fs.existsSync(absPath)) throw Error("File does not exist.");
    const keyfileBytes = JSON.parse(fs.readFileSync(absPath, { encoding: "utf-8" }));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keyfileBytes));
    return keypair;
  } catch (err) {
    throw err;
  }
}


export function loadOrGenerateKeypair(fileName: string, dirName: string = DEFAULT_KEY_DIR_NAME) {
  try {
    // compute the path to locate the file
    const searchPath = path.join(dirName, `${fileName}.json`);
    let keypair = Keypair.generate();

    // attempt to load the keypair from the file
    if (fs.existsSync(searchPath)) keypair = loadKeypairFromMachine(searchPath);
    // when unable to locate the keypair, save the new one
    else saveKeypairToFile(keypair, fileName, dirName);

    return keypair;
  } catch (err) {
    console.error("loadOrGenerateKeypair:", err);
    throw err;
  }
}

export function saveKeypairToFile(
  keypair: Keypair,
  fileName: string,
  dirName: string = DEFAULT_KEY_DIR_NAME,
) {
  fileName = path.join(dirName, `${fileName}.json`);
  if (!fs.existsSync(`./${dirName}/`)) fs.mkdirSync(`./${dirName}/`);
  if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
  fs.writeFileSync(fileName, `[${keypair.secretKey.toString()}]`, {
    encoding: "utf-8",
  });
  return fileName;
}


export const connection = new Connection(CLUSTER_URL, "confirmed");


export function explorerURL({
  address,
  txSignature,
  cluster,
}: {
  address?: string;
  txSignature?: string;
  cluster?: "devnet" | "testnet" | "mainnet" | "mainnet-beta";
}) {
  let baseUrl: string;
  if (address) baseUrl = `https://explorer.solana.com/address/${address}`;
  else if (txSignature) baseUrl = `https://explorer.solana.com/tx/${txSignature}`;
  else return "[unknown]";
  const url = new URL(baseUrl);
  url.searchParams.append("cluster", cluster || "devnet");
  return url.toString() + "\n";
}


export function printConsoleSeparator(message?: string) {
  console.log("\n===============================================");
  console.log("===============================================\n");
  if (message) console.log(message);
}

export async function buildTransaction({
  connection,
  payer,
  signers,
  instructions,
}: {
  connection: Connection;
  payer: PublicKey;
  signers: Keypair[];
  instructions: TransactionInstruction[];
}): Promise<VersionedTransaction> {
  let blockhash = await connection.getLatestBlockhash().then(res => res.blockhash);

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);

  signers.forEach(s => tx.sign([s]));

  return tx;
}

const DEFAULT_PUBLIC_KEY_FILE = "keys.json";

export function loadPublicKeysFromFile(
  absPath: string = `${DEFAULT_KEY_DIR_NAME}/${DEFAULT_PUBLIC_KEY_FILE}`,
) {
  try {
    if (!absPath) throw Error("No path provided");
    if (!fs.existsSync(absPath)) throw Error("File does not exist.");

    const data = JSON.parse(fs.readFileSync(absPath, { encoding: "utf-8" })) || {};
    for (const [key, value] of Object.entries(data)) {
      data[key] = new PublicKey(value as string) ?? "";
    }

    return data;
  } catch (err) {
    console.warn("Unable to load local file");
  }
  return {};
}


export function savePublicKeyToFile(
  name: string,
  publicKey: PublicKey,
  absPath: string = `${DEFAULT_KEY_DIR_NAME}/${DEFAULT_PUBLIC_KEY_FILE}`,
) {
  try {
    let data: any = loadPublicKeysFromFile(absPath);
    for (const [key, value] of Object.entries(data)) {
      data[key as any] = (value as PublicKey).toBase58();
    }
    data = { ...data, [name]: publicKey.toBase58() };
    fs.writeFileSync(absPath, JSON.stringify(data), {
      encoding: "utf-8",
    });
    data = loadPublicKeysFromFile(absPath);

    return data;
  } catch (err) {
    console.warn("Unable to save to file");
  }
  return {};
}

/*
  Helper function to extract a transaction signature from a failed transaction's error message
*/
export async function extractSignatureFromFailedTransaction(
  connection: Connection,
  err: any,
  fetchLogs?: boolean,
) {
  if (err?.signature) return err.signature;

  const failedSig = new RegExp(/^((.*)?Error: )?(Transaction|Signature) ([A-Z0-9]{32,}) /gim).exec(
    err?.message?.toString(),
  )?.[4];

  if (failedSig) {
    if (fetchLogs)
      await connection
        .getTransaction(failedSig, {
          maxSupportedTransactionVersion: 0,
        })
        .then(tx => {
          console.log(`\n==== Transaction logs for ${failedSig} ====`);
          console.log(explorerURL({ txSignature: failedSig }), "");
          console.log(tx?.meta?.logMessages ?? "No log messages provided by RPC");
          console.log(`==== END LOGS ====\n`);
        });
    else {
      console.log("\n========================================");
      console.log(explorerURL({ txSignature: failedSig }));
      console.log("========================================\n");
    }
  }

  return failedSig;
}
