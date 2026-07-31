import { defaultLinkBubbleContent } from "@typebot.io/blocks-bubbles/link/constants";
import type { LinkBubbleBlock } from "@typebot.io/blocks-bubbles/link/schema";
import { Field } from "@typebot.io/ui/components/Field";
import { Switch } from "@typebot.io/ui/components/Switch";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";

type Props = {
  block: LinkBubbleBlock;
  onContentChange: (content: LinkBubbleBlock["content"]) => void;
};

export const LinkBubbleSettings = ({ block, onContentChange }: Props) => {
  const updateLabel = (label: string) =>
    onContentChange({ ...block.content, label });

  const updateUrl = (url: string) => onContentChange({ ...block.content, url });

  const updateOpenInNewTab = (openInNewTab: boolean) =>
    onContentChange({ ...block.content, openInNewTab });

  const updateShowPreview = (showPreview: boolean) =>
    onContentChange({ ...block.content, showPreview });

  const updatePreviewFallbackUrl = (previewFallbackUrl: string) =>
    onContentChange({ ...block.content, previewFallbackUrl });

  const updatePreviewTitle = (previewTitle: string) =>
    onContentChange({ ...block.content, previewTitle });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Field.Root>
          <Field.Label>Label</Field.Label>
          <DebouncedTextInputWithVariablesButton
            placeholder="Click here"
            defaultValue={block.content?.label ?? ""}
            onValueChange={updateLabel}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>URL</Field.Label>
          <DebouncedTextInputWithVariablesButton
            placeholder="https://example.com"
            defaultValue={block.content?.url ?? ""}
            onValueChange={updateUrl}
          />
        </Field.Root>
      </div>
      <Field.Root className="flex-row items-center">
        <Switch
          checked={
            block.content?.openInNewTab ?? defaultLinkBubbleContent.openInNewTab
          }
          onCheckedChange={updateOpenInNewTab}
        />
        <Field.Label>Open in new tab</Field.Label>
      </Field.Root>
      <Field.Root className="flex-row items-center">
        <Switch
          checked={block.content?.showPreview ?? false}
          onCheckedChange={updateShowPreview}
        />
        <Field.Label>Show link preview</Field.Label>
      </Field.Root>
      {block.content?.showPreview && (
        <div className="flex flex-col gap-3">
          <Field.Root>
            <Field.Label>Preview title</Field.Label>
            <Field.Description>Overrides the fetched title</Field.Description>
            <DebouncedTextInputWithVariablesButton
              placeholder="🛒 Check out this product"
              defaultValue={block.content?.previewTitle ?? ""}
              onValueChange={updatePreviewTitle}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Preview fallback URL</Field.Label>
            <Field.Description>
              Used when the main URL has no preview data
            </Field.Description>
            <DebouncedTextInputWithVariablesButton
              placeholder="https://store.example.com"
              defaultValue={block.content?.previewFallbackUrl ?? ""}
              onValueChange={updatePreviewFallbackUrl}
            />
          </Field.Root>
        </div>
      )}
    </div>
  );
};
