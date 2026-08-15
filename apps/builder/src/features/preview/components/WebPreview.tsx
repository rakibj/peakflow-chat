import type { InputBlock } from "@typebot.io/blocks-inputs/schema";
import type { ContinueChatResponse } from "@typebot.io/chat-api/schemas";
import { Standard } from "@typebot.io/react";
import { defaultBackgroundColor } from "@typebot.io/theme/constants";
import { useRef } from "react";
import { useEditor } from "@/features/editor/providers/EditorProvider";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { useGraph } from "@/features/graph/providers/GraphProvider";
import { useUser } from "@/features/user/hooks/useUser";
import { toast } from "@/lib/toast";

export const WebPreview = () => {
  const { user } = useUser();
  const { typebot } = useTypebot();
  const { startPreviewFrom } = useEditor();
  const {
    setPreviewingBlock,
    setExecutedBlockIds,
    setExecutedEdgeIds,
    resetExecutionTrail,
  } = useGraph();
  // Track the last displayed bubble / input so a later block/edge can be
  // matched against whichever of the two actually owns the outgoing edge.
  const lastBubbleIdRef = useRef<string | undefined>(undefined);
  const lastInputRef = useRef<{ id: string; groupId: string } | undefined>(
    undefined,
  );

  const handleNewLogs = (logs: ContinueChatResponse["logs"]) => {
    logs?.forEach((log) => {
      toast({
        title: log.context,
        type: log.status as "success" | "error" | "info",
        description: log.description,
        details: log.details,
      });
      if (log.status === "error") console.error(log);
    });
  };

  const findGroupIdForBlock = (blockId: string) =>
    typebot?.groups.find((g) => g.blocks.some((b) => b.id === blockId))?.id;

  const registerEdgeCrossing = (
    fromBlockId: string | undefined,
    toGroupId: string,
  ) => {
    if (!typebot || !fromBlockId) return false;
    const crossedEdge = typebot.edges.find(
      (edge) =>
        "blockId" in edge.from &&
        edge.from.blockId === fromBlockId &&
        edge.to.groupId === toGroupId,
    );
    if (!crossedEdge) return false;
    setExecutedEdgeIds((edgeIds) =>
      edgeIds.includes(crossedEdge.id) ? edgeIds : [...edgeIds, crossedEdge.id],
    );
    return true;
  };

  const handleNewBubbleBlockDisplayed = (blockId: string) => {
    const groupId = findGroupIdForBlock(blockId);
    if (groupId) {
      const matchedPreviousBubble = registerEdgeCrossing(
        lastBubbleIdRef.current,
        groupId,
      );
      if (!matchedPreviousBubble)
        registerEdgeCrossing(lastInputRef.current?.id, groupId);
    }
    lastBubbleIdRef.current = blockId;
    setExecutedBlockIds((prev) =>
      prev.at(-1) === blockId ? prev : [...prev, blockId],
    );
  };

  const handleNewInputBlock = (block: InputBlock) => {
    const groupId = findGroupIdForBlock(block.id) ?? "";
    registerEdgeCrossing(lastBubbleIdRef.current, groupId);
    setPreviewingBlock({ id: block.id, groupId });
    lastInputRef.current = { id: block.id, groupId };
  };

  const handleInit = () => {
    lastBubbleIdRef.current = undefined;
    lastInputRef.current = undefined;
    resetExecutionTrail();
  };

  if (!typebot) return null;

  return (
    <Standard
      key={`web-preview-${startPreviewFrom?.id ?? ""}`}
      typebot={typebot}
      apiHost={window.location.origin}
      sessionId={user ? `${typebot.id}-${user.id}` : undefined}
      startFrom={
        startPreviewFrom?.type === "group"
          ? { type: "group", groupId: startPreviewFrom.id }
          : startPreviewFrom?.type === "event"
            ? { type: "event", eventId: startPreviewFrom.id }
            : undefined
      }
      onInit={handleInit}
      onNewInputBlock={handleNewInputBlock}
      onNewBubbleBlockDisplayed={handleNewBubbleBlockDisplayed}
      onNewLogs={handleNewLogs}
      style={{
        borderWidth: "1px",
        borderRadius: "0.25rem",
        backgroundColor:
          typebot.theme.general?.background?.content ??
          defaultBackgroundColor[typebot.version],
      }}
    />
  );
};
