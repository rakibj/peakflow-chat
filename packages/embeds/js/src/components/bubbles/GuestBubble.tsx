import { isNotEmpty } from "@typebot.io/lib/utils";
import {
  defaultGuestAvatarIsEnabled,
  defaultHostAvatarIsEnabled,
} from "@typebot.io/theme/constants";
import { isChatContainerLight } from "@typebot.io/theme/helpers/isChatContainerLight";
import type { Theme } from "@typebot.io/theme/schemas";
import { cx } from "@typebot.io/ui/lib/cva";
import { createSignal, For, Match, Show, Switch } from "solid-js";
import { FilePreview } from "../../features/blocks/inputs/fileUpload/components/FilePreview";
import type {
  CardSnapshot,
  CardSnapshotPath,
  InputSubmitContent,
  RecordingInputSubmitContent,
  TextInputSubmitContent,
} from "../../types";
import { Avatar } from "../avatars/Avatar";
import { Modal } from "../Modal";

type Props = {
  answer?: InputSubmitContent;
  theme: Theme;
};

export const GuestBubble = (props: Props) => {
  return (
    <div
      class={cx(
        "flex justify-end items-end animate-fade-in gap-2 guest-container",
        (props.theme.chat?.hostAvatar?.isEnabled ??
          defaultHostAvatarIsEnabled) &&
          "ml-7 @xs:ml-[50px]",
      )}
    >
      <Switch>
        <Match when={props.answer?.type === "text"}>
          <TextGuestBubble answer={props.answer as TextInputSubmitContent} />
        </Match>
        <Match when={props.answer?.type === "recording"}>
          <AudioGuestBubble
            answer={props.answer as RecordingInputSubmitContent}
          />
        </Match>
      </Switch>

      <Show
        when={
          props.theme.chat?.guestAvatar?.isEnabled ??
          defaultGuestAvatarIsEnabled
        }
      >
        <Avatar
          src={props.theme.chat?.guestAvatar?.url}
          isChatContainerLight={isChatContainerLight({
            chatContainer: props.theme.chat?.container,
            generalBackground: props.theme.general?.background,
          })}
        />
      </Show>
    </div>
  );
};

const TextGuestBubble = (props: { answer: TextInputSubmitContent }) => {
  const [clickedImageSrc, setClickedImageSrc] = createSignal<string>();

  return (
    <div class="flex flex-col gap-1 items-end">
      <Show when={props.answer.cardSnapshots}>
        {(snapshots) => <CardSnapshotsRow snapshots={snapshots()} />}
      </Show>
      <Show
        when={props.answer.cardSnapshot}
        fallback={
          <>
            <Show when={(props.answer.attachments ?? []).length > 0}>
              <div class="flex gap-1 overflow-auto max-w-[350px] flex-wrap justify-end @xs:items-center @xs:flex-nowrap">
                <For
                  each={props.answer.attachments?.filter((attachment) =>
                    attachment.type.startsWith("image"),
                  )}
                >
                  {(attachment, idx) => (
                    <button
                      type="button"
                      class="border-none bg-transparent p-0"
                      aria-label={`Open attachment ${idx() + 1}`}
                      onClick={() =>
                        setClickedImageSrc(attachment.blobUrl ?? attachment.url)
                      }
                    >
                      <img
                        src={attachment.blobUrl ?? attachment.url}
                        alt=""
                        class={cx(
                          "typebot-guest-bubble-image-attachment cursor-pointer",
                          props.answer.attachments!.filter((attachment) =>
                            attachment.type.startsWith("image"),
                          ).length > 1 && "max-w-[90%]",
                        )}
                      />
                    </button>
                  )}
                </For>
              </div>
              <div class="flex gap-1 overflow-auto max-w-[350px] flex-wrap justify-end @xs:items-center @xs:flex-nowrap">
                <For
                  each={props.answer.attachments?.filter(
                    (attachment) => !attachment.type.startsWith("image"),
                  )}
                >
                  {(attachment) => (
                    <FilePreview
                      file={{
                        name: attachment.url.split("/").at(-1)!,
                      }}
                    />
                  )}
                </For>
              </div>
            </Show>
            <div
              class="p-px whitespace-pre-wrap max-w-full typebot-guest-bubble flex flex-col"
              data-testid="guest-bubble"
            >
              <Show when={isNotEmpty(props.answer.label ?? props.answer.value)}>
                <span class="px-[15px] py-[7px]">
                  {props.answer.label ?? props.answer.value}
                </span>
              </Show>
            </div>
          </>
        }
      >
        {(snapshot) => <CardSnapshotGuestBubble snapshot={snapshot()} />}
      </Show>
      <Modal
        isOpen={clickedImageSrc() !== undefined}
        onClose={() => setClickedImageSrc(undefined)}
      >
        <img
          src={clickedImageSrc()}
          alt="Attachment"
          class="max-h-[calc(100vh-1rem)] max-w-[calc(100%-1rem)] rounded-[6px] m-auto"
        />
      </Modal>
    </div>
  );
};

