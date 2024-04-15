import dotenv from "dotenv";
import path from "path";
import { getNetwork } from "./args.js";

const suffix = getNetwork();
const envPath = path.resolve(process.cwd(), `.env.${suffix}`);
const result = dotenv.config({
  path: envPath,
});

if (result.error) {
  console.log(result.error);
}
