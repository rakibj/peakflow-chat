import type { ContinueChatResponse } from "@typebot.io/chat-api/schemas";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import { parseVariables } from "@typebot.io/variables/parseVariables";

export const parseDynamicTheme = ({
  state,
  sessionStore,
}: {
  state: SessionState | undefined;
  sessionStore: SessionStore;
}): ContinueChatResponse["dynamicTheme"] => {
  if (!state?.dynamicTheme) return;
  return {
    hostAvatarUrl: state.dynamicTheme.hostAvatarUrl
      ? parseVariables(state.dynamicTheme.hostAvatarUrl, {
          variables: state?.typebotsQueue[0].typebot.variables,
          sessionStore,
        })
      : undefined,
    guestAvatarUrl: state.dynamicTheme.guestAvatarUrl
      ? parseVariables(state.dynamicTheme.guestAvatarUrl, {
          variables: state?.typebotsQueue[0].typebot.variables,
          sessionStore,
        })
      : undefined,
    backgroundUrl: state.dynamicTheme.backgroundUrl
      ? parseVariables(state.dynamicTheme.backgroundUrl, {
          variables: state?.typebotsQueue[0].typebot.variables,
          sessionStore,
        })
      : undefined,
    availableMessage: state.dynamicTheme.availableMessage
      ? parseVariables(state.dynamicTheme.availableMessage, {
          variables: state?.typebotsQueue[0].typebot.variables,
          sessionStore,
        })
      : undefined,
    unavailableMessage: state.dynamicTheme.unavailableMessage
      ? parseVariables(state.dynamicTheme.unavailableMessage, {
          variables: state?.typebotsQueue[0].typebot.variables,
          sessionStore,
        })
      : undefined,
    headerStatus: state.dynamicTheme.headerStatus
      ? parseVariables(state.dynamicTheme.headerStatus, {
          variables: state?.typebotsQueue[0].typebot.variables,
          sessionStore,
        })
      : undefined,
    headerTagline: state.dynamicTheme.headerTagline
      ? parseVariables(state.dynamicTheme.headerTagline, {
          variables: state?.typebotsQueue[0].typebot.variables,
          sessionStore,
        })
      : undefined,
  };
};
