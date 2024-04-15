import { Assets, OutputData } from "price-discovery-offchain";

export interface EmulatorAccount {
  address: string;
  assets: Assets;
  txHash?: string;
  txIndex?: string;
  outputData?: OutputData | undefined;
}
