import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { z } from "zod";
import type { GetExampleDocumentsSchema } from "./schemas.js";

type GetExampleDocumentsParams = z.infer<typeof GetExampleDocumentsSchema>;

const exampleDocs = {
  blog: [
    {
      _id: "blog1",
      title: "Getting Started with Sanity",
      author: "John Doe",
      publishedAt: "2024-03-21",
    },
    {
      _id: "blog2",
      title: "Advanced GROQ Queries",
      author: "Jane Smith",
      publishedAt: "2024-03-20",
    },
    {
      _id: "blog3",
      title: "Content Modeling Best Practices",
      author: "Mike Johnson",
      publishedAt: "2024-03-19",
    },
    {
      _id: "blog4",
      title: "Real-time Collaboration in Sanity",
      author: "Sarah Wilson",
      publishedAt: "2024-03-18",
    },
    {
      _id: "blog5",
      title: "Custom Input Components",
      author: "Tom Brown",
      publishedAt: "2024-03-17",
    },
  ],
  product: [
    {
      _id: "prod1",
      name: "Ergonomic Chair",
      price: 299.99,
      inStock: true,
      category: "Furniture",
    },
    {
      _id: "prod2",
      name: "Standing Desk",
      price: 499.99,
      inStock: true,
      category: "Furniture",
    },
    {
      _id: "prod3",
      name: "Laptop Stand",
      price: 79.99,
      inStock: false,
      category: "Accessories",
    },
    {
      _id: "prod4",
      name: "Wireless Mouse",
      price: 49.99,
      inStock: true,
      category: "Electronics",
    },
    {
      _id: "prod5",
      name: "Mechanical Keyboard",
      price: 159.99,
      inStock: true,
      category: "Electronics",
    },
  ],
  user: [
    {
      _id: "user1",
      name: "John Smith",
      email: "john@example.com",
      role: "admin",
    },
    {
      _id: "user2",
      name: "Mary Johnson",
      email: "mary@example.com",
      role: "editor",
    },
    {
      _id: "user3",
      name: "Bob Wilson",
      email: "bob@example.com",
      role: "viewer",
    },
    {
      _id: "user4",
      name: "Alice Brown",
      email: "alice@example.com",
      role: "editor",
    },
    {
      _id: "user5",
      name: "Charlie Davis",
      email: "charlie@example.com",
      role: "viewer",
    },
  ],
};

/**
 * Example of how to implement a tool function. Here we could fetch documents from Sanity using the sanityClient.
 */
export async function getExampleDocumentsTool(
  args: GetExampleDocumentsParams,
  extra: RequestHandlerExtra
) {
  const { type, limit = 5 } = args;

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const documents = exampleDocs[type].slice(0, limit);

  return {
    content: [
      {
        type: "text" as const,
        text: `Found ${documents.length} ${type} documents:\n\n${JSON.stringify(
          documents,
          null,
          2
        )}`,
      },
    ],
  };
} 