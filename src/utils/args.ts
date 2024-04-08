export const isDryRun = () => {
  const args = process.argv;
  if (args.includes("--dry")) {
    return true;
  }

  return false;
};

export const getNetwork = () => {
  const args = process.argv;

  if (args.includes("--mainnet")) {
    return "mainnet";
  }

  return "preview";
};
