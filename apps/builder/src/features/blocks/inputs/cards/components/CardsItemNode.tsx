import { createId } from "@paralleldrive/cuid2";
import { useTranslate } from "@tolgee/react";
import type {
  Item,
  ItemIndices,
} from "@typebot.io/blocks-core/schemas/items/schema";
import type {
  CardsItem,
  CardsItemPath,
} from "@typebot.io/blocks-inputs/cards/schema";
import { Button } from "@typebot.io/ui/components/Button";
import { Editable } from "@typebot.io/ui/components/Editable";
import { Popover } from "@typebot.io/ui/components/Popover";
import { Cancel01Icon } from "@typebot.io/ui/icons/Cancel01Icon";
import { Link02Icon } from "@typebot.io/ui/icons/Link02Icon";
import { Mouse01Icon } from "@typebot.io/ui/icons/Mouse01Icon";
import { Settings01Icon } from "@typebot.io/ui/icons/Settings01Icon";
import { cn } from "@typebot.io/ui/lib/cn";
import { cx } from "@typebot.io/ui/lib/cva";
import { useState } from "react";
import { ImageOrPlaceholder } from "@/components/ImageOrPlaceholder";
import { ImageUploadContent } from "@/components/ImageUploadContent/ImageUploadContent";
import {
  GhostableItem,
  StacksWithGhostableItems,
} from "@/components/StackWithGhostableItems";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { PlaceholderNode } from "@/features/graph/components/nodes/PlaceholderNode";
import { useGraph } from "@/features/graph/providers/GraphProvider";
import { CardsItemSettings } from "./CardsItemSettings";

type Props = {
  item: CardsItem;
  indices: ItemIndices;
  isMouseOver: boolean;
};

