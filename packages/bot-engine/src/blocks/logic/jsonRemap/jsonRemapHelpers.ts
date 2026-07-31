import type { JsonRemapTransformation } from "@typebot.io/blocks-logic/jsonRemap/schema";

export { parseJsonArrayInput } from "@typebot.io/lib/parseJsonArray";

export const buildJsonRemapBody = (
  transformations: JsonRemapTransformation[],
  outputVariableName: string,
  pickOnly: boolean,
): string => {
  let mapBody: string;

  if (pickOnly) {
    const fieldLines = transformations
      .filter((t) => t.key)
      .map(({ key, expression }) =>
        expression
          ? `    __out[${JSON.stringify(key)}] = (($value) => { return (${expression}); })($item[${JSON.stringify(key)}]);`
          : `    __out[${JSON.stringify(key)}] = $item[${JSON.stringify(key)}];`,
      )
      .join("\n");
    mapBody = `    const __out = {};\n${fieldLines}\n    return __out;`;
  } else {
    const transformLines = transformations
      .filter((t) => t.key && t.expression)
      .map(
        ({ key, expression }) =>
          `    __clone[${JSON.stringify(key)}] = (($value) => { return (${expression}); })(__clone[${JSON.stringify(key)}]);`,
      )
      .join("\n");
    mapBody = `    const __clone = Object.assign({}, $item);\n${transformLines}\n    return __clone;`;
  }

  return `
try {
  const __result = __jsonRemapInput.map(function($item, $index) {
${mapBody}
  });
  setVariable(${JSON.stringify(outputVariableName)}, JSON.stringify(__result));
} catch (_e) {
  // invalid expression — fall through
}
`;
};
