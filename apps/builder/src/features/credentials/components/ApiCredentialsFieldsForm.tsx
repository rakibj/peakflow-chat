import type { ApiCredentials } from "@typebot.io/credentials/schemas";
import { DebouncedTextInput } from "@typebot.io/ui/components/DebouncedTextInput";
import { Field } from "@typebot.io/ui/components/Field";

type Props = {
  name: string;
  onNameChange: (name: string) => void;
  fields: ApiCredentials["data"]["fields"];
  onFieldsChange: (fields: ApiCredentials["data"]["fields"]) => void;
};

export const ApiCredentialsFieldsForm = ({
  name,
  onNameChange,
  fields,
  onFieldsChange,
}: Props) => {
  const updateKey = (index: number, key: string) =>
    onFieldsChange(
      fields.map((field, i) => (i === index ? { ...field, key } : field)),
    );

  const updateValue = (index: number, value: string) =>
    onFieldsChange(
      fields.map((field, i) => (i === index ? { ...field, value } : field)),
    );

  const remove = (index: number) =>
    onFieldsChange(fields.filter((_, i) => i !== index));

  const add = () => onFieldsChange([...fields, { key: "", value: "" }]);

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Name:</Field.Label>
        <DebouncedTextInput
          defaultValue={name}
          placeholder="e.g. Shopify secrets"
          onValueChange={onNameChange}
        />
      </Field.Root>
      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Secrets:</p>
        <p className="text-xs text-gray-9">
          Each key becomes a property on the <code>credentials</code> object
          available in server-executed Code blocks (e.g.{" "}
          <code>credentials.SHOPIFY_TOKEN</code>). Values are encrypted at rest
          and never appear in exported flows.
        </p>
        {fields.map((field, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: list only grows/shrinks at the end
          <div key={index} className="flex gap-2 items-center">
            <DebouncedTextInput
              className="w-1/3"
              defaultValue={field.key}
              placeholder="KEY"
              onValueChange={(key) => updateKey(index, key)}
            />
            <DebouncedTextInput
              className="flex-1"
              defaultValue={field.value}
              placeholder="value"
              type="password"
              onValueChange={(value) => updateValue(index, value)}
            />
            <button
              type="button"
              className="text-gray-9 hover:text-gray-12 shrink-0"
              onClick={() => remove(index)}
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-blue-9 hover:text-blue-11 self-start"
          onClick={add}
        >
          + Add secret
        </button>
      </div>
    </div>
  );
};
