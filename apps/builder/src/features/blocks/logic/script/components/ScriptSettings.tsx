import { defaultScriptOptions } from "@typebot.io/blocks-logic/script/constants";
import type { ScriptBlock } from "@typebot.io/blocks-logic/script/schema";
import { DebouncedTextInput } from "@typebot.io/ui/components/DebouncedTextInput";
import { Field } from "@typebot.io/ui/components/Field";
import { MoreInfoTooltip } from "@typebot.io/ui/components/MoreInfoTooltip";
import { Switch } from "@typebot.io/ui/components/Switch";
import { useState } from "react";
import { CodeEditor } from "@/components/inputs/CodeEditor";
import { ApiCredentialsCreateDialog } from "@/features/credentials/components/ApiCredentialsCreateDialog";
import { CredentialsDropdown } from "@/features/credentials/components/CredentialsDropdown";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { UnsafeScriptAlert } from "./UnsafeScriptAlert";

type Props = {
  options: ScriptBlock["options"];
  onOptionsChange: (options: ScriptBlock["options"]) => void;
};

export const ScriptSettings = ({ options, onOptionsChange }: Props) => {
  const { workspace } = useWorkspace();
  const [isCreateCredentialsOpen, setIsCreateCredentialsOpen] = useState(false);

  const handleNameChange = (name: string) =>
    onOptionsChange({ ...options, name });

  const handleCodeChange = (content: string) =>
    onOptionsChange({ ...options, content });

  const updateClientExecution = (isExecutedOnClient: boolean) =>
    onOptionsChange({ ...options, isExecutedOnClient });

  const updateIsUnsafe = () => onOptionsChange({ ...options, isUnsafe: false });

  const updateCredentialsId = (credentialsId?: string) =>
    onOptionsChange({ ...options, credentialsId });

  const isExecutedOnClient =
    options?.isExecutedOnClient ?? defaultScriptOptions.isExecutedOnClient;

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Name:</Field.Label>
        <DebouncedTextInput
          defaultValue={options?.name ?? defaultScriptOptions.name}
          onValueChange={handleNameChange}
        />
      </Field.Root>
      <Field.Root className="flex-row items-center">
        <Switch
          checked={
            options?.isExecutedOnClient ??
            defaultScriptOptions.isExecutedOnClient
          }
          onCheckedChange={updateClientExecution}
        />
        <Field.Label>
          Execute on client{" "}
          <MoreInfoTooltip>
            Check this if you need access to client variables like `window` or
            `document`."
          </MoreInfoTooltip>
        </Field.Label>
      </Field.Root>
      {options?.isUnsafe === true && options?.isExecutedOnClient !== false && (
        <UnsafeScriptAlert onTrustClick={updateIsUnsafe} />
      )}
      {!isExecutedOnClient && workspace?.id && (
        <Field.Root>
          <Field.Label>
            API credentials:{" "}
            <MoreInfoTooltip>
              Secrets stored here are decrypted server-side and exposed as a{" "}
              <code>credentials</code> object in this script — they are never
              saved in the script's code or exported bot file.
            </MoreInfoTooltip>
          </Field.Label>
          <CredentialsDropdown
            type="apiCredentials"
            scope={{ type: "workspace", workspaceId: workspace.id }}
            currentCredentialsId={options?.credentialsId}
            credentialsName="API credentials"
            onCredentialsSelect={updateCredentialsId}
            onCreateNewClick={() => setIsCreateCredentialsOpen(true)}
            hideIfNoCredentials={false}
          />
          <ApiCredentialsCreateDialog
            isOpen={isCreateCredentialsOpen}
            onClose={() => setIsCreateCredentialsOpen(false)}
            onNewCredentials={updateCredentialsId}
          />
        </Field.Root>
      )}
      <CodeEditor
        defaultValue={options?.content}
        lang="js"
        onChange={handleCodeChange}
        withLineNumbers={true}
      />
    </div>
  );
};
