import { z } from "zod";

export const GetSchemaParams = {
  type: z.string().describe("Name of the _type for the document to fetch"),
  schemaId: z.string().optional().describe("The schema ID to fetch"),
};

export const GetSchemaParamsSchema = z.object(GetSchemaParams);

export type GetSchemaParamsType = z.infer<typeof GetSchemaParamsSchema>;

export interface ManifestSchemaType {
  type: string;
  name: string;
  title?: string;
  deprecated?: {
    reason: string;
  };
  readOnly?: boolean | "conditional";
  hidden?: boolean | "conditional";
  validation?: ManifestValidationGroup[];
  fields?: ManifestField[];
  to?: ManifestReferenceMember[];
  of?: ManifestArrayMember[];
  preview?: {
    select: Record<string, string>;
  };
  fieldsets?: ManifestFieldset[];
  options?: Record<string, ManifestSerializable>;
  //portable text
  marks?: {
    annotations?: ManifestArrayMember[];
    decorators?: ManifestTitledValue[];
  };
  lists?: ManifestTitledValue[];
  styles?: ManifestTitledValue[];

  // userland (assignable to ManifestSerializable | undefined)
  [index: string]: unknown;
}

export interface ManifestFieldset {
  name: string;
  title?: string;
  [index: string]: ManifestSerializable | undefined;
}

export interface ManifestTitledValue {
  value: string;
  title?: string;
}

export type ManifestField = ManifestSchemaType & { fieldset?: string };
export type ManifestArrayMember = Omit<ManifestSchemaType, "name"> & {
  name?: string;
};
export type ManifestReferenceMember = Omit<ManifestSchemaType, "name"> & {
  name?: string;
};

export interface ManifestValidationGroup {
  rules: ManifestValidationRule[];
  message?: string;
  level?: "error" | "warning" | "info";
}

export type ManifestValidationRule = {
  flag: "presence" | string;
  constraint?: "required" | ManifestSerializable;
  [index: string]: ManifestSerializable | undefined;
};
export type ManifestSerializable =
  | string
  | number
  | boolean
  | { [k: string]: ManifestSerializable }
  | ManifestSerializable[];