const CardSnapshotsRow = (props: { snapshots: CardSnapshot[] }) => {
  return (
    <div class="flex gap-2 overflow-x-auto max-w-full pb-1">
      <For each={props.snapshots}>
        {(snapshot) => (
          <div class="typebot-card flex flex-col text-host-bubble-text bg-host-bubble-bg border-host-bubble-border border-host-bubble rounded-host-bubble shadow-host-bubble filter-host-bubble overflow-hidden border w-[160px] shrink-0">
            <Show when={snapshot.imageUrl}>
              {(imageUrl) => (
                <img
                  src={imageUrl()}
                  alt={snapshot.title ?? "Card"}
                  class="aspect-16/11 object-cover"
                />
              )}
            </Show>
            <div
              class="flex flex-col gap-1 pb-2"
              style={{ "padding-top": snapshot.imageUrl ? undefined : "8px" }}
            >
              <Show when={snapshot.title}>
                {(title) => (
                  <h2 class="px-3 pt-1 font-semibold text-xs line-clamp-2">
                    {title()}
                  </h2>
                )}
              </Show>
              <Show when={snapshot.description}>
                {(description) => (
                  <p class="px-3 text-xs line-clamp-3">{description()}</p>
                )}
              </Show>
              <For each={snapshot.extraDescriptions}>
                {(desc) => <p class="px-3 text-xs line-clamp-3">{desc}</p>}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

const CardSnapshotGuestBubble = (props: { snapshot: CardSnapshot }) => {
  const remainingPaths = () =>
    (props.snapshot.paths ?? []).filter(
      (_, i) => i !== props.snapshot.selectedPathIndex,
    );

  return (
    <div class="typebot-card flex flex-col text-host-bubble-text bg-host-bubble-bg border-host-bubble-border border-host-bubble rounded-host-bubble shadow-host-bubble filter-host-bubble overflow-hidden border w-[220px]">
      <Show when={props.snapshot.imageUrl}>
        {(imageUrl) => (
          <img
            src={imageUrl()}
            alt={props.snapshot.title ?? "Card"}
            class="aspect-16/11 object-cover"
          />
        )}
      </Show>
      <div
        class="flex flex-col gap-1"
        style={{ "padding-top": props.snapshot.imageUrl ? undefined : "12px" }}
      >
        <Show when={props.snapshot.title}>
          {(title) => (
            <h2 class="px-4 pt-2 font-semibold text-sm line-clamp-2">
              {title()}
            </h2>
          )}
        </Show>
        <Show when={props.snapshot.description}>
          {(description) => (
            <p class="px-4 text-sm line-clamp-3">{description()}</p>
          )}
        </Show>
        <For each={props.snapshot.extraDescriptions}>
          {(desc) => <p class="px-4 text-sm line-clamp-3">{desc}</p>}
        </For>
      </div>
      <Show when={remainingPaths().length > 0}>
        <div class="px-3 pt-2 pb-2">
          <For each={remainingPaths()}>
            {(path, idx) => (
              <SnapshotPathButton
                path={path}
                isFirst={idx() === 0}
                isLast={idx() === remainingPaths().length - 1}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

const SnapshotPathButton = (props: {
  path: CardSnapshotPath;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const sharedClass = cx(
    "w-full font-normal border-host-bubble-border flex items-center justify-center text-center text-sm px-3 py-1.5",
    props.isFirst && "rounded-t-host-bubble border border-b-0",
    !props.isFirst && "border border-b-0",
    props.isLast && "rounded-b-host-bubble border-b",
  );

  return (
    <Show
      when={props.path.type === "link" && props.path.linkUrl}
      fallback={
        <div
          class={cx(
            sharedClass,
            "bg-host-bubble-bg text-host-bubble-text opacity-60",
          )}
        >
          {props.path.text}
        </div>
      }
    >
      <a
        href={props.path.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        class={cx(
          sharedClass,
          "bg-host-bubble-bg text-host-bubble-text hover:brightness-95 no-underline",
        )}
      >
        {props.path.text}
      </a>
    </Show>
  );
};

const AudioGuestBubble = (props: { answer: RecordingInputSubmitContent }) => {
  return (
    <div class="flex flex-col gap-1 items-end">
      <div
        class="p-2 w-full whitespace-pre-wrap typebot-guest-bubble flex flex-col"
        data-testid="guest-bubble"
      >
        {/* biome-ignore lint/a11y/useMediaCaption: Captions are not available for user-submitted recordings. */}
        <audio controls src={props.answer.blobUrl ?? props.answer.url} />
      </div>
    </div>
  );
};
