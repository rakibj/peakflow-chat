import type { JsonJoinBlock } from "@typebot.io/blocks-logic/jsonJoin/schema";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import type { ExecuteLogicResponse } from "../../../types";
import { updateVariablesInSession } from "../../../updateVariablesInSession";
import { parseJsonArrayInput } from "../jsonRemap/jsonRemapHelpers";

export const executeJsonJoin = (
  block: JsonJoinBlock,
  { state }: { state: SessionState },
): ExecuteLogicResponse => {
  const { variables } = state.typebotsQueue[0].typebot;
  const options = block.options;

  const input1Mode = options?.input1Mode ?? "array";

  if (
    !options?.inputVariable1Id ||
    !options?.inputVariable2Id ||
    (input1Mode === "array" && !options?.matchKey1) ||
    !options?.matchKey2 ||
    !options?.outputVariableId
  ) {
    return { outgoingEdgeId: block.outgoingEdgeId };
  }

  const variable1 = variables.find((v) => v.id === options.inputVariable1Id);
  const variable2 = variables.find((v) => v.id === options.inputVariable2Id);
  const outputVariable = variables.find(
    (v) => v.id === options.outputVariableId,
  );

  if (!variable1 || !variable2 || !outputVariable) {
    return { outgoingEdgeId: block.outgoingEdgeId };
  }

  const array2 = parseJsonArrayInput(variable2.value);

  if (!array2) {
    return { outgoingEdgeId: block.outgoingEdgeId };
  }

  const matchKey2 = options.matchKey2;

  let lookupSet: Set<string>;

  if (input1Mode === "value") {
    const raw = variable1.value;
    if (raw === null || raw === undefined || raw === "") {
      return { outgoingEdgeId: block.outgoingEdgeId };
    }
    lookupSet = new Set([String(Array.isArray(raw) ? raw[0] : raw)]);
  } else {
    const array1 = parseJsonArrayInput(variable1.value);
    if (!array1) {
      return { outgoingEdgeId: block.outgoingEdgeId };
    }
    const matchKey1 = options.matchKey1 as string;
    lookupSet = new Set(
      array1
        .map((item) => item[matchKey1])
        .filter((v) => v !== undefined && v !== null)
        .map(String),
    );
  }

  const matched = array2.filter((item) => {
    const val = item[matchKey2];
    return val !== undefined && val !== null && lookupSet.has(String(val));
  });

  const updateVarResults = updateVariablesInSession({
    newVariables: [{ ...outputVariable, value: JSON.stringify(matched) }],
    state,
    currentBlockId: block.id,
  });

  return {
    outgoingEdgeId: block.outgoingEdgeId,
    newSessionState: updateVarResults.updatedState,
    newSetVariableHistory: updateVarResults.newSetVariableHistory,
  };
};
