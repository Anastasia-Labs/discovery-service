import { OutRef } from "price-discovery-offchain";

export interface ITTConfigJSON {
  deadline: number;
  scriptType: "optimized" | "tracing" | "binds";
  blockfrost: {
    apiKey: string;
    endpoint: string;
  };
  reservedUtxos?: {
    initTasteTest?: OutRef;
    initTokenHolder?: OutRef;
  };
  project: {
    name: string;
    description: string;
    addresses: {
      liquidityDestination: string;
      withdrawPenalty: string;
      cleanupRefund: string;
      tokenHolder: string;
    };
    token: {
      readableName: string;
      decimals: number;
      suppliedAmount: number;
    };
  };
  v1PoolData: {
    policyId: string;
    address: string;
    factoryToken: string;
    policyScriptBytes: string;
    validatorScriptBytes: string;
  };
}
