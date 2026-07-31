export enum EventType {
  START = "start",
  COMMAND = "command",
  REPLY = "reply",
  INVALID_REPLY = "invalidReply",
  INTERRUPTION = "interruption",
}

export const defaultInterruptionInstructions = `Trigger only if the user's message clearly asks for one of these:
- To speak with a human / a real person
- A phone number, WhatsApp, or other direct contact
- A bulk, wholesale, or corporate order
- Something that falls outside what this assistant can help with

Do not trigger for normal replies to the assistant's questions, even if off-topic in a minor way.`;

export const defaultInterruptionHistoryWindow = 20;

export const defaultInterruptionSupportedLanguages: [string, ...string[]] = [
  "en",
  "ru",
  "es",
];

export const defaultInterruptionProvider = "open-router";
export const defaultInterruptionCredentialsId = "cmqaz6ir30000bkva0crpqfy3";
export const defaultInterruptionModel = "openai/gpt-5.1-chat";
