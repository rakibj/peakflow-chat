import type {
  CardsBlock,
  CardsItem,
  CardsItemPath,
} from "@typebot.io/blocks-inputs/cards/schema";
import { isDefined } from "@typebot.io/lib/utils";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import { deepParseVariables } from "@typebot.io/variables/deepParseVariables";
import { findUniqueVariable } from "@typebot.io/variables/findUniqueVariable";
import type { Variable } from "@typebot.io/variables/schemas";
import { transformVariablesToList } from "@typebot.io/variables/transformVariablesToList";
import { filterCardsItems } from "./filterCardItems";

type ExtraButtonDynamicConfig = {
  values: Variable["value"];
  type: "player-choice" | "link" | undefined;
  text: string | undefined;
};

type DynamicProps = {
  pictureSrcs: Variable["value"];
  titles: Variable["value"];
  descriptions: Variable["value"];
  extraDescriptions: Variable["value"][];
  internalValues: Variable["value"];
  buttonTexts: Variable["value"];
  extraButtons: ExtraButtonDynamicConfig[];
};

export const injectVariableValuesInCardsBlock = (
  block: CardsBlock,
  {
    sessionStore,
    variables,
  }: { sessionStore: SessionStore; variables: Variable[] },
): CardsBlock => {
  const explicitDynamicProps = getExplicitDynamicProps(block, variables);
  if (explicitDynamicProps)
    return deepParseVariables(
      {
        ...block,
        items: createDynamicCards(
          block.items[0] ?? block.items[0],
          explicitDynamicProps,
        ),
      },
      { variables, sessionStore },
    );

  const dynamicProps = getDynamicProps(variables)(block);
  if (!dynamicProps)
    return deepParseVariables(
      filterCardsItems(block, { variables, sessionStore }),
      {
        variables,
        sessionStore,
      },
    );
  return deepParseVariables(
    {
      ...block,
      items: createDynamicCards(block.items[0], dynamicProps),
    },
    {
      variables,
      sessionStore,
    },
  );
};

const getJsonArraySourceProps = (
  source: NonNullable<CardsBlock["options"]>["jsonArraySource"],
  variables: Variable[],
): DynamicProps | undefined => {
  if (!source?.variableId) return undefined;

  const variable = variables.find(
    (v) => v.id === source.variableId && isDefined(v.value),
  );
  if (!variable) return undefined;

  let items: Record<string, unknown>[];
  try {
    if (typeof variable.value === "string") {
      const parsed = JSON.parse(variable.value);
      if (!Array.isArray(parsed)) return undefined;
      items = parsed as Record<string, unknown>[];
    } else if (Array.isArray(variable.value)) {
      items = variable.value
        .filter((item): item is string => item != null)
        .map((item) => JSON.parse(item) as Record<string, unknown>);
    } else {
      return undefined;
    }
  } catch {
    return undefined;
  }

  const pluck = (key?: string): (string | null)[] | undefined => {
    if (!key) return undefined;
    return items.map((item) => {
      const val = item[key];
      return val != null ? String(val) : null;
    });
  };

  const extraButtons: ExtraButtonDynamicConfig[] = (
    source.extraButtons ?? []
  ).map((btn) => ({
    values: pluck(btn.key),
    type: btn.type,
    text: btn.text,
  }));

  const props: DynamicProps = {
    pictureSrcs: pluck(source.imageUrlKey),
    titles: pluck(source.titleKey),
    descriptions: pluck(source.descriptionKey),
    extraDescriptions: (source.extraDescriptionKeys ?? [])
      .map((key) => pluck(key))
      .filter(isDefined),
    buttonTexts: pluck(source.buttonKey),
    internalValues: pluck(source.internalValueKey),
    extraButtons,
  };

  const hasDrivingArray =
    Array.isArray(props.titles) ||
    Array.isArray(props.pictureSrcs) ||
    Array.isArray(props.descriptions) ||
    Array.isArray(props.internalValues) ||
    Array.isArray(props.buttonTexts) ||
    props.extraButtons.some((b) => Array.isArray(b.values));

  if (!hasDrivingArray) return undefined;
  return props;
};

