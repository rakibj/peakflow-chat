import {
  defaultChatHeaderBackgroundColor,
  defaultChatHeaderTextColor,
} from "@typebot.io/theme/constants";
import type { ChatHeader, ChatTheme } from "@typebot.io/theme/schemas";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { Switch } from "@typebot.io/ui/components/Switch";
import { ColorPicker } from "@/components/ColorPicker";

type Props = {
  header: ChatTheme["header"];
  onHeaderChange: (header: ChatHeader) => void;
};

export const ChatHeaderForm = ({ header, onHeaderChange }: Props) => {
  const isEnabled = header?.isEnabled ?? false;

  const update = (patch: Partial<ChatHeader>) =>
    onHeaderChange({ ...header, isEnabled: true, ...patch });

  return (
    <div className="flex flex-col border rounded-md p-4 gap-4">
      <Field.Root className="flex-row items-center">
        <Field.Label className="font-medium font-heading text-lg">
          Header
        </Field.Label>
        <Switch
          checked={isEnabled}
          id="chat-header-enabled"
          onCheckedChange={(checked) =>
            onHeaderChange({ ...header, isEnabled: checked })
          }
        />
      </Field.Root>
      {isEnabled && (
        <>
          <Field.Root className="flex-row items-center">
            <Field.Label>Name</Field.Label>
            <Input
              size="sm"
              placeholder="AI Assistant"
              defaultValue={header?.name}
              onValueChange={(name) => update({ name })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Status</Field.Label>
            <Input
              size="sm"
              placeholder="Online"
              defaultValue={header?.status}
              onValueChange={(status) => update({ status })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Tagline</Field.Label>
            <Input
              size="sm"
              placeholder="Typically replies instantly"
              defaultValue={header?.tagline}
              onValueChange={(tagline) => update({ tagline })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Background</Field.Label>
            <ColorPicker
              value={
                header?.backgroundColor ?? defaultChatHeaderBackgroundColor
              }
              onColorChange={(backgroundColor) => update({ backgroundColor })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Text color</Field.Label>
            <ColorPicker
              value={header?.textColor ?? defaultChatHeaderTextColor}
              onColorChange={(textColor) => update({ textColor })}
            />
          </Field.Root>
        </>
      )}
    </div>
  );
};
