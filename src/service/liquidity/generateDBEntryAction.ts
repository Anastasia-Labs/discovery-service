import { Lucid } from "price-discovery-offchain";
import "../../utils/env.js";

import kebabCase from "lodash/kebabCase.js";
import { IDynamoTTEntry } from "../../@types/db.js";
import {
  MAINNET_OFFSET,
  PREVIEW_OFFSET,
  SEED_WALLET_INDEX,
} from "../../constants/network.js";
import { getNetwork } from "../../utils/args.js";
import {
  getAppliedScripts,
  getInitTTTx,
  getPublishedPolicyOutRefs,
  getTTConfig,
  getTTVariables,
  saveDynamoDB,
} from "../../utils/files.js";
import {
  fetchFromBlockfrost,
  posixToSlot,
  selectLucidWallet,
} from "../../utils/wallet.js";

const TWENTY_FOUR_HOURS_POSIX = 1000 * 60 * 60 * 24;

export const generateDBEntryAction = async (lucid: Lucid) => {
  const appliedScripts = await getAppliedScripts();
  const deployedPolicy = await getPublishedPolicyOutRefs();
  const initTx = await getInitTTTx();
  const { project, deadline, ...config } = await getTTConfig();
  const { projectTokenAssetName, projectTokenPolicyId } =
    await getTTVariables();
  await selectLucidWallet(lucid, SEED_WALLET_INDEX);
  const applied = await getAppliedScripts();

  if (!initTx) {
    throw new Error(
      `This TT has not been initialized yet. Run "yarn start-tt --dry", then try again.`,
    );
  }

  const startSlot = (
    await fetchFromBlockfrost(
      `txs/${appliedScripts.projectTokenHolder.initOutRef.txHash}`,
    )
  ).slot as number;

  const entry: Partial<IDynamoTTEntry> = {
    pk: {
      S: deployedPolicy.policy,
    },
    banner: {
      S: "http://cdn.sundaeswap.finance/clarity/banner-2.png",
    },
    primary_color: {
      S: "#636eff",
    },
    secondary_color: {
      S: "#ff74f1",
    },
    profile: {
      S: "http://cdn.sundaeswap.finance/clarity/pfp-2.png",
    },
    asset: {
      M: {
        AssetId: {
          S: `${projectTokenPolicyId}.${projectTokenAssetName}`,
        },
        AssetName: {
          S: Buffer.from(projectTokenAssetName, "hex").toString("utf-8"),
        },
        Decimals: {
          N: project.token.decimals.toString(),
        },
        Logo: {
          NULL: true,
        },
        MintDate: {
          M: {
            Slot: {
              S: "119557909",
            },
            SlotOffset: {
              N: getNetwork() === "mainnet" ? MAINNET_OFFSET : PREVIEW_OFFSET,
            },
          },
        },
        PolicyId: {
          S: projectTokenPolicyId,
        },
        Ticker: {
          S: project.token.readableName,
        },
        TotalSupply: {
          S: "2000000000000000",
        },
      },
    },
    createdDate: {
      M: {
        Slot: {
          S: startSlot.toString(),
        },
        SlotOffset: {
          N: getNetwork() === "mainnet" ? MAINNET_OFFSET : PREVIEW_OFFSET,
        },
      },
    },
    creationTxHash: {
      S: lucid.fromTx(initTx).toHash(),
    },
    endDate: {
      M: {
        Slot: {
          S: posixToSlot(deadline).toString(),
        },
        SlotOffset: {
          N: getNetwork() === "mainnet" ? MAINNET_OFFSET : PREVIEW_OFFSET,
        },
      },
    },
    finalTxHash: {
      NULL: true,
    },
    fundingAllocations: {
      L: [
        // {
        //   M: {
        //     Label: {
        //       S: "SS",
        //     },
        //     Percentage: {
        //       N: "1",
        //     },
        //   },
        // },
      ],
    },
    lastCallDate: {
      M: {
        Slot: {
          S: posixToSlot(deadline - TWENTY_FOUR_HOURS_POSIX).toString(),
        },
        SlotOffset: {
          N: getNetwork() === "mainnet" ? MAINNET_OFFSET : PREVIEW_OFFSET,
        },
      },
    },
    openDate: {
      M: {
        Slot: {
          S: startSlot.toString(),
        },
        SlotOffset: {
          N: getNetwork() === "mainnet" ? MAINNET_OFFSET : PREVIEW_OFFSET,
        },
      },
    },
    parameters: {
      M: {
        beneficiaryAddress: {
          S: project.addresses.liquidityDestination,
        },
        foldFee: {
          N: "2000000",
        },
        poolPolicyId: {
          S: config.v1PoolData.policyId,
        },
        minUTXO: {
          N: "3000000",
        },
        penaltyAddress: {
          S: project.addresses.withdrawPenalty,
        },
        penaltyPercentage: {
          N: "0.25",
        },
        poolFee: {
          M: {
            Denominator: {
              N: "1000",
            },
            Numerator: {
              N: "30",
            },
          },
        },
      },
    },
    poolTxHash: {
      NULL: true,
    },
    projectDetails: {
      M: {
        Description: {
          S: project.description,
        },
        Handle: {
          S: "yes",
        },
        Name: {
          S: project.name,
        },
        Socials: {
          L: [
            {
              M: {
                Name: {
                  S: "Twitter",
                },
                Url: {
                  S: "https://twitter.com/clarity_dao",
                },
              },
            },
            {
              M: {
                Name: {
                  S: "Discord",
                },
                Url: {
                  S: "https://discord.gg/KujHvyA4xd ",
                },
              },
            },
            {
              M: {
                Name: {
                  S: "Medium",
                },
                Url: {
                  S: "https://medium.com/@Clarity_",
                },
              },
            },
            {
              M: {
                Name: {
                  S: "Youtube",
                },
                Url: {
                  S: "https://www.youtube.com/watch?v=5nRwAVQ8LMM",
                },
              },
            },
          ],
        },
        Team: {
          M: {
            Company: {
              S: "ClarityDAO",
            },
            Members: {
              L: [
                {
                  M: {
                    Name: {
                      S: "Logan Panchot",
                    },
                    Role: {
                      S: "Business Development Lead",
                    },
                    Social: {
                      NULL: true,
                    },
                  },
                },
                {
                  M: {
                    Name: {
                      S: "Justin Schreiner",
                    },
                    Role: {
                      S: "Product Lead",
                    },
                    Social: {
                      NULL: true,
                    },
                  },
                },
                {
                  M: {
                    Name: {
                      S: "Matt Laux",
                    },
                    Role: {
                      S: "Full Stack Developer",
                    },
                    Social: {
                      NULL: true,
                    },
                  },
                },
                {
                  M: {
                    Name: {
                      S: "Tomasz Maciosowski",
                    },
                    Role: {
                      S: "On-chain Lead",
                    },
                    Social: {
                      NULL: true,
                    },
                  },
                },
                {
                  M: {
                    Name: {
                      S: "Ben Hart",
                    },
                    Role: { S: "Business Development" },
                    Social: {
                      NULL: true,
                    },
                  },
                },
              ],
            },
            Other: {
              L: [],
            },
            Socials: {
              L: [
                {
                  M: {
                    Name: {
                      S: "Website",
                    },
                    Url: {
                      S: "https://clarity.community",
                    },
                  },
                },
                {
                  M: {
                    Name: {
                      S: "Whitepaper",
                    },
                    Url: {
                      S: "https://docsend.com/view/5dxmuwzgptqxzvm7",
                    },
                  },
                },
              ],
            },
          },
        },
        Tokenomics: {
          L: [
            {
              M: {
                Label: {
                  S: "Team",
                },
                Percentage: {
                  N: "11.5",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "Strategic Partners",
                },
                Percentage: {
                  N: "20.15",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "Taste Test",
                },
                Percentage: {
                  N: "5",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "Community Rewards",
                },
                Percentage: {
                  N: "29",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "DAO Treasury",
                },
                Percentage: {
                  N: "24.35",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "Future Development",
                },
                Percentage: {
                  N: "10",
                },
              },
            },
          ],
        },
      },
    },
    projectTokens: {
      N: project.token.suppliedAmount.toString(),
    },
    scripts: {
      M: {
        CollectFoldPolicy: {
          M: {
            purpose: {
              S: "CollectFoldPolicy",
            },
            scriptBytes: {
              NULL: true,
            },
            scriptHash: {
              S: applied.scriptHashes.collectFoldPolicy,
            },
            utxo: {
              M: {
                index: {
                  N: deployedPolicy.scriptsRef.CollectFoldPolicy.outputIndex.toString(),
                },
                txId: {
                  S: deployedPolicy.scriptsRef.CollectFoldPolicy.txHash.toString(),
                },
              },
            },
          },
        },
        CollectFoldValidator: {
          M: {
            purpose: {
              S: "CollectFoldValidator",
            },
            scriptBytes: {
              NULL: true,
            },
            scriptHash: {
              S: applied.scriptHashes.collectFoldValidator,
            },
            utxo: {
              M: {
                index: {
                  N: deployedPolicy.scriptsRef.CollectFoldValidator.outputIndex.toString(),
                },
                txId: {
                  S: deployedPolicy.scriptsRef.CollectFoldValidator.txHash.toString(),
                },
              },
            },
          },
        },
        RewardFoldPolicy: {
          M: {
            purpose: {
              S: "RewardFoldPolicy",
            },
            scriptBytes: {
              NULL: true,
            },
            scriptHash: {
              S: applied.scriptHashes.rewardFoldPolicy,
            },
            utxo: {
              M: {
                index: {
                  N: deployedPolicy.scriptsRef.RewardFoldPolicy.outputIndex.toString(),
                },
                txId: {
                  S: deployedPolicy.scriptsRef.RewardFoldPolicy.txHash.toString(),
                },
              },
            },
          },
        },
        RewardFoldValidator: {
          M: {
            purpose: {
              S: "RewardFoldValidator",
            },
            scriptBytes: {
              NULL: true,
            },
            scriptHash: {
              S: applied.scriptHashes.rewardFoldValidator,
            },
            utxo: {
              M: {
                index: {
                  N: deployedPolicy.scriptsRef.RewardFoldValidator.outputIndex.toString(),
                },
                txId: {
                  S: deployedPolicy.scriptsRef.RewardFoldValidator.txHash.toString(),
                },
              },
            },
          },
        },
        TasteTestPolicy: {
          M: {
            purpose: {
              S: "TasteTestPolicy",
            },
            scriptBytes: {
              NULL: true,
            },
            scriptHash: {
              S: applied.scriptHashes.liquidityPolicy,
            },
            utxo: {
              M: {
                index: {
                  N: deployedPolicy.scriptsRef.TasteTestPolicy.outputIndex.toString(),
                },
                txId: {
                  S: deployedPolicy.scriptsRef.TasteTestPolicy.txHash.toString(),
                },
              },
            },
          },
        },
        TasteTestValidator: {
          M: {
            purpose: {
              S: "TasteTestValidator",
            },
            scriptBytes: {
              NULL: true,
            },
            scriptHash: {
              S: applied.scriptHashes.liquidityValidator,
            },
            utxo: {
              M: {
                index: {
                  N: deployedPolicy.scriptsRef.TasteTestValidator.outputIndex.toString(),
                },
                txId: {
                  S: deployedPolicy.scriptsRef.TasteTestValidator.txHash.toString(),
                },
              },
            },
          },
        },
        TasteTestStakeValidator: {
          M: {
            purpose: {
              S: "TasteTestStakeValidator",
            },
            scriptBytes: {
              NULL: true,
            },
            scriptHash: {
              S: applied.scriptHashes.collectStake,
            },
            utxo: {
              M: {
                index: {
                  N: deployedPolicy.scriptsRef.TasteTestStakeValidator.outputIndex.toString(),
                },
                txId: {
                  S: deployedPolicy.scriptsRef.TasteTestStakeValidator.txHash.toString(),
                },
              },
            },
          },
        },
        TokenHolderPolicy: {
          M: {
            purpose: {
              S: "TokenHolderPolicy",
            },
            scriptBytes: {
              NULL: true,
            },
            scriptHash: {
              S: applied.scriptHashes.tokenHolderPolicy,
            },
            utxo: {
              M: {
                index: {
                  N: deployedPolicy.scriptsRef.TokenHolderPolicy.outputIndex.toString(),
                },
                txId: {
                  S: deployedPolicy.scriptsRef.TokenHolderPolicy.txHash.toString(),
                },
              },
            },
          },
        },
        TokenHolderValidator: {
          M: {
            purpose: {
              S: "TokenHolderValidator",
            },
            scriptBytes: {
              NULL: true,
            },
            scriptHash: {
              S: applied.scriptHashes.tokenHolderValidator,
            },
            utxo: {
              M: {
                index: {
                  N: deployedPolicy.scriptsRef.TokenHolderValidator.outputIndex.toString(),
                },
                txId: {
                  S: deployedPolicy.scriptsRef.TokenHolderValidator.txHash.toString(),
                },
              },
            },
          },
        },
      },
    },
    slug: {
      S: kebabCase(project.name),
    },
    type: {
      S: "Liquidity",
    },
    vestingSchedule: {
      L: [],
    },
  };

  const getUnlock = (label: string, amount: bigint, month: number) => {
    return {
      M: {
        Address: {
          S: label,
        },
        Amount: {
          S: amount.toString(),
        },
        Label: {
          S: label,
        },
        ReleaseDate: {
          M: {
            Slot: {
              S: posixToSlot(
                deadline + 1000 * 60 * 60 * 24 * 30 * month,
              ).toString(),
            },
            SlotOffset: {
              N: MAINNET_OFFSET,
            },
          },
        },
      },
    };
  };

  for (let i = 0; i < 24; i++) {
    if (i === 0) {
      entry.vestingSchedule?.L.push(getUnlock("Team", 57_500_000_000_000n, 0));
      entry.vestingSchedule?.L.push(
        getUnlock("Strategic Partners", 100_750_000_000_000n, 0),
      );
      entry.vestingSchedule?.L.push(
        getUnlock("Future Development", 50_000_000_000_000n, 0),
      );
    } else {
      entry.vestingSchedule?.L.push(getUnlock("Team", 7_187_500_000_000n, i));
      entry.vestingSchedule?.L.push(
        getUnlock("Strategic Partners", 12_593_750_000_000n, i),
      );
      entry.vestingSchedule?.L.push(
        getUnlock("Future Development", 6_250_000_000_000n, i),
      );
    }
  }

  await saveDynamoDB(entry as IDynamoTTEntry);
};
