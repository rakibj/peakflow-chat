import type { JsonRemapBlock } from "@typebot.io/blocks-logic/jsonRemap/schema";
import { cx } from "@typebot.io/ui/lib/cva";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";

type Props = {
  options: JsonRemapBlock["options"];
};

export const JsonRemapNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  const pickOnly = options?.pickOnly ?? false;
  const entryCount = (options?.transformations ?? []).filter((t) =>
    pickOnly ? t.key : t.key && t.expression,
  ).length;
  const inputVar = typebot?.variables.find(
    (v) => v.id === options?.inputVariableId,
  );
  const hasConfig = inputVar && entryCount > 0;

  return (
    <p className={cx("truncate", hasConfig ? "text-gray-12" : "text-gray-9")}>
      {hasConfig
        ? pickOnly
          ? `pick ${entryCount} field${entryCount !== 1 ? "s" : ""} from {{${inputVar.name}}}`
          : `${entryCount} transform${entryCount !== 1 ? "s" : ""} on {{${inputVar.name}}}`
        : "Configure..."}
    </p>
  );
};
