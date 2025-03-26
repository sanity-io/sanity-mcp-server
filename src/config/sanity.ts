import { createClient } from "@sanity/client";
import { env } from "./env.js";

if (!env.success) {
  throw new Error("Environment variables are not properly configured");
}

// Create a singleton instance of the Sanity client
export const sanityClient = createClient({
  projectId: env.data.SANITY_PROJECT_ID,
  apiHost: "https://api.sanity.work",
  dataset: env.data.SANITY_DATASET,
  apiVersion: env.data.SANITY_API_VERSION,
  token: env.data.SANITY_API_TOKEN,
  useCdn: false, // Set to true for better caching in production
});
