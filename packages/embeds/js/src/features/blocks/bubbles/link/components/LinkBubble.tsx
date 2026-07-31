import { defaultLinkBubbleContent } from "@typebot.io/blocks-bubbles/link/constants";
import type { LinkBubbleBlock } from "@typebot.io/blocks-bubbles/link/schema";
import { cx } from "@typebot.io/ui/lib/cva";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { TypingBubble } from "../../../../../components/TypingBubble";
import { sanitizeUrl } from "../../../../../lib/sanitizeUrl";

type Props = {
  content: LinkBubbleBlock["content"];
  onTransitionEnd?: (ref?: HTMLDivElement) => void;
};

const showAnimationDuration = 400;
const typingDuration = 100;

let typingTimeout: NodeJS.Timeout;

export const LinkBubble = (props: Props) => {
  let ref: HTMLDivElement | undefined;
  const [isTyping, setIsTyping] = createSignal(!!props.onTransitionEnd);

  onMount(() => {
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
      setTimeout(() => props.onTransitionEnd?.(ref), showAnimationDuration);
    }, typingDuration);
  });

  onCleanup(() => {
    if (typingTimeout) clearTimeout(typingTimeout);
  });

  const openInNewTab =
    props.content?.openInNewTab ?? defaultLinkBubbleContent.openInNewTab;
  const label = props.content?.label || props.content?.url || "";
  const href = props.content?.url ? sanitizeUrl(props.content.url) : "#";
  const preview = () => props.content?.previewData;
  const showPreview = () => props.content?.showPreview && !!preview();

  return (
    <div
      class={cx(
        "flex flex-col",
        props.onTransitionEnd ? "animate-fade-in" : undefined,
      )}
      ref={ref}
    >
      <div class="flex w-full items-center">
        <div
          dir="auto"
          class="flex relative z-10 items-start typebot-host-bubble max-w-full"
        >
          <div
            class="flex items-center absolute px-4 py-2 bubble-typing z-10"
            style={{
              width: isTyping() ? "64px" : "100%",
              height: isTyping() ? "32px" : "100%",
            }}
          >
            {isTyping() && <TypingBubble />}
          </div>
          <Show when={showPreview()}>
            <a
              href={href}
              target={openInNewTab ? "_blank" : "_self"}
              rel={openInNewTab ? "noreferrer" : undefined}
              class={cx(
                "z-10 text-fade-in block overflow-hidden rounded-lg border border-gray-200 hover:opacity-90 transition-opacity max-w-sm w-full",
                isTyping() ? "opacity-0 h-8 @xs:h-9" : "opacity-100",
              )}
            >
              <Show when={preview()?.image}>
                <img
                  src={preview()!.image}
                  alt=""
                  class="w-full object-cover max-h-48"
                  loading="lazy"
                />
              </Show>
              <div class="px-3 py-2">
                <Show when={preview()?.title ?? label}>
                  <p class="font-semibold text-sm leading-snug line-clamp-2">
                    {preview()?.title ?? label}
                  </p>
                </Show>
                <Show when={preview()?.description}>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                    {preview()!.description}
                  </p>
                </Show>
                <div class="flex items-center gap-1 mt-2">
                  <Show when={preview()?.favicon}>
                    <img
                      src={preview()!.favicon}
                      alt=""
                      class="w-3 h-3 object-contain"
                      loading="lazy"
                    />
                  </Show>
                  <p class="text-xs text-gray-400 truncate">
                    {preview()?.siteName}
                  </p>
                </div>
              </div>
            </a>
          </Show>
          <Show when={!showPreview()}>
            <div
              class={cx(
                "z-10 text-fade-in px-4 py-2",
                isTyping() ? "opacity-0 h-8 @xs:h-9" : "opacity-100",
              )}
            >
              <a
                href={href}
                target={openInNewTab ? "_blank" : "_self"}
                rel={openInNewTab ? "noreferrer" : undefined}
                class="underline text-[color:var(--typebot-button-bg-color,#1a56db)] hover:opacity-80 transition-opacity"
              >
                {label}
              </a>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
