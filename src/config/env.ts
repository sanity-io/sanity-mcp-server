import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
  SANITY_API_TOKEN: z.string().describe("Sanity API token"),
  SANITY_PROJECT_ID: z.string().describe("Sanity project ID"),
  SANITY_DATASET: z.string().describe("The dataset"),
  SANITY_API_VERSION: z.string().describe("Sanity API version"),
});

export const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("Invalid environment variables", env.error.format());
  process.exit(1);
}
