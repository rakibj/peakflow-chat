import { cardMappableFields } from "@typebot.io/blocks-inputs/cards/constants";
import type { CardsBlock } from "@typebot.io/blocks-inputs/cards/schema";
import type { Variable } from "@typebot.io/variables/schemas";
import { useRef } from "react";
import { BasicSelect } from "@/components/inputs/BasicSelect";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { TableList, type TableListItemProps } from "@/components/TableList";

type Props = {
  options?: CardsBlock["options"];
  onOptionsChange: (options: CardsBlock["options"]) => void;
};

type DynamicItems = NonNullable<CardsBlock["options"]>["dynamicItems"];
type ExtraButton = NonNullable<
  NonNullable<DynamicItems>["extraButtons"]
>[number];
type JsonArraySource = NonNullable<CardsBlock["options"]>["jsonArraySource"];
type JsonArrayExtraButton = NonNullable<
  NonNullable<JsonArraySource>["extraButtons"]
>[number];

export const CardsBlockSettings = ({ options, onOptionsChange }: Props) => {
  // Ref so update functions always read latest options even from stale closures.
  const latestOptionsRef = useRef(options);
  latestOptionsRef.current = options;

  const updateSaveResponseMapping = (
    saveResponseMapping: NonNullable<
      CardsBlock["options"]
    >["saveResponseMapping"],
  ) => {
    onOptionsChange({ ...options, saveResponseMapping });
  };

  const updateDynamicItems = (patch: Partial<NonNullable<DynamicItems>>) => {
    const latest = latestOptionsRef.current;
    const updated = { ...latest?.dynamicItems, ...patch };
    const hasAny = Object.values(updated).some((v) =>
      Array.isArray(v) ? v.length > 0 : Boolean(v),
    );
    onOptionsChange({
      ...latest,
      dynamicItems: hasAny ? updated : undefined,
    });
  };

  const makeDynamicVariableUpdater =
    (field: keyof NonNullable<DynamicItems>) =>
    (variable: Pick<Variable, "id"> | undefined) => {
      updateDynamicItems({ [field]: variable?.id });
    };

  const addExtraDescriptionVar = () => {
    updateDynamicItems({
      extraDescriptionVariableIds: [
        ...(latestOptionsRef.current?.dynamicItems
          ?.extraDescriptionVariableIds ?? []),
        "",
      ],
    });
  };

  const updateExtraDescriptionVar = (
    idx: number,
    variableId: string | undefined,
  ) => {
    const existing =
      latestOptionsRef.current?.dynamicItems?.extraDescriptionVariableIds ?? [];
    const updated = existing.map((v, i) =>
      i === idx ? (variableId ?? "") : v,
    );
    updateDynamicItems({ extraDescriptionVariableIds: updated });
  };

  const removeExtraDescriptionVar = (idx: number) => {
    const existing =
      latestOptionsRef.current?.dynamicItems?.extraDescriptionVariableIds ?? [];
    updateDynamicItems({
      extraDescriptionVariableIds: existing.filter((_, i) => i !== idx),
    });
  };

  const addExtraButton = () => {
    updateDynamicItems({
      extraButtons: [
        ...(latestOptionsRef.current?.dynamicItems?.extraButtons ?? []),
        { type: "player-choice" },
      ],
    });
  };

  const updateExtraButton = (idx: number, patch: Partial<ExtraButton>) => {
    const existing = latestOptionsRef.current?.dynamicItems?.extraButtons ?? [];
    updateDynamicItems({
      extraButtons: existing.map((btn, i) =>
        i === idx ? { ...btn, ...patch } : btn,
      ),
    });
  };

  const removeExtraButton = (idx: number) => {
    const existing = latestOptionsRef.current?.dynamicItems?.extraButtons ?? [];
    updateDynamicItems({
      extraButtons: existing.filter((_, i) => i !== idx),
    });
  };

  const isJsonMode = Boolean(options?.jsonArraySource);

  const switchToSeparateLists = () => {
    onOptionsChange({
      ...latestOptionsRef.current,
      jsonArraySource: undefined,
    });
  };

  const switchToJsonArray = () => {
    onOptionsChange({
      ...latestOptionsRef.current,
      dynamicItems: undefined,
      jsonArraySource: {},
    });
  };

  const updateJsonArraySource = (
    patch: Partial<NonNullable<JsonArraySource>>,
  ) => {
    const latest = latestOptionsRef.current;
    const updated = { ...latest?.jsonArraySource, ...patch };
    const hasAny = Object.values(updated).some((v) =>
      Array.isArray(v) ? v.length > 0 : Boolean(v),
    );
    onOptionsChange({
      ...latest,
      jsonArraySource: hasAny ? updated : {},
    });
  };

  const addJsonExtraButton = () => {
    updateJsonArraySource({
      extraButtons: [
        ...(latestOptionsRef.current?.jsonArraySource?.extraButtons ?? []),
        { type: "player-choice" },
      ],
    });
  };

  const updateJsonExtraButton = (
    idx: number,
    patch: Partial<JsonArrayExtraButton>,
  ) => {
    const existing =
      latestOptionsRef.current?.jsonArraySource?.extraButtons ?? [];
    updateJsonArraySource({
      extraButtons: existing.map((btn, i) =>
        i === idx ? { ...btn, ...patch } : btn,
      ),
    });
  };

  const removeJsonExtraButton = (idx: number) => {
    const existing =
      latestOptionsRef.current?.jsonArraySource?.extraButtons ?? [];
    updateJsonArraySource({
      extraButtons: existing.filter((_, i) => i !== idx),
    });
  };

  const addJsonExtraDescriptionKey = () => {
    updateJsonArraySource({
      extraDescriptionKeys: [
        ...(latestOptionsRef.current?.jsonArraySource?.extraDescriptionKeys ??
          []),
        "",
      ],
    });
  };

  const updateJsonExtraDescriptionKey = (idx: number, key: string) => {
    const existing =
      latestOptionsRef.current?.jsonArraySource?.extraDescriptionKeys ?? [];
    updateJsonArraySource({
      extraDescriptionKeys: existing.map((v, i) => (i === idx ? key : v)),
    });
  };

  const removeJsonExtraDescriptionKey = (idx: number) => {
    const existing =
      latestOptionsRef.current?.jsonArraySource?.extraDescriptionKeys ?? [];
    updateJsonArraySource({
      extraDescriptionKeys: existing.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border px-4 py-3 rounded-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Dynamic Data</p>
          <div className="flex gap-1">
            <button
              type="button"
              className={`text-xs px-2 py-1 rounded border ${
                !isJsonMode
                  ? "bg-gray-100 border-gray-400 font-medium"
                  : "border-gray-200 text-gray-500"
              }`}
              onClick={switchToSeparateLists}
            >
              Separate lists
            </button>
            <button
              type="button"
              className={`text-xs px-2 py-1 rounded border ${
                isJsonMode
                  ? "bg-gray-100 border-gray-400 font-medium"
                  : "border-gray-200 text-gray-500"
              }`}
              onClick={switchToJsonArray}
            >
              JSON array
            </button>
          </div>
        </div>

        {isJsonMode ? (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="json-array-variable" className="text-sm">
                JSON Array Variable
              </label>
              <VariablesCombobox
                id="json-array-variable"
                initialVariableId={options?.jsonArraySource?.variableId}
                onSelectVariable={(v) =>
                  updateJsonArraySource({ variableId: v?.id })
                }
              />
            </div>
            {(
              [
                ["Image URL key", "imageUrlKey"],
                ["Title key", "titleKey"],
                ["Description key", "descriptionKey"],
              ] as const
            ).map(([label, field]) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={`json-field-${field}`} className="text-sm">
                  {label}
                </label>
                <input
                  id={`json-field-${field}`}
                  type="text"
                  placeholder="e.g. image_url"
                  value={options?.jsonArraySource?.[field] ?? ""}
                  className="text-sm border rounded px-2 py-1 w-full"
                  onChange={(e) =>
                    updateJsonArraySource({
                      [field]: e.target.value || undefined,
                    })
                  }
                />
              </div>
            ))}
            {(options?.jsonArraySource?.extraDescriptionKeys ?? []).map(
              (key, idx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: list only grows/shrinks at the end
                  key={`json-extra-desc-${idx}`}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      Extra Description key {idx + 1}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-red-500"
                      onClick={() => removeJsonExtraDescriptionKey(idx)}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. extra_note"
                    value={key}
                    className="text-sm border rounded px-2 py-1 w-full"
                    onChange={(e) =>
                      updateJsonExtraDescriptionKey(idx, e.target.value)
                    }
                  />
                </div>
              ),
            )}
            <button
              type="button"
              className="text-xs text-blue-500 hover:underline text-left"
              onClick={addJsonExtraDescriptionKey}
            >
              + Add extra description key
            </button>
            {(options?.jsonArraySource?.extraButtons ?? []).map((btn, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: list only grows/shrinks at the end
                key={`json-extra-btn-${idx}`}
                className="flex flex-col gap-2 p-3 border rounded-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Extra Button {idx + 1}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-red-500"
                    onClick={() => removeJsonExtraButton(idx)}
                  >
                    Remove
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={`flex-1 text-xs px-2 py-1 rounded border ${
                      btn.type !== "link"
                        ? "bg-gray-100 border-gray-400 font-medium"
                        : "border-gray-200 text-gray-500"
                    }`}
                    onClick={() =>
                      updateJsonExtraButton(idx, { type: "player-choice" })
                    }
                  >
                    Player choice
                  </button>
                  <button
                    type="button"
                    className={`flex-1 text-xs px-2 py-1 rounded border ${
                      btn.type === "link"
                        ? "bg-gray-100 border-gray-400 font-medium"
                        : "border-gray-200 text-gray-500"
                    }`}
                    onClick={() => updateJsonExtraButton(idx, { type: "link" })}
                  >
                    Link
                  </button>
                </div>
                {btn.type === "link" && (
                  <input
                    type="text"
                    placeholder="Button label"
                    value={btn.text ?? ""}
                    className="text-sm border rounded px-2 py-1 w-full"
                    onChange={(e) =>
                      updateJsonExtraButton(idx, { text: e.target.value })
                    }
                  />
                )}
                <input
                  type="text"
                  placeholder="e.g. cta_url"
                  value={btn.key ?? ""}
                  className="text-sm border rounded px-2 py-1 w-full"
                  onChange={(e) =>
                    updateJsonExtraButton(idx, {
                      key: e.target.value || undefined,
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="text-xs text-blue-500 hover:underline text-left"
              onClick={addJsonExtraButton}
            >
              + Add extra button key
            </button>
            {(
              [
                ["Button key", "buttonKey"],
                ["Internal Value key", "internalValueKey"],
              ] as const
            ).map(([label, field]) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={`json-field-${field}`} className="text-sm">
                  {label}
                </label>
                <input
                  id={`json-field-${field}`}
                  type="text"
                  placeholder="e.g. id"
                  value={options?.jsonArraySource?.[field] ?? ""}
                  className="text-sm border rounded px-2 py-1 w-full"
                  onChange={(e) =>
                    updateJsonArraySource({
                      [field]: e.target.value || undefined,
                    })
                  }
                />
              </div>
            ))}
          </>
        ) : (
          <>
            {(
              [
                ["Image URL", "imageUrlVariableId"],
                ["Title", "titleVariableId"],
                ["Description", "descriptionVariableId"],
              ] as const
            ).map(([label, field]) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={`dynamic-field-${field}`} className="text-sm">
                  {label}
                </label>
                <VariablesCombobox
                  id={`dynamic-field-${field}`}
                  initialVariableId={options?.dynamicItems?.[field]}
                  onSelectVariable={makeDynamicVariableUpdater(field)}
                />
              </div>
            ))}
            {(options?.dynamicItems?.extraDescriptionVariableIds ?? []).map(
              (varId, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: list only grows/shrinks at the end
                <div key={`extra-desc-${idx}`} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Extra Description {idx + 1}</span>
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-red-500"
                      onClick={() => removeExtraDescriptionVar(idx)}
                    >
                      Remove
                    </button>
                  </div>
                  <VariablesCombobox
                    initialVariableId={varId || undefined}
                    onSelectVariable={(v) =>
                      updateExtraDescriptionVar(idx, v?.id)
                    }
                  />
                </div>
              ),
            )}
            <button
              type="button"
              className="text-xs text-blue-500 hover:underline text-left"
              onClick={addExtraDescriptionVar}
            >
              + Add extra description variable
            </button>

            {(options?.dynamicItems?.extraButtons ?? []).map((btn, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: list only grows/shrinks at the end
                key={`extra-btn-${idx}`}
                className="flex flex-col gap-2 p-3 border rounded-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Extra Button {idx + 1}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-red-500"
                    onClick={() => removeExtraButton(idx)}
                  >
                    Remove
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={`flex-1 text-xs px-2 py-1 rounded border ${
                      btn.type !== "link"
                        ? "bg-gray-100 border-gray-400 font-medium"
                        : "border-gray-200 text-gray-500"
                    }`}
                    onClick={() =>
                      updateExtraButton(idx, { type: "player-choice" })
                    }
                  >
                    Player choice
                  </button>
                  <button
                    type="button"
                    className={`flex-1 text-xs px-2 py-1 rounded border ${
                      btn.type === "link"
                        ? "bg-gray-100 border-gray-400 font-medium"
                        : "border-gray-200 text-gray-500"
                    }`}
                    onClick={() => updateExtraButton(idx, { type: "link" })}
                  >
                    Link
                  </button>
                </div>
                {btn.type === "link" && (
                  <input
                    type="text"
                    placeholder="Button label"
                    value={btn.text ?? ""}
                    className="text-sm border rounded px-2 py-1 w-full"
                    onChange={(e) =>
                      updateExtraButton(idx, { text: e.target.value })
                    }
                  />
                )}
                <VariablesCombobox
                  initialVariableId={btn.variableId}
                  onSelectVariable={(v) =>
                    updateExtraButton(idx, { variableId: v?.id })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="text-xs text-blue-500 hover:underline text-left"
              onClick={addExtraButton}
            >
              + Add extra button variable
            </button>

            {(
              [
                ["Button", "buttonVariableId"],
                ["Internal Value", "internalValueVariableId"],
              ] as const
            ).map(([label, field]) => (
              <div key={field} className="flex flex-col gap-2">
                <label htmlFor={`dynamic-field-${field}`} className="text-sm">
                  {label}
                </label>
                <VariablesCombobox
                  id={`dynamic-field-${field}`}
                  initialVariableId={options?.dynamicItems?.[field]}
                  onSelectVariable={makeDynamicVariableUpdater(field)}
                />
              </div>
            ))}
          </>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="cards-free-text-enabled"
            checked={options?.freeTextInput?.enabled ?? false}
            onChange={(e) =>
              onOptionsChange({
                ...latestOptionsRef.current,
                freeTextInput: {
                  ...latestOptionsRef.current?.freeTextInput,
                  enabled: e.target.checked,
                },
              })
            }
          />
          <label
            htmlFor="cards-free-text-enabled"
            className="text-sm font-medium cursor-pointer"
          >
            Allow free text input
          </label>
        </div>
        {(options?.freeTextInput?.enabled ?? false) && (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="cards-free-text-placeholder" className="text-sm">
                Placeholder text
              </label>
              <input
                id="cards-free-text-placeholder"
                type="text"
                placeholder="Type your answer..."
                value={options?.freeTextInput?.placeholder ?? ""}
                className="text-sm border rounded px-2 py-1 w-full"
                onChange={(e) =>
                  onOptionsChange({
                    ...latestOptionsRef.current,
                    freeTextInput: {
                      ...latestOptionsRef.current?.freeTextInput,
                      enabled: true,
                      placeholder: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="cards-free-text-variable" className="text-sm">
                Save answer in variable
              </label>
              <VariablesCombobox
                id="cards-free-text-variable"
                initialVariableId={options?.freeTextInput?.variableId}
                onSelectVariable={(v) =>
                  onOptionsChange({
                    ...latestOptionsRef.current,
                    freeTextInput: {
                      ...latestOptionsRef.current?.freeTextInput,
                      enabled: true,
                      variableId: v?.id,
                    },
                  })
                }
              />
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="cards-skip-button-enabled"
            checked={options?.skipButton?.enabled ?? false}
            onChange={(e) =>
              onOptionsChange({
                ...latestOptionsRef.current,
                skipButton: {
                  ...latestOptionsRef.current?.skipButton,
                  enabled: e.target.checked,
                },
              })
            }
          />
          <label
            htmlFor="cards-skip-button-enabled"
            className="text-sm font-medium cursor-pointer"
          >
            Show skip button
          </label>
        </div>
        {(options?.skipButton?.enabled ?? false) && (
          <div className="flex flex-col gap-2">
            <label htmlFor="cards-skip-button-label" className="text-sm">
              Button label
            </label>
            <input
              id="cards-skip-button-label"
              type="text"
              placeholder="Skip"
              value={options?.skipButton?.label ?? ""}
              className="text-sm border rounded px-2 py-1 w-full"
              onChange={(e) =>
                onOptionsChange({
                  ...latestOptionsRef.current,
                  skipButton: {
                    ...latestOptionsRef.current?.skipButton,
                    enabled: true,
                    label: e.target.value || undefined,
                  },
                })
              }
            />
          </div>
        )}
      </div>
      <TableList
        addLabel={
          (options?.saveResponseMapping?.length ?? 0) === 0
            ? "Save in variable"
            : undefined
        }
        initialItems={options?.saveResponseMapping}
        onItemsChange={updateSaveResponseMapping}
      >
        {(props) => <CardSaveResponseItem {...props} />}
      </TableList>
    </div>
  );
};

const CardSaveResponseItem = ({
  item,
  onItemChange,
}: TableListItemProps<{
  variableId?: string | undefined;
  field?: (typeof cardMappableFields)[number] | undefined;
}>) => {
  const changeValueToExtract = (
    valueToExtract: (typeof cardMappableFields)[number] | undefined,
  ) => {
    onItemChange({ ...item, field: valueToExtract });
  };

  const changeVariableId = (variable: Pick<Variable, "id"> | undefined) => {
    onItemChange({ ...item, variableId: variable ? variable.id : undefined });
  };

  return (
    <div className="flex flex-col gap-2 p-4 rounded-md flex-1 border">
      <BasicSelect
        placeholder="Select a field"
        className="w-full"
        value={item.field}
        items={cardMappableFields}
        onChange={changeValueToExtract}
      />
      <VariablesCombobox
        initialVariableId={item.variableId}
        onSelectVariable={changeVariableId}
      />
    </div>
  );
};
