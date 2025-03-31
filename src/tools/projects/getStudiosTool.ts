import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { GetProjectParamsType, Studio } from "./schema.js";

export async function getStudiosTool(
  args: GetProjectParamsType,
  extra: RequestHandlerExtra
) {
  try {
    const projectId = args.projectId;
    const response = await fetch(
      `https://api.sanity.io/v2021-06-07/projects/${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Sanity API request failed: ${response.statusText}`);
    }

    const project = await response.json();

    const studios: Studio[] = [];

    if (project.studioHost) {
      studios.push({
        type: "sanity-hosted",
        url: `https://${project.studioHost}.sanity.studio/`,
      });
    }

    if (project.externalStudioHost) {
      studios.push({
        type: "external",
        url: project.externalStudioHost,
      });
    }

    if (studios.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No hosted studio - Studio may be local only",
          },
        ],
      };
    }
    const studiosText = JSON.stringify(studios);
    return {
      content: [
        {
          type: "text" as const,
          text: `Studios for project ${projectId}: ${studiosText}`,
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Error fetching studios: ${error}`,
        },
      ],
    };
  }
}
