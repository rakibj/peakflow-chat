import {
  defaultGuestAvatarIsEnabled,
  defaultHostAvatarIsEnabled,
} from "@typebot.io/theme/constants";
import type { Theme } from "@typebot.io/theme/schemas";

export const parseDynamicThemeInState = (theme: Theme) => {
  const hostAvatarUrl =
    (theme.chat?.hostAvatar?.isEnabled ?? defaultHostAvatarIsEnabled)
      ? theme.chat?.hostAvatar?.url
      : undefined;
  const guestAvatarUrl =
    (theme.chat?.guestAvatar?.isEnabled ?? defaultGuestAvatarIsEnabled)
      ? theme.chat?.guestAvatar?.url
      : undefined;
  const backgroundUrl = theme.general?.background?.content;
  const availableMessage = theme.chat?.contact?.availableMessage;
  const unavailableMessage = theme.chat?.contact?.unavailableMessage;
  const headerStatus = theme.chat?.header?.status;
  const headerTagline = theme.chat?.header?.tagline;
  if (
    !hostAvatarUrl?.startsWith("{{") &&
    !guestAvatarUrl?.startsWith("{{") &&
    !backgroundUrl?.startsWith("{{") &&
    !availableMessage?.startsWith("{{") &&
    !unavailableMessage?.startsWith("{{") &&
    !headerStatus?.startsWith("{{") &&
    !headerTagline?.startsWith("{{")
  )
    return;
  return {
    hostAvatarUrl: hostAvatarUrl?.startsWith("{{") ? hostAvatarUrl : undefined,
    guestAvatarUrl: guestAvatarUrl?.startsWith("{{")
      ? guestAvatarUrl
      : undefined,
    backgroundUrl: backgroundUrl?.startsWith("{{") ? backgroundUrl : undefined,
    availableMessage: availableMessage?.startsWith("{{")
      ? availableMessage
      : undefined,
    unavailableMessage: unavailableMessage?.startsWith("{{")
      ? unavailableMessage
      : undefined,
    headerStatus: headerStatus?.startsWith("{{") ? headerStatus : undefined,
    headerTagline: headerTagline?.startsWith("{{") ? headerTagline : undefined,
  };
};
