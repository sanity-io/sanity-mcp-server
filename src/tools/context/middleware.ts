import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { hasInitialContext } from "./getInitialContextTool.js";

export function enforceInitialContextMiddleware(
  toolName: string,
  args: any,
  extra: RequestHandlerExtra
) {
  if (toolName === "get_initial_context") {
    return;
  }

  if (!hasInitialContext()) {
    throw new Error(
      "Initial context has not been retrieved. Please call get_initial_context tool first to get the initial context."
    );
  }
}
