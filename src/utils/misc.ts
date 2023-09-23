import { Lucid, ReadableUTxO, replacer } from "price-discovery-offchain";
import { setTimeout } from "timers/promises";

export const lovelaceAtAddress = async (lucid: Lucid, address?: string) => {
  address ? lucid.selectWalletFrom({ address: address }) : null;
  return (await lucid.wallet.getUtxos()).reduce((result, current) => {
    return (result = result + current.assets["lovelace"]);
  }, 0n);
};
// <Fn extends (...arguments_: any[])
// type Func<TArgs extends any[], TResult> = (...args: TArgs) => TResult;
//
export const AsyncFunction = async function () {}.constructor;

export async function timeoutAsyncFunction<T, A>(
  asyncFn: (arg: A) => Promise<T>,
  arg: A,
  timeoutMs: number
): Promise<T | null> {
  return Promise.race([
    asyncFn(arg),
    setTimeout(timeoutMs, null),
  ]);
}

export const sortByKeys = (utxos: ReadableUTxO[], firstKey: string | null) => {
  // const head = utxos.find((utxo) => {
  //   return utxo.datum.key == null;
  // });
  // if (!head) throw new Error("head error");

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
      const item = nodesOnly.find((readableUTxO) => {
        return readableUTxO.datum.key == result[result.length - 1].datum.next;
      });
      if (!item) throw new Error("item error");
      result.push(item);
      return result;
    },
    [firstNode] as ReadableUTxO[]
  );
};

export const sortByOrefWithIndex = (utxos: ReadableUTxO[]) => {
  const firstNode = utxos[0];
  console.log(firstNode);

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
        return result
      }
      result.push(item);
      return result;
    },
    [firstNodeIndex]
  );
};
