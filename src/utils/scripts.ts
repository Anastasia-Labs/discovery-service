import dotenv from "dotenv";
dotenv.config();

// Optimized
import distributionFoldValidator from "../compiledLiquidity/distributionFoldValidator.json" assert { type: "json" };
import distributionFoldPolicy from "../compiledLiquidity/distributionRewardFoldMint.json" assert { type: "json" };
import collectionFoldPolicy from "../compiledLiquidity/liquidityFoldMint.json" assert { type: "json" };
import collectionFoldValidator from "../compiledLiquidity/liquidityFoldValidator.json" assert { type: "json" };
import liquidityPolicy from "../compiledLiquidity/liquidityMinting.json" assert { type: "json" };
import liquidityStake from "../compiledLiquidity/liquidityStakeValidator.json" assert { type: "json" };
import tokenHolderPolicy from "../compiledLiquidity/liquidityTokenHolderMint.json" assert { type: "json" };
import tokenHolderValidator from "../compiledLiquidity/liquidityTokenHolderValidator.json" assert { type: "json" };
import liquidityValidator from "../compiledLiquidity/liquidityValidator.json" assert { type: "json" };
import proxyTokenHolderValidator from "../compiledLiquidity/proxyTokenHolderV1.json" assert { type: "json" };

// Binds
import distributionFoldValidatorWithBinds from "../compiledLiquidityBinds/distributionFoldValidator.json" assert { type: "json" };
import distributionFoldPolicyWithBinds from "../compiledLiquidityBinds/distributionRewardFoldMint.json" assert { type: "json" };
import collectionFoldPolicyWithBinds from "../compiledLiquidityBinds/liquidityFoldMint.json" assert { type: "json" };
import collectionFoldValidatorWithBinds from "../compiledLiquidityBinds/liquidityFoldValidator.json" assert { type: "json" };
import liquidityPolicyWithBinds from "../compiledLiquidityBinds/liquidityMinting.json" assert { type: "json" };
import liquidityStakeWithBinds from "../compiledLiquidityBinds/liquidityStakeValidator.json" assert { type: "json" };
import tokenHolderPolicyWithBinds from "../compiledLiquidityBinds/liquidityTokenHolderMint.json" assert { type: "json" };
import tokenHolderValidatorWithBinds from "../compiledLiquidityBinds/liquidityTokenHolderValidator.json" assert { type: "json" };
import liquidityValidatorWithBinds from "../compiledLiquidityBinds/liquidityValidator.json" assert { type: "json" };
import proxyTokenHolderValidatorWithBinds from "../compiledLiquidityBinds/proxyTokenHolderV1.json" assert { type: "json" };

// Traces
import distributionFoldValidatorWithTracing from "../compiledLiquidityTracing/distributionFoldValidator.json" assert { type: "json" };
import distributionFoldPolicyWithTracing from "../compiledLiquidityTracing/distributionRewardFoldMint.json" assert { type: "json" };
import collectionFoldPolicyWithTracing from "../compiledLiquidityTracing/liquidityFoldMint.json" assert { type: "json" };
import collectionFoldValidatorWithTracing from "../compiledLiquidityTracing/liquidityFoldValidator.json" assert { type: "json" };
import liquidityPolicyWithTracing from "../compiledLiquidityTracing/liquidityMinting.json" assert { type: "json" };
import liquidityStakeWithTracing from "../compiledLiquidityTracing/liquidityStakeValidator.json" assert { type: "json" };
import tokenHolderPolicyWithTracing from "../compiledLiquidityTracing/liquidityTokenHolderMint.json" assert { type: "json" };
import tokenHolderValidatorWithTracing from "../compiledLiquidityTracing/liquidityTokenHolderValidator.json" assert { type: "json" };
import liquidityValidatorWithTracing from "../compiledLiquidityTracing/liquidityValidator.json" assert { type: "json" };
import proxyTokenHolderValidatorWithTracing from "../compiledLiquidityTracing/proxyTokenHolderV1.json" assert { type: "json" };

const Optimized = {
  collectionFoldPolicy,
  collectionFoldValidator,
  distributionFoldPolicy,
  distributionFoldValidator,
  liquidityPolicy,
  liquidityStake,
  liquidityValidator,
  proxyTokenHolderValidator,
  tokenHolderPolicy,
  tokenHolderValidator,
};

const WithBinds = {
  collectionFoldPolicy: collectionFoldPolicyWithBinds,
  collectionFoldValidator: collectionFoldValidatorWithBinds,
  distributionFoldPolicy: distributionFoldPolicyWithBinds,
  distributionFoldValidator: distributionFoldValidatorWithBinds,
  liquidityPolicy: liquidityPolicyWithBinds,
  liquidityStake: liquidityStakeWithBinds,
  liquidityValidator: liquidityValidatorWithBinds,
  proxyTokenHolderValidator: proxyTokenHolderValidatorWithBinds,
  tokenHolderPolicy: tokenHolderPolicyWithBinds,
  tokenHolderValidator: tokenHolderValidatorWithBinds,
};

const WithTracing = {
  collectionFoldPolicy: collectionFoldPolicyWithTracing,
  collectionFoldValidator: collectionFoldValidatorWithTracing,
  distributionFoldPolicy: distributionFoldPolicyWithTracing,
  distributionFoldValidator: distributionFoldValidatorWithTracing,
  liquidityPolicy: liquidityPolicyWithTracing,
  liquidityStake: liquidityStakeWithTracing,
  liquidityValidator: liquidityValidatorWithTracing,
  proxyTokenHolderValidator: proxyTokenHolderValidatorWithTracing,
  tokenHolderPolicy: tokenHolderPolicyWithTracing,
  tokenHolderValidator: tokenHolderValidatorWithTracing,
};

export const getScripts = (): typeof Optimized => {
  let scripts: typeof Optimized | undefined;
  switch (process.env.SCRIPT_TYPE) {
    case "traces":
      scripts = WithTracing;
      break;
    case "binds":
      scripts = WithBinds;
      break;
    default:
      scripts = Optimized;
  }

  return scripts;
};
