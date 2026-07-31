import { describe, expect, it } from "bun:test";
import { LogicBlockType } from "@typebot.io/blocks-logic/constants";
import { executeJsonJoin } from "./executeJsonJoin";

const makeState = (vars: { id: string; name: string; value: unknown }[]) =>
  ({
    typebotsQueue: [
      {
        typebot: {
          variables: vars.map((v) => ({ ...v, isSessionVariable: false })),
        },
      },
    ],
  }) as any;

const makeBlock = (
  overrides: Partial<{
    input1Mode: "array" | "value";
    inputVariable1Id: string;
    inputVariable2Id: string;
    matchKey1: string;
    matchKey2: string;
    outputVariableId: string;
  }> = {},
) => ({
  id: "b1",
  type: LogicBlockType.JSON_JOIN as const,
  options: {
    inputVariable1Id: "v1",
    inputVariable2Id: "v2",
    matchKey1: "id",
    matchKey2: "userId",
    outputVariableId: "vout",
    ...overrides,
  },
});

const array1 = JSON.stringify([{ id: "a" }, { id: "b" }]);
const array2 = JSON.stringify([
  { userId: "a", name: "Alice" },
  { userId: "b", name: "Bob" },
  { userId: "c", name: "Carol" },
]);

describe("executeJsonJoin", () => {
  it("returns only array2 items whose matchKey2 value is in array1 matchKey1 set", () => {
    const state = makeState([
      { id: "v1", name: "arr1", value: array1 },
      { id: "v2", name: "arr2", value: array2 },
      { id: "vout", name: "output", value: null },
    ]);
    const result = executeJsonJoin(makeBlock(), { state });
    const output = JSON.parse(
      (result.newSessionState as any).typebotsQueue[0].typebot.variables.find(
        (v: { id: string }) => v.id === "vout",
      ).value,
    );
    expect(output).toEqual([
      { userId: "a", name: "Alice" },
      { userId: "b", name: "Bob" },
    ]);
  });

  it("returns empty array when no matches", () => {
    const state = makeState([
      { id: "v1", name: "arr1", value: JSON.stringify([{ id: "x" }]) },
      { id: "v2", name: "arr2", value: array2 },
      { id: "vout", name: "output", value: null },
    ]);
    const result = executeJsonJoin(makeBlock(), { state });
    const output = JSON.parse(
      (result.newSessionState as any).typebotsQueue[0].typebot.variables.find(
        (v: { id: string }) => v.id === "vout",
      ).value,
    );
    expect(output).toEqual([]);
  });

  it("falls through when a required option is missing", () => {
    const state = makeState([
      { id: "v1", name: "arr1", value: array1 },
      { id: "v2", name: "arr2", value: array2 },
      { id: "vout", name: "output", value: null },
    ]);
    const result = executeJsonJoin(makeBlock({ matchKey1: undefined }), {
      state,
    });
    expect(result.newSessionState).toBeUndefined();
  });

  it("falls through on invalid JSON input", () => {
    const state = makeState([
      { id: "v1", name: "arr1", value: "not json" },
      { id: "v2", name: "arr2", value: array2 },
      { id: "vout", name: "output", value: null },
    ]);
    const result = executeJsonJoin(makeBlock(), { state });
    expect(result.newSessionState).toBeUndefined();
  });

  it("handles string[] where each element is a JSON-stringified object (updateVariablesInSession format)", () => {
    const state = makeState([
      {
        id: "v1",
        name: "arr1",
        value: [JSON.stringify({ id: "a" }), JSON.stringify({ id: "b" })],
      },
      {
        id: "v2",
        name: "arr2",
        value: [
          JSON.stringify({ userId: "a", name: "Alice" }),
          JSON.stringify({ userId: "c", name: "Carol" }),
        ],
      },
      { id: "vout", name: "output", value: null },
    ]);
    const result = executeJsonJoin(makeBlock(), { state });
    const output = JSON.parse(
      (result.newSessionState as any).typebotsQueue[0].typebot.variables.find(
        (v: { id: string }) => v.id === "vout",
      ).value,
    );
    expect(output).toEqual([{ userId: "a", name: "Alice" }]);
  });

  it("value mode: filters array2 by direct variable value match", () => {
    const state = makeState([
      { id: "v1", name: "userId", value: "a" },
      { id: "v2", name: "arr2", value: array2 },
      { id: "vout", name: "output", value: null },
    ]);
    const result = executeJsonJoin(makeBlock({ input1Mode: "value" }), {
      state,
    });
    const output = JSON.parse(
      (result.newSessionState as any).typebotsQueue[0].typebot.variables.find(
        (v: { id: string }) => v.id === "vout",
      ).value,
    );
    expect(output).toEqual([{ userId: "a", name: "Alice" }]);
  });

  it("value mode: falls through when variable is empty", () => {
    const state = makeState([
      { id: "v1", name: "userId", value: "" },
      { id: "v2", name: "arr2", value: array2 },
      { id: "vout", name: "output", value: null },
    ]);
    const result = executeJsonJoin(makeBlock({ input1Mode: "value" }), {
      state,
    });
    expect(result.newSessionState).toBeUndefined();
  });

  it("coerces values to string for comparison", () => {
    const state = makeState([
      { id: "v1", name: "arr1", value: JSON.stringify([{ id: 1 }, { id: 2 }]) },
      {
        id: "v2",
        name: "arr2",
        value: JSON.stringify([
          { userId: "1", label: "One" },
          { userId: "3", label: "Three" },
        ]),
      },
      { id: "vout", name: "output", value: null },
    ]);
    const result = executeJsonJoin(makeBlock(), { state });
    const output = JSON.parse(
      (result.newSessionState as any).typebotsQueue[0].typebot.variables.find(
        (v: { id: string }) => v.id === "vout",
      ).value,
    );
    expect(output).toEqual([{ userId: "1", label: "One" }]);
  });
});
