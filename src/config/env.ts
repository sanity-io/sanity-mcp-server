import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
  SANITY_API_TOKEN: z.string().describe("Sanity API token"),
  SANITY_PROJECT_ID: z.string().describe("Sanity project ID"),
  SANITY_DATASET: z.string().describe("The dataset"),
  SANITY_API_VERSION: z.string().describe("Sanity API version"),
  SANITY_API_HOST: z.string().describe("Sanity API host"),
  SANITY_PERSPECTIVE: z.union([
    z.enum(['published', 'drafts', 'raw']),
    z.array(z.string())
  ]).optional().default('drafts').describe("Sanity perspective - can be 'published', 'drafts', 'raw' or an array of release IDs."),
});

export const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("Invalid environment variables", env.error.format());
  process.exit(1);
}
