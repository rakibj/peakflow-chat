import type { JsonRemapBlock } from "@typebot.io/blocks-logic/jsonRemap/schema";
import { DebouncedTextInput } from "@typebot.io/ui/components/DebouncedTextInput";
import { Field } from "@typebot.io/ui/components/Field";
import type { Variable } from "@typebot.io/variables/schemas";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";

type Props = {
  options: JsonRemapBlock["options"];
  onOptionsChange: (options: JsonRemapBlock["options"]) => void;
};

export const JsonRemapSettings = ({ options, onOptionsChange }: Props) => {
  const transformations = options?.transformations ?? [];
  const pickOnly = options?.pickOnly ?? false;

  const updateInputVar = (variable?: Pick<Variable, "id">) =>
    onOptionsChange({ ...options, inputVariableId: variable?.id });

  const updateOutputVar = (variable?: Pick<Variable, "id">) =>
    onOptionsChange({ ...options, outputVariableId: variable?.id });

  const updateKey = (index: number, key: string) => {
    const next = transformations.map((t, i) =>
      i === index ? { ...t, key } : t,
    );
    onOptionsChange({ ...options, transformations: next });
  };

  const updateExpression = (index: number, expression: string) => {
    const next = transformations.map((t, i) =>
      i === index ? { ...t, expression } : t,
    );
    onOptionsChange({ ...options, transformations: next });
  };

  const remove = (index: number) => {
    onOptionsChange({
      ...options,
      transformations: transformations.filter((_, i) => i !== index),
    });
  };

  const add = () =>
    onOptionsChange({
      ...options,
      transformations: [...transformations, { key: "", expression: "" }],
    });

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Input array variable:</Field.Label>
        <VariablesCombobox
          initialVariableId={options?.inputVariableId}
          onSelectVariable={updateInputVar}
          placeholder="Select variable"
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Output variable:</Field.Label>
        <VariablesCombobox
          initialVariableId={options?.outputVariableId}
          onSelectVariable={updateOutputVar}
          placeholder="Select variable"
        />
      </Field.Root>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={pickOnly}
          onChange={(e) =>
            onOptionsChange({ ...options, pickOnly: e.target.checked })
          }
        />
        <span className="text-sm">
          Pick fields only (exclude unlisted fields)
        </span>
      </label>
      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">
          {pickOnly ? "Fields to pick:" : "Transformations:"}
        </p>
        <p className="text-xs text-gray-9">
          {pickOnly
            ? "Only listed fields appear in the output. Leave expression blank to copy the value as-is."
            : "All fields are included. Listed fields will have their values transformed."}
        </p>
        {transformations.map((t, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: list only grows/shrinks at the end
          <div key={index} className="flex gap-2 items-center">
            <DebouncedTextInput
              className="w-1/3"
              defaultValue={t.key ?? ""}
              placeholder="field name"
              onValueChange={(key) => updateKey(index, key)}
            />
            <DebouncedTextInput
              className="flex-1"
              defaultValue={t.expression ?? ""}
              placeholder={
                pickOnly ? "$value expression (optional)" : "$value expression"
              }
              onValueChange={(expression) =>
                updateExpression(index, expression)
              }
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
          + Add {pickOnly ? "field" : "transformation"}
        </button>
      </div>
      <p className="text-xs text-gray-9">
        Each expression receives <code>$value</code> (current field),{" "}
        <code>$item</code> (whole object), <code>$index</code> (position).
      </p>
    </div>
  );
};
