import type { JsonRemapBlock } from "@typebot.io/blocks-logic/jsonRemap/schema";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import { executeFunction } from "@typebot.io/variables/executeFunction";
import type { ExecuteLogicResponse } from "../../../types";
import { updateVariablesInSession } from "../../../updateVariablesInSession";
import { buildJsonRemapBody, parseJsonArrayInput } from "./jsonRemapHelpers";

export const executeJsonRemap = async (
  block: JsonRemapBlock,
  {
    state,
    sessionStore,
  }: {
    state: SessionState;
    sessionStore: SessionStore;
  },
): Promise<ExecuteLogicResponse> => {
  const { variables } = state.typebotsQueue[0].typebot;
  const options = block.options;

  if (!options?.inputVariableId || !options?.outputVariableId) {
    return { outgoingEdgeId: block.outgoingEdgeId };
  }

  const pickOnly = options.pickOnly ?? false;
  const transformations = (options.transformations ?? []).filter((t) =>
    pickOnly ? t.key : t.key && t.expression,
  );

  if (transformations.length === 0) {
    return { outgoingEdgeId: block.outgoingEdgeId };
  }

  const inputVariable = variables.find((v) => v.id === options.inputVariableId);
  if (!inputVariable) return { outgoingEdgeId: block.outgoingEdgeId };

  const outputVariable = variables.find(
    (v) => v.id === options.outputVariableId,
  );
  if (!outputVariable) return { outgoingEdgeId: block.outgoingEdgeId };

  const inputArray = parseJsonArrayInput(inputVariable.value);
  if (!inputArray) return { outgoingEdgeId: block.outgoingEdgeId };

  const body = buildJsonRemapBody(
    transformations,
    outputVariable.name,
    pickOnly,
  );

  const { newVariables, error } = await executeFunction({
    variables,
    body,
    sessionStore,
    args: { __jsonRemapInput: inputArray },
  });

  const updateVarResults = newVariables
    ? updateVariablesInSession({
        newVariables,
        state,
        currentBlockId: block.id,
      })
    : undefined;

  return {
    outgoingEdgeId: block.outgoingEdgeId,
    logs: error ? [error] : [],
    newSessionState: updateVarResults?.updatedState ?? state,
    newSetVariableHistory: updateVarResults?.newSetVariableHistory,
  };
};
