import { getNetwork } from "./args.js";
import { getTTConfig } from "./files.js";

const checkDeadline = async () => {
  const {
    deadline,
    project: { name },
  } = await getTTConfig();
  console.log(
    `The ${name} on ${getNetwork()} will end on ${new Date(deadline).toLocaleDateString("en-US", { dateStyle: "full" })} at ${new Date(deadline).toLocaleTimeString()}`,
  );
};

checkDeadline();