const getExplicitDynamicProps = (
  block: CardsBlock,
  variables: Variable[],
): DynamicProps | undefined => {
  const jsonArraySource = block.options?.jsonArraySource;
  if (jsonArraySource?.variableId) {
    const jsonProps = getJsonArraySourceProps(jsonArraySource, variables);
    if (jsonProps) return jsonProps;
  }

  const dynamicItems = block.options?.dynamicItems;
  if (!dynamicItems) return;
  const hasAny = Object.values(dynamicItems).some(Boolean);
  if (!hasAny) return;

  const getListValue = (id?: string): (string | null)[] | undefined => {
    if (!id) return undefined;
    const variable = variables.find((v) => v.id === id && isDefined(v.value));
    if (!variable) return undefined;
    const [transformed] = transformVariablesToList(variables)([id]);
    return transformed?.value as (string | null)[] | undefined;
  };

  const extraButtons: ExtraButtonDynamicConfig[] = (
    dynamicItems.extraButtons ?? []
  ).map((btn) => ({
    values: getListValue(btn.variableId),
    type: btn.type,
    text: btn.text,
  }));

  const props: DynamicProps = {
    pictureSrcs: getListValue(dynamicItems.imageUrlVariableId),
    titles: getListValue(dynamicItems.titleVariableId),
    descriptions: getListValue(dynamicItems.descriptionVariableId),
    extraDescriptions: (dynamicItems.extraDescriptionVariableIds ?? [])
      .map((id) => getListValue(id))
      .filter(isDefined),
    internalValues: getListValue(dynamicItems.internalValueVariableId),
    buttonTexts: getListValue(dynamicItems.buttonVariableId),
    extraButtons,
  };

  const hasDrivingArray =
    Array.isArray(props.titles) ||
    Array.isArray(props.pictureSrcs) ||
    Array.isArray(props.descriptions) ||
    Array.isArray(props.internalValues) ||
    Array.isArray(props.buttonTexts) ||
    props.extraButtons.some((b) => Array.isArray(b.values));

  if (!hasDrivingArray) return;
  return props;
};

const getDynamicProps =
  (variables: Variable[]) =>
  (block: CardsBlock): DynamicProps | undefined => {
    if (block.items.length !== 1) return;
    const item = block.items[0];
    const pictureSrcsVariable = findUniqueVariable(variables)(item.imageUrl);
    const titlesVariable = findUniqueVariable(variables)(item.title);
    const descriptionsVariable = findUniqueVariable(variables)(
      item.description,
    );
    const internalValuesVariable = findUniqueVariable(variables)(
      item.options?.internalValue,
    );
    const dynamicItems = {
      pictureSrcs: pictureSrcsVariable?.value,
      titles: titlesVariable?.value,
      descriptions: descriptionsVariable?.value,
      extraDescriptions: [] as Variable["value"][],
      internalValues: internalValuesVariable?.value,
      buttonTexts: undefined,
      extraButtons: [] as ExtraButtonDynamicConfig[],
    };
    if (
      !Array.isArray(dynamicItems.pictureSrcs) &&
      !Array.isArray(dynamicItems.titles) &&
      !Array.isArray(dynamicItems.descriptions)
    )
      return;
    return dynamicItems;
  };

