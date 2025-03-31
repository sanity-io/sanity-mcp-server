import { z } from "zod";

export const DocumentBaseSchema = z.object({
  _id: z.string(),
  _type: z.string().min(1, "type is required"),
});

export const DocumentPreviewSchema = DocumentBaseSchema.extend({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional().describe("Short description of the document"),
  image: z
    .string()
    .optional()
    .describe(
      "Asset _ref to a preview image - Always include if document has an image. Ex: image-Tb9Ew8CXIwaY6R1kjMvI0uRR-256x256-jpg",
    ),
});

export const DocumentLikeSchema = DocumentBaseSchema.catchall(z.unknown());

export const DocumentContextSchema = DocumentBaseSchema.extend({
  title: z.string().min(1, "Title is required"),
}).catchall(z.unknown());

export type DocumentBase = z.infer<typeof DocumentBaseSchema>;
export type DocumentLike = z.infer<typeof DocumentLikeSchema>;
export type DocumentPreview = z.infer<typeof DocumentPreviewSchema>;
export type DocumentContext = z.infer<typeof DocumentContextSchema>;
