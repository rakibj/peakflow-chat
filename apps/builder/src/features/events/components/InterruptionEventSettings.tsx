import { useTranslate } from "@tolgee/react";
import type { BlockV6 } from "@typebot.io/blocks-core/schemas/schema";
import type { Credentials } from "@typebot.io/credentials/schemas";
import {
  defaultInterruptionCredentialsId,
  defaultInterruptionHistoryWindow,
  defaultInterruptionInstructions,
  defaultInterruptionModel,
  defaultInterruptionProvider,
  defaultInterruptionSupportedLanguages,
} from "@typebot.io/events/constants";
import type { InterruptionEvent } from "@typebot.io/events/schemas";
import { forgedBlocks } from "@typebot.io/forge-repository/definitions";
import { Field } from "@typebot.io/ui/components/Field";
import { Switch } from "@typebot.io/ui/components/Switch";
import type { Variable } from "@typebot.io/variables/schemas";
import { useState } from "react";
import { BasicAutocompleteInput } from "@/components/inputs/BasicAutocompleteInput";
import { BasicNumberInput } from "@/components/inputs/BasicNumberInput";
import { BasicSelect } from "@/components/inputs/BasicSelect";
import { DebouncedTextarea } from "@/components/inputs/DebouncedTextarea";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { TagsInput } from "@/components/TagsInput";
import { CredentialsCreateDialog } from "@/features/credentials/components/CredentialsCreateDialog";
import { CredentialsDropdown } from "@/features/credentials/components/CredentialsDropdown";
import { BlockIcon } from "@/features/editor/components/BlockIcon";
import { BlockLabel } from "@/features/editor/components/BlockLabel";
import { ForgeSelectInput } from "@/features/forge/components/ForgeSelectInput";
import { useForgedBlock } from "@/features/forge/hooks/useForgedBlock";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";

type Provider = NonNullable<InterruptionEvent["options"]>["provider"];

type Props = {
  options: InterruptionEvent["options"];
  onOptionsChange: (options: InterruptionEvent["options"]) => void;
};

export const InterruptionEventSettings = ({
  options,
  onOptionsChange,
}: Props) => {
  const { t } = useTranslate();
  const { workspace } = useWorkspace();
  const [isCredsDialogOpen, setIsCredsDialogOpen] = useState(false);
  const [credsCreatingType, setCredsCreatingType] = useState<
    string | undefined
  >();
  const provider = options?.provider ?? defaultInterruptionProvider;
  const credentialsId =
    options?.credentialsId ?? defaultInterruptionCredentialsId;

  const { blockDef, actionDef } = useForgedBlock({
    nodeType: provider as BlockV6["type"],
    feature: "aiGenerate",
  });

  const updateCredentialsId = (credentialsId?: string) => {
    onOptionsChange({ ...options, credentialsId });
    setIsCredsDialogOpen(false);
    setCredsCreatingType(undefined);
  };

  const updateLocationVariableId = (variable?: Pick<Variable, "id">) =>
    onOptionsChange({ ...options, locationVariableId: variable?.id });

  const updateLanguageVariableId = (variable?: Pick<Variable, "id">) =>
    onOptionsChange({ ...options, languageVariableId: variable?.id });

  return (
    <div className="flex flex-col gap-3">
      <Field.Root className="flex-row items-center">
        <Switch
          checked={options?.isEnabled ?? false}
          onCheckedChange={(isEnabled) =>
            onOptionsChange({ ...options, isEnabled })
          }
        />
        <Field.Label>
          {t("blocks.events.interruption.settings.isEnabled.label")}
        </Field.Label>
      </Field.Root>
      <div className="flex items-center gap-2 flex-wrap">
        <Field.Root className="flex-row items-center">
          <Field.Label>Provider:</Field.Label>
          <BasicSelect
            placeholder="Select"
            items={Object.values(forgedBlocks)
              .filter((block) => block.actions.some((a) => a.aiGenerate))
              .map((block) => ({
                value: block.id as Provider,
                label: (
                  <div className="flex items-center gap-2">
                    <BlockIcon type={block.id} className="size-4" />
                    <BlockLabel type={block.id} />
                  </div>
                ),
              }))}
            value={provider}
            onChange={(provider) => onOptionsChange({ ...options, provider })}
          />
        </Field.Root>
        {workspace && (
          <CredentialsDropdown
            scope={{ type: "workspace", workspaceId: workspace.id }}
            type={provider as Credentials["type"]}
            currentCredentialsId={credentialsId}
            onCredentialsSelect={updateCredentialsId}
            onCreateNewClick={() => {
              setCredsCreatingType(provider);
              setIsCredsDialogOpen(true);
            }}
            credentialsName="account"
          />
        )}
        {blockDef && actionDef?.aiGenerate && (
          <div className="flex items-center gap-0">
            {actionDef.aiGenerate.models.type === "dynamic" ? (
              <ForgeSelectInput
                defaultValue={options?.model ?? defaultInterruptionModel}
                blockDef={blockDef}
                credentialsScope="workspace"
                fetcherId={actionDef.aiGenerate.models.fetcherId}
                options={{ credentialsId }}
                onChange={(model) => onOptionsChange({ ...options, model })}
              />
            ) : (
              <BasicAutocompleteInput
                items={actionDef.aiGenerate.models.items}
                defaultValue={options?.model ?? defaultInterruptionModel}
                onChange={(model) => onOptionsChange({ ...options, model })}
              />
            )}
          </div>
        )}
      </div>
      <Field.Root>
        <Field.Label>
          {t("blocks.events.interruption.settings.instructions.label")}
        </Field.Label>
        <Field.Control
          render={(props) => (
            <DebouncedTextarea
              {...props}
              defaultValue={
                options?.instructions ?? defaultInterruptionInstructions
              }
              onValueChange={(instructions) =>
                onOptionsChange({ ...options, instructions })
              }
            />
          )}
        />
      </Field.Root>
      <Field.Root className="flex-row items-center">
        <Field.Label>
          {t("blocks.events.interruption.settings.historyWindow.label")}
        </Field.Label>
        <BasicNumberInput
          defaultValue={
            options?.historyWindow ?? defaultInterruptionHistoryWindow
          }
          min={1}
          max={100}
          withVariableButton={false}
          onValueChange={(historyWindow) =>
            onOptionsChange({ ...options, historyWindow })
          }
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>
          {t("blocks.events.interruption.settings.locationVariableId.label")}
        </Field.Label>
        <VariablesCombobox
          initialVariableId={options?.locationVariableId}
          onSelectVariable={updateLocationVariableId}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>
          {t("blocks.events.interruption.settings.languageVariableId.label")}
        </Field.Label>
        <VariablesCombobox
          initialVariableId={options?.languageVariableId}
          onSelectVariable={updateLanguageVariableId}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>
          {t("blocks.events.interruption.settings.supportedLanguages.label")}
        </Field.Label>
        <TagsInput
          items={
            options?.supportedLanguages ?? defaultInterruptionSupportedLanguages
          }
          placeholder="en, ru, es"
          onValueChange={(supportedLanguages) =>
            onOptionsChange({ ...options, supportedLanguages })
          }
        />
      </Field.Root>
      <CredentialsCreateDialog
        type={credsCreatingType as Credentials["type"]}
        scope="workspace"
        isOpen={isCredsDialogOpen}
        onClose={() => setIsCredsDialogOpen(false)}
        onSubmit={updateCredentialsId}
      />
    </div>
  );
};
