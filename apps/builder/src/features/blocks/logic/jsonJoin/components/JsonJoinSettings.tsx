import type { JsonJoinBlock } from "@typebot.io/blocks-logic/jsonJoin/schema";
import { DebouncedTextInput } from "@typebot.io/ui/components/DebouncedTextInput";
import { Field } from "@typebot.io/ui/components/Field";
import { Switch } from "@typebot.io/ui/components/Switch";
import type { Variable } from "@typebot.io/variables/schemas";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";

type Props = {
  options: JsonJoinBlock["options"];
  onOptionsChange: (options: JsonJoinBlock["options"]) => void;
};

export const JsonJoinSettings = ({ options, onOptionsChange }: Props) => {
  const input1Mode = options?.input1Mode ?? "array";
  const isValueMode = input1Mode === "value";

  const updateVar1 = (variable?: Pick<Variable, "id">) =>
    onOptionsChange({ ...options, inputVariable1Id: variable?.id });

  const updateVar2 = (variable?: Pick<Variable, "id">) =>
    onOptionsChange({ ...options, inputVariable2Id: variable?.id });

  const updateOutputVar = (variable?: Pick<Variable, "id">) =>
    onOptionsChange({ ...options, outputVariableId: variable?.id });

  const toggleInput1Mode = (checked: boolean) =>
    onOptionsChange({
      ...options,
      input1Mode: checked ? "value" : "array",
      matchKey1: checked ? undefined : options?.matchKey1,
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-end">
          <Field.Root className="flex-1">
            <Field.Label>
              {isValueMode ? "Match value:" : "Array 1:"}
            </Field.Label>
            <VariablesCombobox
              initialVariableId={options?.inputVariable1Id}
              onSelectVariable={updateVar1}
              placeholder="Select variable"
            />
          </Field.Root>
          {!isValueMode && (
            <Field.Root className="w-1/3">
              <Field.Label>Key:</Field.Label>
              <DebouncedTextInput
                defaultValue={options?.matchKey1 ?? ""}
                placeholder="e.g. id"
                onValueChange={(matchKey1) =>
                  onOptionsChange({ ...options, matchKey1 })
                }
              />
            </Field.Root>
          )}
        </div>
        <label
          htmlFor="json-join-value-mode"
          className="flex items-center gap-2 text-xs text-gray-10 cursor-pointer select-none"
        >
          <Switch
            id="json-join-value-mode"
            checked={isValueMode}
            onCheckedChange={toggleInput1Mode}
          />
          Single value (not a JSON array)
        </label>
      </div>
      <div className="flex gap-2 items-end">
        <Field.Root className="flex-1">
          <Field.Label>Array 2:</Field.Label>
          <VariablesCombobox
            initialVariableId={options?.inputVariable2Id}
            onSelectVariable={updateVar2}
            placeholder="Select variable"
          />
        </Field.Root>
        <Field.Root className="w-1/3">
          <Field.Label>Key:</Field.Label>
          <DebouncedTextInput
            defaultValue={options?.matchKey2 ?? ""}
            placeholder="e.g. userId"
            onValueChange={(matchKey2) =>
              onOptionsChange({ ...options, matchKey2 })
            }
          />
        </Field.Root>
      </div>
      <Field.Root>
        <Field.Label>Output variable:</Field.Label>
        <VariablesCombobox
          initialVariableId={options?.outputVariableId}
          onSelectVariable={updateOutputVar}
          placeholder="Select variable"
        />
      </Field.Root>
      <p className="text-xs text-gray-9">
        Returns items from <strong>Array 2</strong> whose key value matches{" "}
        {isValueMode ? (
          <>
            the value of <strong>Match value</strong>
          </>
        ) : (
          <>
            any value of the key in <strong>Array 1</strong>
          </>
        )}
        .
      </p>
    </div>
  );
};
