import { writeFile } from "fs";
import { Lucid, Script } from "price-discovery-offchain";
import "../../utils/env.js";

import appliedScripts from "../../../applied-scripts.json" assert { type: "json" };
import deployedPolicy from "../../../deployed-policy.json" assert { type: "json" };
import tx from "../../../init-tx.json" assert { type: "json" };
import { DynamoTTEntry } from "../../@types/db.js";
import { MAINNET_OFFSET, PREVIEW_OFFSET } from "../../constants/network.js";
import { getTasteTestVariables } from "../../utils/files.js";
import {
  fetchFromBlockfrost,
  posixToSlot,
  selectLucidWallet,
} from "../../utils/wallet.js";

const TWENTY_FOUR_HOURS_POSIX = 1000 * 60 * 60 * 24;

export const generateDBEntryAction = async (lucid: Lucid) => {
  const { projectTokenAssetName, projectTokenPolicyId } =
    await getTasteTestVariables();
  await selectLucidWallet(lucid, 0);

  const scriptRefUtxos = await lucid.utxosByOutRef([
    deployedPolicy.scriptsRef.CollectFoldPolicy,
    deployedPolicy.scriptsRef.CollectFoldValidator,
    deployedPolicy.scriptsRef.RewardFoldPolicy,
    deployedPolicy.scriptsRef.RewardFoldValidator,
    deployedPolicy.scriptsRef.TasteTestPolicy,
    deployedPolicy.scriptsRef.TasteTestValidator,
    deployedPolicy.scriptsRef.TasteTestStakeValidator,
    deployedPolicy.scriptsRef.TokenHolderPolicy,
    deployedPolicy.scriptsRef.TokenHolderValidator,
  ]);

  const [
    collectFoldPolicyHash,
    collectFoldValidatorHash,
    rewardFoldPolicyHash,
    rewardFoldValidatorHash,
    tasteTestPolicyHash,
    tasteTestValidatorHash,
    tasteTestStakeValidatorHash,
    tokenHolderPolicyHash,
    tokenHolderValidatorHash,
  ] = scriptRefUtxos.map(({ scriptRef }) => {
    return lucid.utils.validatorToScriptHash(scriptRef as Script);
  });

  const startSlot = (
    await fetchFromBlockfrost(
      `txs/${appliedScripts.projectTokenHolder.initOutRef.txHash}`,
    )
  ).slot as number;

  const entry: DynamoTTEntry = {
    pk: {
      S: deployedPolicy.policy,
    },
    adaHandle: {
      S: "000de14074745f74657374",
    },
    banner: {
      S: "",
    },
    primary_color: {
      S: "#2457f2",
    },
    secondary_color: {
      S: "#dce0ef",
    },
    profile: {
      S: "",
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
          N: process.env.PROJECT_TN_DECIMALS as string,
        },
        Logo: {
          NULL: true,
        },
        MintDate: {
          M: {
            Slot: {
              S: startSlot.toString(),
            },
            SlotOffset: {
              N:
                process.env.NODE_ENV === "mainnet"
                  ? MAINNET_OFFSET
                  : PREVIEW_OFFSET,
            },
          },
        },
        PolicyId: {
          S: projectTokenPolicyId,
        },
        Ticker: {
          S: Buffer.from(projectTokenAssetName, "hex")
            .toString("utf-8")
            .slice(0, 5)
            .toUpperCase(),
        },
        TotalSupply: {
          S: process.env.PROJECT_AMNT as string,
        },
      },
    },
    createdDate: {
      M: {
        Slot: {
          S: startSlot.toString(),
        },
        SlotOffset: {
          N:
            process.env.NODE_ENV === "mainnet"
              ? MAINNET_OFFSET
              : PREVIEW_OFFSET,
        },
      },
    },
    creationTxHash: {
      S: tx.txHash,
    },
    endDate: {
      M: {
        Slot: {
          S: posixToSlot(process.env.DEADLINE as string).toString(),
        },
        SlotOffset: {
          N:
            process.env.NODE_ENV === "mainnet"
              ? MAINNET_OFFSET
              : PREVIEW_OFFSET,
        },
      },
    },
    finalTxHash: {
      NULL: true,
    },
    fundingAllocations: {
      L: [
        {
          M: {
            Label: {
              S: "SS",
            },
            Percentage: {
              N: "1",
            },
          },
        },
      ],
    },
    lastCallDate: {
      M: {
        Slot: {
          S: posixToSlot(
            Number(process.env.DEADLINE as string) - TWENTY_FOUR_HOURS_POSIX,
          ).toString(),
        },
        SlotOffset: {
          N:
            process.env.NODE_ENV === "mainnet"
              ? MAINNET_OFFSET
              : PREVIEW_OFFSET,
        },
      },
    },
    openDate: {
      M: {
        Slot: {
          S: startSlot.toString(),
        },
        SlotOffset: {
          N:
            process.env.NODE_ENV === "mainnet"
              ? MAINNET_OFFSET
              : PREVIEW_OFFSET,
        },
      },
    },
    parameters: {
      M: {
        beneficiaryAddress: {
          S: process.env.PENALTY_ADDRESS as string,
        },
        foldFee: {
          N: "2000000",
        },
        poolPolicyId: {
          S: process.env.POOL_POLICY_ID!,
        },
        minUTXO: {
          N: "3000000",
        },
        penaltyAddress: {
          S: process.env.PENALTY_ADDRESS as string,
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
          S: process.env.PROJECT_DESC as string,
        },
        Handle: {
          S: "yes",
        },
        Name: {
          S: process.env.PROJECT_NAME as string,
        },
        Socials: {
          L: [
            {
              M: {
                Name: {
                  S: "Reddit",
                },
                Url: {
                  S: "https://example.com",
                },
              },
            },
            {
              M: {
                Name: {
                  S: "Telegram",
                },
                Url: {
                  S: "https://example.com",
                },
              },
            },
          ],
        },
        Team: {
          M: {
            Company: {
              S: `${process.env.PROJECT_TN}, Inc.`,
            },
            Members: {
              L: [
                {
                  M: {
                    Name: {
                      S: "Lorem Ipsum",
                    },
                    Role: {
                      S: "CEO",
                    },
                    Social: {
                      NULL: true,
                    },
                  },
                },
              ],
            },
            Other: {
              L: [
                {
                  S: "AP1",
                },
              ],
            },
            Socials: {
              NULL: true,
            },
          },
        },
        Tokenomics: {
          L: [
            {
              M: {
                Label: {
                  S: "DAO Treasury",
                },
                Percentage: {
                  N: "50",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "Airdrop",
                },
                Percentage: {
                  N: "15",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "Governance",
                },
                Percentage: {
                  N: "10",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "Team",
                },
                Percentage: {
                  N: "5",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "Protocol Liquidity",
                },
                Percentage: {
                  N: "12",
                },
              },
            },
            {
              M: {
                Label: {
                  S: "Taste Test",
                },
                Percentage: {
                  N: "8",
                },
              },
            },
          ],
        },
      },
    },
    projectTokens: {
      N: process.env.PROJECT_AMNT as string,
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
              S: collectFoldPolicyHash as string,
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
              S: collectFoldValidatorHash as string,
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
              S: rewardFoldPolicyHash as string,
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
              S: rewardFoldValidatorHash as string,
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
              S: tasteTestPolicyHash as string,
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
              S: tasteTestValidatorHash as string,
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
              S: tasteTestStakeValidatorHash as string,
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
              S: tokenHolderPolicyHash as string,
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
              S: tokenHolderValidatorHash as string,
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
      S: (process.env.PROJECT_NAME as string).toLowerCase().replace(" ", "-"),
    },
    type: {
      S: "Liquidity",
    },
    vestingSchedule: {
      L: [
        {
          M: {
            Address: {
              S: "addr1justoneparty",
            },
            Amount: {
              S: "1000000",
            },
            Label: {
              S: "Just One Party",
            },
            ReleaseDate: {
              M: {
                Slot: {
                  S: (startSlot + 86400 * 100).toString(),
                },
                SlotOffset: {
                  N:
                    process.env.NODE_ENV === "mainnet"
                      ? MAINNET_OFFSET
                      : PREVIEW_OFFSET,
                },
              },
            },
          },
        },
      ],
    },
  };

  writeFile(
    `./dynamodb-template.json`,
    JSON.stringify(entry, undefined, 2),
    (error) => {
      error ? console.log(error) : console.log(`DynamoDB template saved!`);
    },
  );
};