const createDynamicCards = (
  item: CardsItem,
  dynamicProps: DynamicProps,
): CardsItem[] => {
  let drivingArray: Variable["value"] | undefined;

  if (Array.isArray(dynamicProps.titles)) {
    drivingArray = dynamicProps.titles;
  } else if (Array.isArray(dynamicProps.pictureSrcs)) {
    drivingArray = dynamicProps.pictureSrcs;
  } else if (Array.isArray(dynamicProps.descriptions)) {
    drivingArray = dynamicProps.descriptions;
  } else if (Array.isArray(dynamicProps.internalValues)) {
    drivingArray = dynamicProps.internalValues;
  } else if (Array.isArray(dynamicProps.buttonTexts)) {
    drivingArray = dynamicProps.buttonTexts;
  } else {
    const firstExtraWithArray = dynamicProps.extraButtons.find((b) =>
      Array.isArray(b.values),
    );
    if (firstExtraWithArray) drivingArray = firstExtraWithArray.values;
  }

  if (!drivingArray || !Array.isArray(drivingArray)) {
    return [];
  }
  const arrayLength = drivingArray.length;

  const cards: CardsItem[] = [];
  for (let idx = 0; idx < arrayLength; idx++) {
    const dynamicTitle = getDynamicValue(dynamicProps.titles, idx);
    const dynamicDescription = getDynamicValue(dynamicProps.descriptions, idx);
    const dynamicImageUrl = getDynamicValue(dynamicProps.pictureSrcs, idx);
    const dynamicInternalValue = getDynamicValue(
      dynamicProps.internalValues,
      idx,
    );
    const dynamicButtonText = getDynamicValue(dynamicProps.buttonTexts, idx);
    const dynamicExtraDescriptions = dynamicProps.extraDescriptions.map(
      (slot) => getDynamicValue(slot, idx) ?? null,
    );

    const extraButtonPaths: CardsItemPath[] = dynamicProps.extraButtons
      .filter((btn) => isDefined(btn.values))
      .map((extraBtn, extraIdx) => {
        const dynamicValue = getDynamicValue(extraBtn.values, idx);
        const isLink = extraBtn.type === "link";
        return {
          id: `dynamic-card-${idx}-extra-btn-${extraIdx}`,
          type: extraBtn.type ?? "player-choice",
          text: isLink ? extraBtn.text : (dynamicValue ?? extraBtn.text ?? ""),
          linkUrl: isLink ? (dynamicValue ?? undefined) : undefined,
        };
      });

    const templatePaths = item.paths ?? [];
    let mainPaths: CardsItemPath[];

    if (dynamicButtonText != null && templatePaths.length === 0) {
      mainPaths = [
        { id: `dynamic-card-${idx}-path-0`, text: dynamicButtonText },
      ];
    } else {
      mainPaths = templatePaths.map((path, pathIndex) => {
        const isDriven = pathIndex === 0 && dynamicButtonText != null;
        return {
          ...path,
          id: `dynamic-card-${idx}-path-${pathIndex}`,
          text:
            isDriven && path.type !== "link" ? dynamicButtonText : path.text,
          linkUrl:
            isDriven && path.type === "link" ? dynamicButtonText : path.linkUrl,
        };
      });
    }

    cards.push({
      ...item,
      title: dynamicTitle !== undefined ? dynamicTitle : item.title,
      description:
        dynamicDescription !== undefined
          ? dynamicDescription
          : item.description,
      extraDescriptions:
        dynamicExtraDescriptions.length > 0
          ? (item.extraDescriptions?.map(
              (staticVal, slotIdx) =>
                dynamicExtraDescriptions[slotIdx] ?? staticVal,
            ) ?? dynamicExtraDescriptions.filter((v) => v !== null))
          : item.extraDescriptions,
      imageUrl: dynamicImageUrl !== undefined ? dynamicImageUrl : item.imageUrl,
      paths: [...extraButtonPaths, ...mainPaths],
      options: {
        ...item.options,
        internalValue:
          dynamicInternalValue !== undefined
            ? dynamicInternalValue
            : item.options?.internalValue,
      },
    });
  }

  return cards;
};

const getDynamicValue = <T>(prop: T | T[], index: number): T | undefined =>
  Array.isArray(prop) ? prop[index] : prop;
