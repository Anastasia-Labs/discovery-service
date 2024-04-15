import { Emulator } from "price-discovery-offchain";
import { getNetwork } from "./args.js";

export const getDatumsObject = (emulator?: Emulator) => {
  const datums: { [key: string]: string } = {};
  if (emulator) {
    if (getNetwork() === "mainnet") {
      datums[
        "24aa61609c74285e0d02f7adebb258cc9de480e0bd59207cd1a5f76793dc0c07"
      ] =
        "d8799f425505d8798041009f581c9d1cbb54faf284f5d262f591b1f9201a1858de155157dad49f3881c4581c694bc6017f9d74a5d9b3ef377b42b9fe4967a04fb1844959057f35bbffff";
    } else {
      datums[
        "d2653ed85dac06c5b39554b78875d4f8cb6680a274a0f2cf6897f2b99e35b0da"
      ] =
        "d8799f4121d8798041009f581cbb0d2cc0d7f7b80d3c0d7a7ac441f3865ffd297613c67f06951eb7faffff";
    }
  }

  return datums;
};
