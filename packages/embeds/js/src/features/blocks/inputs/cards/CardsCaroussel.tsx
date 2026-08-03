import type { CardsBlock } from "@typebot.io/blocks-inputs/cards/schema";
import { cn } from "@typebot.io/ui/lib/cn";
import { createMemo, createSignal, For, Index, type JSX, Show } from "solid-js";
import { Button } from "../../../../components/Button";
import { Carousel } from "../../../../components/carousel";
import { ArrowLeftIcon } from "../../../../components/icons/ArrowLeftIcon";
import { ArrowRightIcon } from "../../../../components/icons/ArrowRightIcon";
import { ShortTextInput } from "../../../../components/inputs/ShortTextInput";
import { SendButton } from "../../../../components/SendButton";
import type { ChatContainerSize } from "../../../../constants";
import { useChatContainerSize } from "../../../../contexts/ChatContainerSizeContext";
import type { InputSubmitContent } from "../../../../types";

type Props = {
  block: CardsBlock;
  onSubmit: (value: InputSubmitContent) => void;
  onTransitionEnd: () => void;
};

export const CardsCaroussel = (props: Props) => {
  const [freeTextValue, setFreeTextValue] = createSignal("");

  const submitFreeText = (e: Event) => {
    e.preventDefault();
    const value = freeTextValue().trim();
    if (!value) return;
    props.onSubmit({
      type: "text",
      value,
      metadata: { isFreeText: true },
      cardSnapshots: props.block.items.map((item) => ({
        imageUrl: item.imageUrl,
        title: item.title,
        description: item.description,
        extraDescriptions: item.extraDescriptions,
      })),
    });
  };

  const onButtonClick = (itemIndex: number, pathIndex: number) => {
    const item = props.block.items[itemIndex];
    const pathId = item.paths?.[pathIndex]?.id;
    const pathText = item.paths?.[pathIndex]?.text;
    props.onSubmit({
      type: "text",
      value: pathId ?? pathText ?? "",
      label: pathText ?? "",
      metadata: {
        replyId: pathId,
      },
      cardSnapshot: {
        imageUrl: item.imageUrl,
        title: item.title,
        description: item.description,
        extraDescriptions: item.extraDescriptions,
        selectedButtonText: pathText,
        paths: item.paths?.map((p) => ({
          text: p.text,
          type: p.type,
          linkUrl: p.linkUrl,
        })),
        selectedPathIndex: pathIndex,
      },
    });
  };

  const chatContainerSize = useChatContainerSize();

  const slidesPerPage = createMemo(() => {
    return computeSlidesPerPage(props.block.items.length, {
      containerSize: chatContainerSize(),
    });
  });

  const fontSizes = createMemo(() => {
    const size = chatContainerSize();
    if (size === "xs" || size === "sm")
      return { title: "text-xs", body: "text-xs", button: "text-xs" };
    return { title: "text-sm", body: "text-sm", button: "text-sm" };
  });

  return (
    <div dir="auto" class="flex flex-col gap-2 w-full">
      <Show when={props.block.items.length > 0}>
        <Carousel.Root
          slideCount={props.block.items.length}
          slidesPerPage={slidesPerPage()}
          slidesPerMove={1}
          spacing="12px"
          class="overflow-hidden @xs:-mx-5 -mx-4"
        >
          <div
            class="flex justify-end mb-2"
            style={{
              display:
                props.block.items.length > slidesPerPage() ? undefined : "none",
            }}
          >
            <Carousel.Control class="flex gap-2 @xs:me-5 me-4">
              <Carousel.PrevTrigger
                asChild={(props) => (
                  <Button variant="secondary" {...props}>
                    <ArrowLeftIcon class="w-4 h-4" />
                  </Button>
                )}
              />
              <Carousel.NextTrigger
                asChild={(props) => (
                  <Button variant="secondary" {...props}>
                    <ArrowRightIcon class="w-4 h-4" />
                  </Button>
                )}
              />
            </Carousel.Control>
          </div>
          <Carousel.ItemGroup class="@xs:px-5 px-4">
            <Index each={props.block.items}>
              {(item, index) => (
                <Carousel.Item index={index}>
                  <Card class="border h-full">
                    <div
                      class="flex flex-col gap-3"
                      style={{
                        "padding-top": item().imageUrl ? undefined : "12px",
                      }}
                    >
                      <Show when={item().imageUrl}>
                        {(imageUrl) => (
                          <img
                            src={imageUrl()}
                            alt={item().title ?? `Card ${index + 1}`}
                            class="aspect-16/11 object-cover"
                          />
                        )}
                      </Show>
                      <div class="flex flex-col gap-1">
                        <Show when={item().title}>
                          {(title) => (
                            <h2
                              class={cn(
                                "px-4 font-semibold line-clamp-2",
                                fontSizes().title,
                              )}
                            >
                              {title()}
                            </h2>
                          )}
                        </Show>
                        <Show when={item().description}>
                          {(description) => (
                            <p
                              class={cn("px-4 line-clamp-3", fontSizes().body)}
                            >
                              {description()}
                            </p>
                          )}
                        </Show>
                        <For each={item().extraDescriptions}>
                          {(desc) => (
                            <p class={cn("px-4", fontSizes().body)}>{desc}</p>
                          )}
                        </For>
                      </div>
                    </div>

                    <div class="px-3 pt-2 pb-2 mt-auto">
                      <For each={item().paths}>
                        {(path, idx) => {
                          const sharedClass = cn(
                            "w-full font-normal border-host-bubble-border rounded-none flex items-center justify-center text-center",
                            fontSizes().button,
                            idx() === 0 &&
                              "rounded-t-host-bubble border border-b-0",
                            idx() !== 0 && "border border-b-0",
                            idx() === (item().paths?.length ?? 1) - 1 &&
                              "rounded-b-host-bubble border-b",
                          );
                          return (
                            <Show
                              when={path.type === "link"}
                              fallback={
                                <Button
                                  variant="secondary"
                                  class={sharedClass}
                                  size="sm"
                                  on:click={() => onButtonClick(index, idx())}
                                >
                                  {path.text}
                                </Button>
                              }
                            >
                              <a
                                href={path.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                class={cn(
                                  sharedClass,
                                  "bg-host-bubble-bg text-host-bubble-text hover:brightness-95 px-3 py-1.5 no-underline",
                                )}
                              >
                                {path.text}
                              </a>
                            </Show>
                          );
                        }}
                      </For>
                    </div>
                  </Card>
                </Carousel.Item>
              )}
            </Index>
          </Carousel.ItemGroup>
        </Carousel.Root>
      </Show>
      <Show when={props.block.options?.freeTextInput?.enabled}>
        <form class="flex w-full gap-2 items-end" onSubmit={submitFreeText}>
          <div class="typebot-input flex-1">
            <ShortTextInput
              onInput={setFreeTextValue}
              value={freeTextValue()}
              placeholder={
                props.block.options?.freeTextInput?.placeholder ?? ""
              }
            />
          </div>
          <SendButton type="submit" class="h-14" />
        </form>
      </Show>
      <Show when={props.block.options?.skipButton?.enabled}>
        <Button
          variant="secondary"
          class="w-full"
          on:click={() =>
            props.onSubmit({
              type: "text",
              value: props.block.options?.skipButton?.label || "Skip",
              metadata: { isSkip: true },
            })
          }
        >
          {props.block.options?.skipButton?.label || "Skip"}
        </Button>
      </Show>
    </div>
  );
};

const Card = (props: { children: JSX.Element; class?: string }) => {
  return (
    <div
      class={cn(
        "typebot-card flex flex-col text-host-bubble-text bg-host-bubble-bg border-host-bubble-border border-host-bubble rounded-host-bubble shadow-host-bubble filter-host-bubble overflow-hidden",
        props.class,
      )}
    >
      {props.children}
    </div>
  );
};

const computeSlidesPerPage = (
  totalCards: number,
  { containerSize }: { containerSize: ChatContainerSize },
) => {
  if (containerSize === "xs") {
    return totalCards > 2 ? 2.1 : totalCards;
  }
  if (containerSize === "sm") {
    return totalCards > 2 ? 2.3 : totalCards;
  }
  if (containerSize === "md" || containerSize === "lg") {
    return totalCards > 2 ? 2.2 : totalCards;
  }
  return totalCards > 3 ? 3.2 : totalCards; // xl
};
