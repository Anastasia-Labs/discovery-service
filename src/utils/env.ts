import dotenv from "dotenv";
import path from "path";

const suffix =
  process.env.NODE_ENV === "mainnet" ? "" : `.${process.env.NODE_ENV}`;
const envPath = path.resolve(process.cwd(), `.env${suffix}`);
const result = dotenv.config({
  path: envPath,
});

if (result.error) {
  console.log(result.error);
}
