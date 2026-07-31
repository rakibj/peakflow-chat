import type {
  ContinueChatResponse,
  StartChatResponse,
} from "@typebot.io/chat-api/schemas";

export type BotContext = {
  typebot: StartChatResponse["typebot"];
  resultId?: string;
  isPreview: boolean;
  apiHost?: string;
  wsHost?: string;
  sessionId: string;
  storage: "local" | "session" | undefined;
};

export type ClientSideActionContext = {
  apiHost?: string;
  wsHost?: string;
  sessionId: string;
  resultId?: string;
  isPreview: boolean;
};

export type ChatChunk = Pick<
  ContinueChatResponse,
  "messages" | "clientSideActions" | "dynamicTheme"
> & {
  version: "2";
  input?: NonNullable<ContinueChatResponse["input"]> & {
    answer?: InputSubmitContent;
    isHidden?: boolean;
  };
  streamingMessage?: string | string[];
};

export type Attachment = {
  type: string;
  url: string;
  blobUrl?: string;
};

export type CardSnapshotPath = {
  text?: string;
  type?: "player-choice" | "link";
  linkUrl?: string;
};

export type CardSnapshot = {
  imageUrl?: string | null;
  title?: string | null;
  description?: string | null;
  extraDescriptions?: string[];
  selectedButtonText?: string;
  paths?: CardSnapshotPath[];
  selectedPathIndex?: number;
};

export type TextInputSubmitContent = {
  type: "text";
  value: string;
  label?: string;
  metadata?: {
    replyId?: string;
    isFreeText?: boolean;
    isSkip?: boolean;
  };
  attachments?: Attachment[];
  cardSnapshot?: CardSnapshot;
  cardSnapshots?: CardSnapshot[];
};

export type RecordingInputSubmitContent = {
  type: "recording";
  url: string;
  blobUrl?: string;
};

export type ClientSideResult = {
  type: "clientSideResult";
  result: string;
};

export type InputSubmitContent = { status?: "retry" } & (
  | TextInputSubmitContent
  | RecordingInputSubmitContent
);
