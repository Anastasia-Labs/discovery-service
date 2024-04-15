export interface IWallet {
  address: string;
  seed: string;
}

export interface IAppliedScriptsJSON {
  scripts: {
    liquidityPolicy: string;
    liquidityValidator: string;
    collectStake: string;
    rewardStake: string;
    collectFoldPolicy: string;
    collectFoldValidator: string;
    rewardFoldPolicy: string;
    rewardFoldValidator: string;
    tokenHolderPolicy: string;
    tokenHolderValidator: string;
    proxyTokenHolderValidator: string;
  };
  scriptHashes: {
    liquidityPolicy: string;
    liquidityValidator: string;
    collectStake: string;
    rewardStake: string;
    collectFoldPolicy: string;
    collectFoldValidator: string;
    rewardFoldPolicy: string;
    rewardFoldValidator: string;
    tokenHolderPolicy: string;
    tokenHolderValidator: string;
    proxyTokenHolderValidator: string;
  };
  version: number;
  projectAmount: number;
  discoveryPolicy: {
    initOutRef: {
      txHash: string;
      outputIndex: number;
    };
    deadline: number;
    penaltyAddress: string;
  };
  rewardValidator: {
    projectCS: string;
    projectTN: string;
    projectAddr: string;
  };
  projectTokenHolder: {
    initOutRef: {
      txHash: string;
      outputIndex: number;
    };
  };
}

export interface IFragmentedUtxosMapJSON {
  TasteTestPolicy: {
    txHash: string;
    outputIndex: number;
  };
  TasteTestValidator: {
    txHash: string;
    outputIndex: number;
  };
  CollectFoldPolicy: {
    txHash: string;
    outputIndex: number;
  };
  CollectFoldValidator: {
    txHash: string;
    outputIndex: number;
  };
  RewardFoldPolicy: {
    txHash: string;
    outputIndex: number;
  };
  RewardFoldValidator: {
    txHash: string;
    outputIndex: number;
  };
  TokenHolderPolicy: {
    txHash: string;
    outputIndex: number;
  };
  TokenHolderValidator: {
    txHash: string;
    outputIndex: number;
  };
  TasteTestStakeValidator: {
    txHash: string;
    outputIndex: number;
  };
  RewardStake: {
    txHash: string;
    outputIndex: number;
  };
}

export interface IPublishedPolicyJSON {
  policy: string;
  scriptsRef: {
    TasteTestPolicy: {
      txHash: string;
      outputIndex: number;
    };
    TasteTestValidator: {
      txHash: string;
      outputIndex: number;
    };
    CollectFoldPolicy: {
      txHash: string;
      outputIndex: number;
    };
    CollectFoldValidator: {
      txHash: string;
      outputIndex: number;
    };
    RewardFoldPolicy: {
      txHash: string;
      outputIndex: number;
    };
    RewardFoldValidator: {
      txHash: string;
      outputIndex: number;
    };
    TokenHolderPolicy: {
      txHash: string;
      outputIndex: number;
    };
    TokenHolderValidator: {
      txHash: string;
      outputIndex: number;
    };
    TasteTestStakeValidator: {
      txHash: string;
      outputIndex: number;
    };
    RewardStake: {
      txHash: string;
      outputIndex: number;
    };
  };
}

import { OutRef } from "price-discovery-offchain";

export interface ITTConfigJSON {
  deadline: number;
  scriptType: "optimized" | "tracing" | "binds";
  reservedUtxos?: {
    initTasteTest?: OutRef[];
    initTokenHolder?: OutRef[];
  };
  project: {
    name: string;
    description: string;
    addresses: {
      liquidityDestination: string;
      withdrawPenalty: string;
      cleanupRefund: string;
      tokenHolder: string;
      publishScripts: string;
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

export interface ITasteTestVariablesJSON {
  projectTokenPolicyId: string;
  projectTokenAssetName: string;
  lpTokenAssetName: string;
}
