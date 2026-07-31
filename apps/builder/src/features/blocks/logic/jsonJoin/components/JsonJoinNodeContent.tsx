import type { JsonJoinBlock } from "@typebot.io/blocks-logic/jsonJoin/schema";
import { cx } from "@typebot.io/ui/lib/cva";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";

type Props = {
  options: JsonJoinBlock["options"];
};

export const JsonJoinNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  const var1 = typebot?.variables.find(
    (v) => v.id === options?.inputVariable1Id,
  );
  const var2 = typebot?.variables.find(
    (v) => v.id === options?.inputVariable2Id,
  );
  const input1Mode = options?.input1Mode ?? "array";
  const hasConfig =
    var1 &&
    var2 &&
    (input1Mode === "value" || options?.matchKey1) &&
    options?.matchKey2;

  const label = hasConfig
    ? input1Mode === "value"
      ? `{{${var1.name}}} → {{${var2.name}}}.${options.matchKey2}`
      : `match {{${var1.name}}}.${options.matchKey1} → {{${var2.name}}}.${options.matchKey2}`
    : "Configure...";

  return (
    <p className={cx("truncate", hasConfig ? "text-gray-12" : "text-gray-9")}>
      {label}
    </p>
  );
};
