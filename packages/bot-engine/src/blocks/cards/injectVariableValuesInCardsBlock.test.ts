import { describe, expect, it } from "bun:test";
import type { CardsBlock } from "@typebot.io/blocks-inputs/cards/schema";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import type { Variable } from "@typebot.io/variables/schemas";
import { injectVariableValuesInCardsBlock } from "./injectVariableValuesInCardsBlock";

const sessionStore = {} as unknown as SessionStore;

const makeBlock = (override: Partial<CardsBlock> = {}): CardsBlock => ({
  id: "block1",
  type: InputBlockType.CARDS,
  items: [
    {
      id: "item1",
      title: "Template Title",
      description: "Template Description",
      paths: [{ id: "path1", text: "Choose" }],
    },
  ],
  ...override,
});

const makeVariable = (id: string, value: Variable["value"]): Variable => ({
  id,
  name: "v",
  value,
});

describe("injectVariableValuesInCardsBlock - JSON array source", () => {
  it("extracts title and imageUrl from a JSON array string variable", () => {
    const block = makeBlock({
      options: {
        jsonArraySource: {
          variableId: "v1",
          titleKey: "name",
          imageUrlKey: "img",
        },
      },
    });
    const variables = [
      makeVariable(
        "v1",
        JSON.stringify([
          { name: "Rose", img: "rose.jpg" },
          { name: "Tulip", img: "tulip.jpg" },
        ]),
      ),
    ];
    const result = injectVariableValuesInCardsBlock(block, {
      sessionStore,
      variables,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("Rose");
    expect(result.items[0].imageUrl).toBe("rose.jpg");
    expect(result.items[1].title).toBe("Tulip");
    expect(result.items[1].imageUrl).toBe("tulip.jpg");
  });

  it("extracts title from a variable holding an array of JSON strings", () => {
    const block = makeBlock({
      options: {
        jsonArraySource: {
          variableId: "v1",
          titleKey: "bouquet_name",
        },
      },
    });
    const variables = [
      makeVariable("v1", [
        JSON.stringify({ bouquet_name: "Rose" }),
        JSON.stringify({ bouquet_name: "Tulip" }),
      ]),
    ];
    const result = injectVariableValuesInCardsBlock(block, {
      sessionStore,
      variables,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("Rose");
    expect(result.items[1].title).toBe("Tulip");
  });

  it("falls back to template card when JSON is invalid", () => {
    const block = makeBlock({
      options: {
        jsonArraySource: { variableId: "v1", titleKey: "name" },
      },
    });
    const variables = [makeVariable("v1", "not json at all")];
    const result = injectVariableValuesInCardsBlock(block, {
      sessionStore,
      variables,
    });
    expect(result.items[0].title).toBe("Template Title");
  });

  it("falls back to template card when variable value is not an array", () => {
    const block = makeBlock({
      options: {
        jsonArraySource: { variableId: "v1", titleKey: "name" },
      },
    });
    const variables = [makeVariable("v1", JSON.stringify({ name: "Rose" }))];
    const result = injectVariableValuesInCardsBlock(block, {
      sessionStore,
      variables,
    });
    expect(result.items[0].title).toBe("Template Title");
  });

  it("uses null for items missing the requested key", () => {
    const block = makeBlock({
      options: {
        jsonArraySource: {
          variableId: "v1",
          titleKey: "name",
          descriptionKey: "missing_field",
        },
      },
    });
    const variables = [
      makeVariable("v1", JSON.stringify([{ name: "Rose" }, { name: "Tulip" }])),
    ];
    const result = injectVariableValuesInCardsBlock(block, {
      sessionStore,
      variables,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].description).toBeNull();
  });
});

describe("injectVariableValuesInCardsBlock - JSON array source internalValueKey", () => {
  it("sets options.internalValue from the specified key", () => {
    const block = makeBlock({
      options: {
        jsonArraySource: {
          variableId: "v1",
          titleKey: "name",
          internalValueKey: "id",
        },
      },
    });
    const variables = [
      makeVariable(
        "v1",
        JSON.stringify([
          { id: "abc", name: "Rose" },
          { id: "def", name: "Tulip" },
        ]),
      ),
    ];
    const result = injectVariableValuesInCardsBlock(block, {
      sessionStore,
      variables,
    });
    expect(result.items[0].options?.internalValue).toBe("abc");
    expect(result.items[1].options?.internalValue).toBe("def");
  });

  it("sets options.internalValue to null when the key is missing from an item", () => {
    const block = makeBlock({
      options: {
        jsonArraySource: {
          variableId: "v1",
          titleKey: "name",
          internalValueKey: "id",
        },
      },
    });
    const variables = [
      makeVariable(
        "v1",
        JSON.stringify([{ id: "abc", name: "Rose" }, { name: "Tulip" }]),
      ),
    ];
    const result = injectVariableValuesInCardsBlock(block, {
      sessionStore,
      variables,
    });
    expect(result.items[0].options?.internalValue).toBe("abc");
    expect(result.items[1].options?.internalValue).toBeNull();
  });

  it("works when internalValueKey is the only key configured", () => {
    const block = makeBlock({
      options: {
        jsonArraySource: {
          variableId: "v1",
          internalValueKey: "id",
        },
      },
    });
    const variables = [
      makeVariable("v1", JSON.stringify([{ id: "x1" }, { id: "x2" }])),
    ];
    const result = injectVariableValuesInCardsBlock(block, {
      sessionStore,
      variables,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].options?.internalValue).toBe("x1");
    expect(result.items[1].options?.internalValue).toBe("x2");
  });
});

describe("injectVariableValuesInCardsBlock - existing dynamicItems regression", () => {
  it("existing dynamicItems bots are unaffected when jsonArraySource is absent", () => {
    const block = makeBlock({
      options: {
        dynamicItems: { titleVariableId: "v1" },
      },
    });
    const variables = [makeVariable("v1", ["Rose", "Tulip"])];
    const result = injectVariableValuesInCardsBlock(block, {
      sessionStore,
      variables,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("Rose");
    expect(result.items[1].title).toBe("Tulip");
  });
});
