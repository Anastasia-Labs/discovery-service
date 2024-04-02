export const isDryRun = () => {
  const args = process.argv;
  if (args.includes("--dry")) {
    return true;
  }

  return false;
};

export const getNetwork = () => {
  const args = process.argv;
  if (args.includes("--preview")) {
    return "preview";
  }

  if (args.includes("--mainnet")) {
    return "mainnet";
  }

  throw new Error(
    "Did not receive a --[network] argument. Please supply `--preview` or `--mainnet`.",
  );
};
