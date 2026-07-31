import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { runChatCompletion } from "@typebot.io/ai/runChatCompletion";
import { runChatCompletionStream } from "@typebot.io/ai/runChatCompletionStream";
import { runGenerateVariables } from "@typebot.io/ai/runGenerateVariables";
import { createActionHandler, createFetcherHandler } from "@typebot.io/forge";
import { ky } from "@typebot.io/lib/ky";
import { parseUnknownError } from "@typebot.io/lib/parseUnknownError";
import {
  createChatCompletion,
  modelsFetcher,
} from "./actions/createChatCompletion";
import { generateVariables } from "./actions/generateVariables";
import { defaultOpenRouterOptions } from "./constants";
import type { ModelsResponse } from "./types";

export default [
  createActionHandler(createChatCompletion, {
    server: async ({
      credentials: { apiKey },
      options,
      variables,
      logs,
      sessionStore,
    }) => {
      if (!apiKey) return logs.add("No API key provided");
      const modelName = options.model?.trim();
      if (!modelName) return logs.add("No model provided");
      if (!options.messages) return logs.add("No messages provided");

      await runChatCompletion({
        model: createOpenRouter({
          apiKey,
        }).chat(modelName),
        variables,
        messages: options.messages,
        tools: options.tools,
        isVisionEnabled: false,
        temperature: options.temperature,
        responseMapping: options.responseMapping,
        structuredOutput: options.structuredOutput,
        logs,
        sessionStore,
      });
    },
    stream: {
      run: async ({
        credentials: { apiKey },
        options,
        variables,
        sessionStore,
      }) => {
        if (options.structuredOutput?.variablesToExtract?.length)
          return {
            error: {
              description: "Structured output mode does not support streaming",
            },
          };
        if (!apiKey)
          return {
            error: {
              description: "No API key provided",
            },
          };
        const modelName = options.model?.trim();
        if (!modelName)
          return {
            error: {
              description: "No model provided",
            },
          };
        if (!options.messages)
          return {
            error: {
              description: "No messages provided",
            },
          };

        return runChatCompletionStream({
          model: createOpenRouter({
            apiKey,
          }).chat(modelName),
          variables,
          messages: options.messages,
          tools: options.tools,
          isVisionEnabled: false,
          temperature: options.temperature,
          responseMapping: options.responseMapping,
          sessionStore,
        });
      },
    },
  }),
  createActionHandler(generateVariables, {
    server: ({ credentials: { apiKey }, options, variables, logs }) => {
      if (!apiKey) return logs.add("No API key provided");
      const modelName = options.model?.trim();
      if (!modelName) return logs.add("No model provided");

      return runGenerateVariables({
        model: createOpenRouter({ apiKey }).chat(modelName),
        prompt: options.prompt,
        variablesToExtract: options.variablesToExtract,
        variables,
        logs,
      });
    },
  }),
  createFetcherHandler(createChatCompletion, modelsFetcher.id, async () => {
    try {
      const response = await ky
        .get(`${defaultOpenRouterOptions.baseUrl}/models`)
        .json<ModelsResponse>();

      return {
        data: response.data.map((model) => ({
          value: model.id,
          label: model.name,
        })),
      };
    } catch (err) {
      return {
        error: await parseUnknownError({ err, context: "Fetching models" }),
      };
    }
  }),
];
