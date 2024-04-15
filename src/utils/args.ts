export const isDryRun = () => {
  const args = process.argv;
  if (args.includes("--submit")) {
    return false;
  }

  return true;
};

export const getNetwork = () => {
  const args = process.argv;

  if (args.includes("--mainnet")) {
    return "mainnet";
  }

  return "preview";
};
