import { describe, expect, it } from "bun:test";
import { buildJsonRemapBody, parseJsonArrayInput } from "./jsonRemapHelpers";

describe("parseJsonArrayInput", () => {
  it("parses a JSON string holding an array", () => {
    const result = parseJsonArrayInput(
      JSON.stringify([{ title: "A" }, { title: "B" }]),
    );
    expect(result).toEqual([{ title: "A" }, { title: "B" }]);
  });

  it("accepts an existing array value", () => {
    const input = [{ x: 1 }, { x: 2 }];
    expect(parseJsonArrayInput(input as unknown as string[])).toEqual(input);
  });

  it("returns undefined for invalid JSON", () => {
    expect(parseJsonArrayInput("not json")).toBeUndefined();
  });

  it("returns undefined for a JSON non-array", () => {
    expect(parseJsonArrayInput('{"key":"value"}')).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(parseJsonArrayInput(null)).toBeUndefined();
  });

  it("parses string[] where each element is a JSON-stringified object (updateVariablesInSession format)", () => {
    const stored = [
      JSON.stringify({ id: "p1", name: "Widget A" }),
      JSON.stringify({ id: "p2", name: "Widget B" }),
    ];
    expect(parseJsonArrayInput(stored)).toEqual([
      { id: "p1", name: "Widget A" },
      { id: "p2", name: "Widget B" },
    ]);
  });
});

describe("buildJsonRemapBody — remap mode (pickOnly: false)", () => {
  it("clones all fields and applies transformations", () => {
    const body = buildJsonRemapBody(
      [{ key: "title", expression: "$value.slice(0,3)" }],
      "myOutput",
      false,
    );
    expect(body).toContain("Object.assign({}, $item)");
    expect(body).toContain('setVariable("myOutput"');
    expect(body).toContain('"title"');
    expect(body).toContain("$value.slice(0,3)");
  });

  it("skips entries with missing key or expression", () => {
    const body = buildJsonRemapBody(
      [
        { key: "title", expression: "" },
        { key: "", expression: "$value + '!'" },
        { key: "price", expression: "'$' + $value" },
      ],
      "out",
      false,
    );
    expect(body).toContain('"price"');
    expect(body).not.toContain('"title"');
  });

  it("includes $item and $index in map callback", () => {
    const body = buildJsonRemapBody(
      [{ key: "n", expression: "$index" }],
      "out",
      false,
    );
    expect(body).toContain("function($item, $index)");
  });
});

describe("buildJsonRemapBody — pick mode (pickOnly: true)", () => {
  it("projects only listed fields", () => {
    const body = buildJsonRemapBody(
      [{ key: "title" }, { key: "price" }],
      "out",
      true,
    );
    expect(body).toContain("const __out = {}");
    expect(body).toContain('__out["title"] = $item["title"]');
    expect(body).toContain('__out["price"] = $item["price"]');
    expect(body).not.toContain("Object.assign");
  });

  it("applies expression for a picked field when provided", () => {
    const body = buildJsonRemapBody(
      [{ key: "price", expression: "$value * 2" }],
      "out",
      true,
    );
    expect(body).toContain(
      '__out["price"] = (($value) => { return ($value * 2); })($item["price"])',
    );
  });

  it("copies field as-is when expression is blank", () => {
    const body = buildJsonRemapBody(
      [{ key: "name", expression: "" }],
      "out",
      true,
    );
    expect(body).toContain('__out["name"] = $item["name"]');
  });

  it("skips entries with no key", () => {
    const body = buildJsonRemapBody(
      [{ key: "", expression: "$value" }, { key: "id" }],
      "out",
      true,
    );
    expect(body).toContain('"id"');
    expect(body).not.toContain('""');
  });
});
