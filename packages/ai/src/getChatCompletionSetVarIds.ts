import { isDefined } from "@typebot.io/lib/utils";
import type { ChatCompletionOptions } from "./parseChatCompletionOptions";

export const getChatCompletionSetVarIds = (options: ChatCompletionOptions) => {
  const fromResponseMapping =
    options.responseMapping?.map((res) => res.variableId).filter(isDefined) ??
    [];
  const fromStructuredOutput =
    options.structuredOutput?.variablesToExtract
      ?.map((v) => (v.type ? v.variableId : undefined))
      .filter(isDefined) ?? [];
  return [...fromResponseMapping, ...fromStructuredOutput];
};
