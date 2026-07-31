import type { BlockIndices } from "@typebot.io/blocks-core/schemas/schema";
import type { CardsBlock } from "@typebot.io/blocks-inputs/cards/schema";
import { isDefined } from "@typebot.io/lib/utils";
import { Badge } from "@typebot.io/ui/components/Badge";
import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { ItemNodesList } from "@/features/graph/components/nodes/item/ItemNodesList";

type Props = {
  block: CardsBlock;
  indices: BlockIndices;
};

export const CardsBlockNode = ({ block, indices }: Props) => {
  const { typebot } = useTypebot();
  const savingVariableIds = block.options?.saveResponseMapping
    ?.map((mapping) => mapping?.variableId)
    .filter(isDefined);

  const dynamicItems = block.options?.dynamicItems;
  const hasDynamicItems =
    dynamicItems && Object.values(dynamicItems).some(Boolean);

  return (
    <div className="flex flex-col gap-2 w-[90%]">
      {hasDynamicItems && (
        <div className="flex flex-wrap gap-1 items-center">
          <p>Dynamic</p>
          <Badge colorScheme="purple">cards</Badge>
          <p>from variables</p>
        </div>
      )}
      <ItemNodesList block={block} indices={indices} />
      {savingVariableIds?.map((variableId) => (
        <SetVariableLabel
          key={variableId}
          variableId={variableId}
          variables={typebot?.variables}
        />
      ))}
    </div>
  );
};
