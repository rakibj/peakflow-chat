import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { parseGenerateVariablesOptions } from "@typebot.io/ai/parseGenerateVariablesOptions";
import { createAction } from "@typebot.io/forge";
import { isDefined } from "@typebot.io/lib/utils";
import { auth } from "../auth";
import { modelsFetcher } from "./createChatCompletion";

export const generateVariables = createAction({
  name: "Generate variables",
  auth,
  options: parseGenerateVariablesOptions({
    models: { type: "fetcher", id: modelsFetcher.id },
  }),
  fetchers: [modelsFetcher],
  aiGenerate: {
    models: { type: "dynamic", fetcherId: modelsFetcher.id },
    getModel: ({ credentials, model }) =>
      createOpenRouter({ apiKey: credentials.apiKey }).chat(model),
  },
  getSetVariableIds: (options) =>
    options.variablesToExtract
      ?.map((variable) => (variable.type ? variable.variableId : undefined))
      .filter(isDefined) ?? [],
});
