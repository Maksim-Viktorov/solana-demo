import {
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createTransactionMessage,
  estimateAndSetResourceLimitsFactory,
  estimateResourceLimitsFactory,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  pipe,
  setTransactionMessageComputeUnitPrice,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Address,
  type GetBlockHeightApi,
  type GetLatestBlockhashApi,
  type GetSignatureStatusesApi,
  type Lamports,
  type Rpc,
  type SendTransactionApi,
  type Signature,
  type SimulateTransactionApi,
  type TransactionSigner,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";

// Small priority fee: 10,000 micro-lamports per compute unit. A transfer uses a
// few hundred CUs, so this adds only a few lamports.
const PRIORITY_FEE_MICRO_LAMPORTS = BigInt(10_000);
// A blockhash lasts ~150 blocks (~60-90s). If fewer than this many blocks are
// left once the wallet returns, rebuild instead of sending a doomed transaction.
const MIN_BLOCKS_LEFT = BigInt(20);
// Each rebuild asks the wallet to sign again.
const MAX_SIGN_ATTEMPTS = 3;
// How often to rebroadcast and check status while waiting for confirmation.
const POLL_INTERVAL_MS = 2_000;

export type SendSolParams = {
  rpc: Rpc<
    GetBlockHeightApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi & SimulateTransactionApi
  >;
  rpcUrl: string;
  payer: TransactionSigner;
  recipient: Address;
  amount: Lamports;
  abortSignal: AbortSignal;
  onStatus?: (status: string) => void;
};

const explorerTx = (signature: Signature) =>
  `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

export async function sendSol({
  rpc,
  rpcUrl,
  payer,
  recipient,
  amount,
  abortSignal,
  onStatus = () => {},
}: SendSolParams): Promise<Signature> {
  const estimateAndSetResourceLimits = estimateAndSetResourceLimitsFactory(
    estimateResourceLimitsFactory({ rpc }),
  );
  const transfer = getTransferSolInstruction({ source: payer, destination: recipient, amount });

  for (let attempt = 1; attempt <= MAX_SIGN_ATTEMPTS; attempt++) {
    // Fetched immediately before the wallet prompt, and again on every rebuild.
    onStatus("Preparing transaction…");
    const { value: latestBlockhash } = await rpc
      .getLatestBlockhash({ commitment: "confirmed" })
      .send({ abortSignal });
    console.info(`[sendSol] attempt ${attempt}/${MAX_SIGN_ATTEMPTS}`, {
      rpcUrl,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    const message = await estimateAndSetResourceLimits(
      pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayerSigner(payer, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) => appendTransactionMessageInstructions([transfer], m),
        (m) => setTransactionMessageComputeUnitPrice(PRIORITY_FEE_MICRO_LAMPORTS, m),
      ),
      { abortSignal },
    );

    // Sign only. The wallet signer was created for chain solana:devnet, and
    // this path calls the wallet's solana:signTransaction, not signAndSend.
    onStatus(attempt === 1 ? "Approve the transaction in your wallet…" : "Blockhash expired, please approve again in your wallet…");
    const signed = await signTransactionMessageWithSigners(message, { abortSignal });
    assertIsTransactionWithBlockhashLifetime(signed);
    let { lastValidBlockHeight } = signed.lifetimeConstraint;

    // If the wallet swapped in its own blockhash, Kit cannot know its expiry
    // (it reports u64::MAX). The newest blockhash's expiry is a safe upper bound.
    if (signed.lifetimeConstraint.blockhash !== latestBlockhash.blockhash) {
      const { value: newest } = await rpc
        .getLatestBlockhash({ commitment: "confirmed" })
        .send({ abortSignal });
      console.warn("[sendSol] wallet replaced the blockhash", {
        blockhash: signed.lifetimeConstraint.blockhash,
      });
      lastValidBlockHeight = newest.lastValidBlockHeight;
    }

    const blockHeight = await rpc.getBlockHeight({ commitment: "confirmed" }).send({ abortSignal });
    if (blockHeight + MIN_BLOCKS_LEFT >= lastValidBlockHeight) {
      console.warn("[sendSol] blockhash expired while waiting for the wallet, rebuilding", {
        blockHeight,
        lastValidBlockHeight,
      });
      continue;
    }

    const signature = getSignatureFromTransaction(signed);
    console.info("[sendSol] signed", { signature, explorer: explorerTx(signature) });

    onStatus("Sending and confirming…");
    const wireTransaction = getBase64EncodedWireTransaction(signed);
    // First send runs preflight so real errors (e.g. insufficient funds) show
    // up at once. maxRetries 0: we rebroadcast ourselves until confirmed or expired.
    await rpc
      .sendTransaction(wireTransaction, {
        encoding: "base64",
        preflightCommitment: "confirmed",
        maxRetries: BigInt(0),
      })
      .send({ abortSignal });

    if (await waitForConfirmation(rpc, wireTransaction, signature, lastValidBlockHeight, abortSignal)) {
      console.info("[sendSol] confirmed", { signature, explorer: explorerTx(signature) });
      return signature;
    }
    // Past lastValidBlockHeight the transaction can never land, so a rebuild
    // cannot double-send.
    console.warn("[sendSol] blockhash expired before confirmation, rebuilding", { signature });
  }
  throw new Error(`Blockhash expired ${MAX_SIGN_ATTEMPTS} times before the transaction confirmed. Please try again.`);
}

// Rebroadcasts every POLL_INTERVAL_MS until the signature is confirmed (true)
// or the block height passes lastValidBlockHeight (false). Throws if the
// transaction landed with an error.
async function waitForConfirmation(
  rpc: SendSolParams["rpc"],
  wireTransaction: ReturnType<typeof getBase64EncodedWireTransaction>,
  signature: Signature,
  lastValidBlockHeight: bigint,
  abortSignal: AbortSignal,
): Promise<boolean> {
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    abortSignal.throwIfAborted();
    // Read the height before the status: if the status is still empty after
    // the height has passed the limit, the transaction can no longer land.
    const blockHeight = await rpc.getBlockHeight({ commitment: "confirmed" }).send({ abortSignal });
    const {
      value: [status],
    } = await rpc.getSignatureStatuses([signature]).send({ abortSignal });
    if (status?.err) {
      throw new Error(`Transaction ${signature} failed on-chain: ${JSON.stringify(status.err)}`);
    }
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      return true;
    }
    if (!status && blockHeight > lastValidBlockHeight) return false;
    await rpc
      .sendTransaction(wireTransaction, { encoding: "base64", skipPreflight: true, maxRetries: BigInt(0) })
      .send({ abortSignal })
      .catch((e) => console.debug("[sendSol] rebroadcast failed", e));
  }
}
