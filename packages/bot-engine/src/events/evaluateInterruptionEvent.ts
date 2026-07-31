import { zodToSchema } from "@typebot.io/ai/zodToSchema";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { decryptAndRefreshCredentialsData } from "@typebot.io/credentials/decryptAndRefreshCredentials";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import type { Credentials } from "@typebot.io/credentials/schemas";
import {
  defaultInterruptionCredentialsId,
  defaultInterruptionHistoryWindow,
  defaultInterruptionInstructions,
  defaultInterruptionModel,
  defaultInterruptionProvider,
  defaultInterruptionSupportedLanguages,
  EventType,
} from "@typebot.io/events/constants";
import type { InterruptionEvent } from "@typebot.io/events/schemas";
import { forgedBlocks } from "@typebot.io/forge-repository/definitions";
import { parseUnknownError } from "@typebot.io/lib/parseUnknownError";
import type { LogInSession } from "@typebot.io/logs/schemas";
import { generateObject } from "ai";
import { z } from "zod";

const buildDecisionSchema = (supportedLanguages: [string, ...string[]]) =>
  z.object({
    shouldInterrupt: z.boolean(),
    reason: z.string(),
    mentionedLocation: z
      .string()
      .optional()
      .describe(
        "A specific store location, branch, or city the customer has already mentioned anywhere in the conversation, exactly as they referred to it. Leave empty if none was mentioned.",
      ),
    detectedLanguage: z
      .enum(supportedLanguages)
      .describe(
        `The language the customer is currently writing in, based on their most recent message. Must be one of: ${supportedLanguages.join(", ")}. Default to "${supportedLanguages[0]}" if the latest message is too short or ambiguous to tell (e.g. a single emoji, number, or button click echo).`,
      ),
  });

const resolveSupportedLanguages = (
  configured: string[] | undefined,
): [string, ...string[]] => {
  const languages = configured?.length
    ? configured
    : defaultInterruptionSupportedLanguages;
  const [first, ...rest] = languages;
  return [first, ...rest];
};

export type EvaluateInterruptionEventResult = {
  shouldInterrupt: boolean;
  mentionedLocation?: string;
  detectedLanguage?: string;
  log?: LogInSession;
};

export const findInterruptionEvent = (
  state: SessionState,
): InterruptionEvent | undefined =>
  state.typebotsQueue[0].typebot.events?.find(
    (e) => e.type === EventType.INTERRUPTION,
  ) as InterruptionEvent | undefined;

const context = "AI Interruption event";

export const evaluateInterruptionEvent = async (
  state: SessionState,
): Promise<EvaluateInterruptionEventResult> => {
  const event = findInterruptionEvent(state);
  if (!event?.options?.isEnabled) return { shouldInterrupt: false };

  if (!event.outgoingEdgeId)
    return {
      shouldInterrupt: false,
      log: {
        status: "warning",
        context,
        description: "Skipped: the event has no outgoing edge connected",
      },
    };

  const provider = event.options.provider ?? defaultInterruptionProvider;
  const credentialsId =
    event.options.credentialsId ?? defaultInterruptionCredentialsId;
  const modelName = event.options.model ?? defaultInterruptionModel;

  const historyWindow =
    event.options.historyWindow ?? defaultInterruptionHistoryWindow;
  const history = (state.conversationHistory ?? []).slice(historyWindow * -2);
  if (history.length === 0)
    return {
      shouldInterrupt: false,
      log: {
        status: "warning",
        context,
        description: "Skipped: no conversation history to analyze yet",
      },
    };

  const blockDef = forgedBlocks[provider as keyof typeof forgedBlocks];
  const action = blockDef?.actions.find((a) => a.aiGenerate);
  if (!blockDef || !action?.aiGenerate)
    return {
      shouldInterrupt: false,
      log: {
        status: "warning",
        context,
        description: `Skipped: provider "${provider}" does not support AI generation`,
      },
    };

  const credentials = await getCredentials(credentialsId, state.workspaceId);
  if (!credentials)
    return {
      shouldInterrupt: false,
      log: {
        status: "warning",
        context,
        description: "Skipped: could not find the selected credentials",
      },
    };

  const credentialsData = await decryptAndRefreshCredentialsData(
    {
      id: credentialsId,
      type: blockDef.id as Credentials["type"],
      data: credentials.data,
      iv: credentials.iv,
    },
    undefined,
  );
  if (!credentialsData)
    return {
      shouldInterrupt: false,
      log: {
        status: "warning",
        context,
        description: "Skipped: could not decrypt the selected credentials",
      },
    };

  const model = action.aiGenerate.getModel({
    credentials: credentialsData as any,
    model: modelName,
  });
  if (!model)
    return {
      shouldInterrupt: false,
      log: {
        status: "warning",
        context,
        description: `Skipped: could not resolve model "${modelName}"`,
      },
    };

  const transcript = history
    .map(
      (entry) =>
        `${entry.role === "bot" ? "Assistant" : "Customer"}: ${entry.content}`,
    )
    .join("\n");

  const supportedLanguages = resolveSupportedLanguages(
    event.options.supportedLanguages,
  );

  try {
    const { object } = await generateObject({
      model,
      schema: zodToSchema(buildDecisionSchema(supportedLanguages)),
      prompt: `${event.options.instructions ?? defaultInterruptionInstructions}

Conversation so far:
${transcript}

Decide whether the conversation should be interrupted right now. Also check the whole conversation (not just the latest message) for any specific store location, branch, or city the customer has already mentioned, and report it as mentionedLocation. Finally, always report detectedLanguage for the customer's latest message, one of: ${supportedLanguages.join(", ")}.`,
    });
    return {
      shouldInterrupt: object.shouldInterrupt,
      mentionedLocation: object.mentionedLocation || undefined,
      detectedLanguage: object.detectedLanguage,
      log: {
        status: "info",
        context,
        description: `Decision: ${object.shouldInterrupt ? "interrupt" : "continue"} — ${object.reason}`,
      },
    };
  } catch (err) {
    return {
      shouldInterrupt: false,
      log: { status: "error", ...(await parseUnknownError({ err, context })) },
    };
  }
};
