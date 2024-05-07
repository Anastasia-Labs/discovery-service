import {
  Lucid,
  ReadableUTxO,
  Result,
  TxComplete,
} from "price-discovery-offchain";
import { setTimeout } from "timers/promises";
import { match } from "ts-pattern";
import "./env.js";

export const lovelaceAtAddress = async (lucid: Lucid, address?: string) => {
  if (address) {
    lucid.selectWalletFrom({ address: address });
  }

  return (await lucid.wallet.getUtxos()).reduce((result, current) => {
    return (result = result + current.assets["lovelace"]);
  }, 0n);
};

export async function timeoutAsync<T>(
  asyncFunction: () => Promise<T>,
  timeoutMs: number,
): Promise<Result<T>> {
  const race = await Promise.race([
    asyncFunction(),
    setTimeout(timeoutMs, new Error("timeout async")),
  ]);
  return race instanceof Error
    ? { type: "error", error: race }
    : { type: "ok", data: race };
}

export async function safeAsync<T>(
  asyncFunction: () => Promise<T>,
): Promise<Result<T>> {
  try {
    const data = await asyncFunction();
    return { type: "ok", data };
  } catch (error) {
    return {
      type: "error",
      error: error instanceof Error ? error : new Error(JSON.stringify(error)),
    };
  }
}

//the below structure allows for modular error handling and it adds type safety for async functions and timeouts async functions
export async function signSubmitValidate(
  lucid: Lucid,
  txComplete: Result<TxComplete>,
): Promise<boolean> {
  const tx = match(txComplete)
    .with({ type: "ok" }, (tx) => tx.data)
    .otherwise((error) => {
      console.log(error);
      return null;
    });
  if (!tx) return false;

  const signed = match(await safeAsync(async () => tx.sign().complete()))
    .with({ type: "ok" }, (signed) => signed.data)
    .otherwise((error) => {
      console.log(error);
      return null;
    });
  if (!signed) return false;

  const submitted = match(await safeAsync(async () => signed.submit()))
    .with({ type: "ok" }, (submmited) => submmited.data)
    .otherwise((error) => {
      console.log(error);
      return null;
    });
  if (!submitted) return false;

  const awaited = match(
    await timeoutAsync(async () => lucid.awaitTx(submitted), 120_000),
  )
    .with({ type: "ok" }, () => {
      console.log(`txSubmitted txHash: ${submitted}`);
      return true;
    })
    .otherwise((error) => {
      console.log(error);
      return false;
    });

  return awaited;
}

export const sortByKeys = (utxos: ReadableUTxO[], firstKey: string | null) => {
  const firstNode = utxos.find((readableUTxO) => {
    return readableUTxO.datum.key == firstKey;
  });
  if (!firstNode) throw new Error("firstNode error");

  const nodesOnly = utxos.filter((utxo) => {
    return utxo.datum.key != null;
  });

  return nodesOnly.reduce(
    (result, current) => {
      if (current.datum.next == null) return result;

      if (result[result.length - 1].datum.next == null) {
        return result;
      }

      const item = nodesOnly.find((readableUTxO) => {
        return readableUTxO.datum.key == result[result.length - 1].datum.next;
      });
      if (!item) throw new Error("item error");
      result.push(item);
      return result;
    },
    [firstNode] as ReadableUTxO[],
  );
};

export const sortByOrefWithIndex = (utxos: ReadableUTxO[]) => {
  const firstNode = utxos[0];

  const sortedByOutRef = utxos
    .sort((a, b) => {
      if (a.outRef.txHash < b.outRef.txHash) {
        return -1;
      } else if (a.outRef.txHash > b.outRef.txHash) {
        return 1;
      } else if (a.outRef.txHash == b.outRef.txHash) {
        if (a.outRef.outputIndex < b.outRef.outputIndex) {
          return -1;
        } else return 1;
      } else return 0;
    })
    .map((value, index) => {
      return {
        value,
        index,
      };
    });

  const firstNodeIndex = sortedByOutRef.find((node) => {
    return node.value.datum.key == firstNode.datum.key;
  });
  if (!firstNodeIndex) {
    throw new Error("error firstNodeIndex");
  }

  return sortedByOutRef.reduce(
    (result, current) => {
      if (current.value.datum.next == null) return result;
      const item = sortedByOutRef.find((node) => {
        return (
          node.value.datum.key == result[result.length - 1].value.datum.next
        );
      });
      if (!item) {
        return result;
      }
      result.push(item);
      return result;
    },
    [firstNodeIndex],
  );
};