export const CardsItemNode = ({ item, indices, isMouseOver }: Props) => {
  const { t } = useTranslate();
  const { typebot } = useTypebot();
  const { updateItem, deleteItemPath } = useTypebot();
  const { openedNodeId, setOpenedNodeId } = useGraph();

  const updateTitle = (value: string | null | undefined) => {
    updateItem(indices, {
      title: value,
    } as Item);
  };

  const updateDescription = (value: string | null | undefined) => {
    updateItem(indices, {
      description: value,
    } as Item);
  };

  const updateItemSettings = (options: CardsItem["options"]) => {
    updateItem(indices, { ...item, options } as Item);
  };

  const updateImage = (url: string | null | undefined) => {
    updateItem(indices, { ...item, imageUrl: url } as Item);
  };

  const addPath = () => {
    updateItem(indices, {
      paths: [...(item.paths ?? []), { id: createId() }],
    } as Item);
  };

  const deletePath = (idx: number) => {
    deleteItemPath({
      ...indices,
      pathIndex: idx,
    });
  };

  const updatePathText = (idx: number, value: string) => {
    updateItem(indices, {
      paths: item.paths?.map((path, i) =>
        i === idx ? { ...path, text: value } : path,
      ),
    } as Item);
  };

  const togglePathType = (idx: number) => {
    updateItem(indices, {
      paths: item.paths?.map((path, i) => {
        if (i !== idx) return path;
        const nextType: CardsItemPath["type"] =
          path.type === "link" ? "player-choice" : "link";
        return { ...path, type: nextType };
      }),
    } as Item);
  };

  const updatePathLinkUrl = (idx: number, value: string) => {
    updateItem(indices, {
      paths: item.paths?.map((path, i) =>
        i === idx ? { ...path, linkUrl: value } : path,
      ),
    } as Item);
  };

  const addExtraDescription = () => {
    updateItem(indices, {
      extraDescriptions: [...(item.extraDescriptions ?? []), ""],
    } as Item);
  };

  const updateExtraDescription = (idx: number, value: string) => {
    updateItem(indices, {
      extraDescriptions: item.extraDescriptions?.map((d, i) =>
        i === idx ? value : d,
      ),
    } as Item);
  };

  const deleteExtraDescription = (idx: number) => {
    updateItem(indices, {
      extraDescriptions: item.extraDescriptions?.filter((_, i) => i !== idx),
    } as Item);
  };

  return (
    <Popover.Root
      isOpen={openedNodeId === item.id}
      onOpen={(event) => {
        if (event?.type === "click") return;
        setOpenedNodeId(item.id);
      }}
      onClose={() => setOpenedNodeId(undefined)}
    >
      <Popover.Trigger
        render={(props) => (
          <div className="flex flex-col gap-0 justify-center w-full" {...props}>
            <StacksWithGhostableItems gapPixel={8}>
              <GhostableItem
                ghostLabel="Add image"
                onGhostClick={() => {
                  updateImage(undefined);
                }}
              >
                {item.imageUrl !== null ? (
                  <Popover.Root
                    isOpen={
                      openedNodeId === `${item.id}-${indices.itemIndex}-image`
                    }
                    onOpen={() =>
                      setOpenedNodeId(`${item.id}-${indices.itemIndex}-image`)
                    }
                    onClose={() => setOpenedNodeId(undefined)}
                  >
                    <Popover.Trigger>
                      <ImageOrPlaceholder
                        className="w-full h-[110px] shrink-0 transition-filter rounded-md hover:brightness-95 rounded-b-none"
                        src={item.imageUrl ?? undefined}
                      />
                    </Popover.Trigger>
                    <Popover.Popup side="right" className="max-w-[400px]">
                      {typebot && (
                        <ImageUploadContent
                          uploadFileProps={{
                            workspaceId: typebot?.workspaceId,
                            typebotId: typebot?.id,
                            blockId: item.id,
                            itemId: item.id,
                          }}
                          defaultUrl={item.imageUrl ?? undefined}
                          onSubmit={(url) => {
                            updateImage(url);
                          }}
                          onDelete={() => {
                            updateImage(null);
                          }}
                          additionalTabs={{
                            giphy: true,
                            unsplash: true,
                          }}
                        />
                      )}
                    </Popover.Popup>
                  </Popover.Root>
                ) : null}
              </GhostableItem>
              <GhostableItem
                ghostLabel="Add title"
                onGhostClick={() => {
                  updateTitle(undefined);
                }}
                className="mx-2"
              >
                {item.title !== null ? (
                  <SingleLineDeletableEditable
                    className={cx(
                      "flex-1 text-sm font-semibold px-2",
                      item.description !== null && "-mb-2",
                    )}
                    defaultValue={item.title ?? "Title"}
                    defaultEdit={item.title === undefined}
                    onValueCommit={updateTitle}
                    onDelete={() => updateTitle(null)}
                  />
                ) : null}
              </GhostableItem>
              <GhostableItem
                ghostLabel="Add description"
                onGhostClick={() => {
                  updateDescription(undefined);
                }}
                className="mx-2"
              >
                {item.description !== null ? (
                  <MultiLineDeletableEditable
                    className={cx("flex-1 text-xs mb-2 px-2")}
                    defaultValue={item.description ?? "Description"}
                    defaultEdit={item.description === undefined}
                    onValueCommit={updateDescription}
                    onDelete={() => updateDescription(null)}
                  />
                ) : null}
              </GhostableItem>
            </StacksWithGhostableItems>

            {item.extraDescriptions && item.extraDescriptions.length > 0 && (
              <div className="flex flex-col mx-2 -mt-1">
                {item.extraDescriptions.map((desc, extraIdx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: list only grows/shrinks at the end
                    key={`extra-desc-${extraIdx}`}
                    className="relative group"
                  >
                    <MultiLineDeletableEditable
                      className={cx("flex-1 text-xs mb-2 px-2 pr-6")}
                      defaultValue={desc || "Extra description"}
                      defaultEdit={desc === ""}
                      onValueCommit={(value) =>
                        updateExtraDescription(extraIdx, value)
                      }
                      onDelete={() => deleteExtraDescription(extraIdx)}
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-9 hover:text-red-500 transition-opacity"
                      onClick={() => deleteExtraDescription(extraIdx)}
                    >
                      <Cancel01Icon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className="mx-2 mb-1 text-left text-xs text-gray-9 hover:text-gray-12"
              onClick={addExtraDescription}
            >
              + Add description
            </button>

            <div className="flex flex-col gap-0 px-2">
              {item.paths?.map((path, idx) => {
                const isLink = path.type === "link";
                const isLastPath = idx === (item.paths?.length ?? 1) - 1;
                return (
                  <div key={path.id} className="flex flex-col">
                    <SingleLineDeletableEditable
                      defaultValue={path.text ?? "Button"}
                      defaultEdit={path.text === undefined}
                      className={cn("relative")}
                      inputClassName={cn(
                        "justify-center text-center text-sm relative border-gray-6 rounded-none",
                        idx === 0 && "rounded-t-md border-b-0",
                        idx !== 0 && "border border-b-0",
                        isLastPath && !isLink && "rounded-b-md border-b",
                        isLastPath && isLink && "border-b-0",
                      )}
                      previewClassName={cn(
                        "justify-center text-center text-sm relative border-gray-6 rounded-none",
                        idx === 0 && "rounded-t-md border-b-0",
                        idx !== 0 && "border border-b-0",
                        isLastPath && !isLink && "rounded-b-md border-b",
                        isLastPath && isLink && "border-b-0",
                      )}
                      onValueCommit={(value) => updatePathText(idx, value)}
                      onDelete={() => deletePath(idx)}
                    >
                      <button
                        type="button"
                        title={
                          isLink ? "Switch to player choice" : "Switch to link"
                        }
                        className="absolute left-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-9 hover:text-gray-12 hover:bg-gray-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePathType(idx);
                        }}
                      >
                        {isLink ? (
                          <Link02Icon className="w-3 h-3" />
                        ) : (
                          <Mouse01Icon className="w-3 h-3" />
                        )}
                      </button>
                    </SingleLineDeletableEditable>
                    {isLink && (
                      <LinkUrlInput
                        value={path.linkUrl ?? ""}
                        isLast={isLastPath}
                        onChange={(value) => updatePathLinkUrl(idx, value)}
                      />
                    )}
                  </div>
                );
              })}
              <PlaceholderNode
                hitboxYExtensionPixels={5}
                expandedHeightPixels={30}
                initialPaddingPixel={0}
                expandedPaddingPixel={0}
                className="text-xs font-medium rounded-t-none"
                onClick={addPath}
              >
                Add button
              </PlaceholderNode>
            </div>

            {isMouseOver && (
              <div className="flex rounded-md bg-gray-1 absolute -right-1 -top-1 z-10 animate-in fade-in-0 slide-in-from-top-1 slide-in-from-right-1">
                <Button
                  aria-label={t("blocks.inputs.button.openSettings.ariaLabel")}
                  variant="ghost"
                  size="icon"
                  className="shadow-md size-7"
                  onClick={() => setOpenedNodeId(item.id)}
                >
                  <Settings01Icon />
                </Button>
              </div>
            )}
          </div>
        )}
      />
      <Popover.Popup side="right" className="p-4">
        <CardsItemSettings
          options={item.options}
          onSettingsChange={updateItemSettings}
        />
      </Popover.Popup>
    </Popover.Root>
  );
};

const SingleLineDeletableEditable = ({
  defaultValue,
  className,
  defaultEdit,
  children,
  previewClassName,
  inputClassName,
  onValueCommit,
  onDelete,
}: {
  defaultValue: string;
  className?: string;
  defaultEdit?: boolean;
  children?: React.ReactNode;
  previewClassName?: string;
  inputClassName?: string;
  onValueCommit: (value: string) => void;
  onDelete: () => void;
}) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <Editable.Root
      className={className}
      value={value}
      defaultEdit={defaultEdit}
      onValueChange={setValue}
      onValueCommit={() => onValueCommit(value)}
    >
      <Editable.Input
        className={inputClassName}
        onKeyDownCapture={(e: React.KeyboardEvent) => {
          if (e.key === "Backspace" && value === "") onDelete();
        }}
      />
      <Editable.Preview className={previewClassName} />
      {children}
    </Editable.Root>
  );
};

const LinkUrlInput = ({
  value,
  isLast,
  onChange,
}: {
  value: string;
  isLast: boolean;
  onChange: (value: string) => void;
}) => {
  const [localValue, setLocalValue] = useState(value);
  return (
    <input
      type="text"
      placeholder="https://..."
      value={localValue}
      className={cn(
        "w-full text-xs px-2 py-1 border border-gray-6 bg-gray-1 text-gray-11 placeholder:text-gray-8 focus:outline-none focus:ring-1 focus:ring-blue-500",
        isLast ? "rounded-b-md border-t-0" : "border-t-0",
      )}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
    />
  );
};

const MultiLineDeletableEditable = ({
  defaultValue,
  className,
  defaultEdit,
  onValueCommit,
  onDelete,
}: {
  defaultValue: string;
  className?: string;
  defaultEdit?: boolean;
  onValueCommit: (value: string) => void;
  onDelete: () => void;
}) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <Editable.Root
      className={className}
      value={value}
      defaultEdit={defaultEdit}
      onValueChange={setValue}
      onValueCommit={() => onValueCommit(value)}
    >
      <Editable.Textarea
        onKeyDownCapture={(e: React.KeyboardEvent) => {
          if (e.key === "Backspace" && value === "") onDelete();
        }}
      />
      <Editable.Preview />
    </Editable.Root>
  );
};
