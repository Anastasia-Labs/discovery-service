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
