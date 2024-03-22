import { Emulator } from "price-discovery-offchain";

export const getDatumsObject = (emulator?: Emulator) => {
  const datums: { [key: string]: string } = {};
  if (emulator) {
    datums["d2653ed85dac06c5b39554b78875d4f8cb6680a274a0f2cf6897f2b99e35b0da"] =
      "d8799f4121d8798041009f581cbb0d2cc0d7f7b80d3c0d7a7ac441f3865ffd297613c67f06951eb7faffff";
  }

  return datums;
};
