import type { ContinueChatResponse } from "@typebot.io/chat-api/schemas";
import type { Theme } from "@typebot.io/theme/schemas";

export const mergeThemes = (
  initialTheme: Theme,
  dynamicTheme: ContinueChatResponse["dynamicTheme"],
): Theme => ({
  ...initialTheme,
  general: initialTheme.general
    ? {
        ...initialTheme.general,
        background: initialTheme.general.background
          ? {
              ...initialTheme.general.background,
              content:
                dynamicTheme?.backgroundUrl ??
                initialTheme.general.background?.content,
            }
          : undefined,
      }
    : undefined,
  chat: {
    ...initialTheme.chat,
    hostAvatar:
      initialTheme.chat?.hostAvatar && dynamicTheme?.hostAvatarUrl
        ? {
            ...initialTheme.chat.hostAvatar,
            url: dynamicTheme.hostAvatarUrl,
          }
        : initialTheme.chat?.hostAvatar,
    guestAvatar:
      initialTheme.chat?.guestAvatar && dynamicTheme?.guestAvatarUrl
        ? {
            ...initialTheme.chat.guestAvatar,
            url: dynamicTheme?.guestAvatarUrl,
          }
        : initialTheme.chat?.guestAvatar,
    contact:
      initialTheme.chat?.contact &&
      (dynamicTheme?.availableMessage || dynamicTheme?.unavailableMessage)
        ? {
            ...initialTheme.chat.contact,
            availableMessage:
              dynamicTheme?.availableMessage ??
              initialTheme.chat.contact.availableMessage,
            unavailableMessage:
              dynamicTheme?.unavailableMessage ??
              initialTheme.chat.contact.unavailableMessage,
          }
        : initialTheme.chat?.contact,
    header:
      initialTheme.chat?.header &&
      (dynamicTheme?.headerStatus || dynamicTheme?.headerTagline)
        ? {
            ...initialTheme.chat.header,
            status:
              dynamicTheme?.headerStatus ?? initialTheme.chat.header.status,
            tagline:
              dynamicTheme?.headerTagline ?? initialTheme.chat.header.tagline,
          }
        : initialTheme.chat?.header,
  },
});
