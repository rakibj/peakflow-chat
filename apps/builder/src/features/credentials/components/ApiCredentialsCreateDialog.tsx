import { useMutation } from "@tanstack/react-query";
import type { ApiCredentials } from "@typebot.io/credentials/schemas";
import { isNotEmpty } from "@typebot.io/lib/utils";
import { Button } from "@typebot.io/ui/components/Button";
import { Dialog } from "@typebot.io/ui/components/Dialog";
import type React from "react";
import { useState } from "react";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { orpc, queryClient } from "@/lib/queryClient";
import { toast } from "@/lib/toast";
import { ApiCredentialsFieldsForm } from "./ApiCredentialsFieldsForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNewCredentials: (id: string) => void;
};

export const ApiCredentialsCreateDialog = ({
  isOpen,
  onClose,
  onNewCredentials,
}: Props) => {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <ApiCredentialsCreateDialogBody
        onNewCredentials={(id) => {
          onNewCredentials(id);
          onClose();
        }}
      />
    </Dialog.Root>
  );
};

export const ApiCredentialsDialogTitle = ({
  mode,
}: {
  mode: "create" | "update";
}) => (
  <Dialog.Title>
    {mode === "create" ? "Create" : "Update"} API credentials
  </Dialog.Title>
);

export const ApiCredentialsCreateDialogBody = ({
  onNewCredentials,
}: Pick<Props, "onNewCredentials">) => {
  const { workspace } = useWorkspace();
  const [name, setName] = useState("");
  const [fields, setFields] = useState<ApiCredentials["data"]["fields"]>([
    { key: "", value: "" },
  ]);

  const { mutate: createCredentials, isPending } = useMutation(
    orpc.credentials.createCredentials.mutationOptions({
      onError: (err) => {
        toast({ description: err.message });
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.credentials.listCredentials.key(),
        });
        onNewCredentials(data.credentialsId);
      },
    }),
  );

  const usableFields = fields.filter(
    (field) => isNotEmpty(field.key) && isNotEmpty(field.value),
  );

  const handleCreateClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !workspace?.id ||
      isNotEmpty(name) === false ||
      usableFields.length === 0
    )
      return;
    createCredentials({
      credentials: {
        data: { fields: usableFields },
        name,
        type: "apiCredentials",
      },
      scope: "workspace",
      workspaceId: workspace.id,
    });
  };

  return (
    <Dialog.Popup render={<form onSubmit={handleCreateClick} />}>
      <ApiCredentialsDialogTitle mode="create" />
      <ApiCredentialsFieldsForm
        name={name}
        onNameChange={setName}
        fields={fields}
        onFieldsChange={setFields}
      />
      <Dialog.Footer>
        <Button
          type="submit"
          disabled={
            !workspace?.id ||
            !isNotEmpty(name) ||
            usableFields.length === 0 ||
            isPending
          }
        >
          Create
        </Button>
      </Dialog.Footer>
    </Dialog.Popup>
  );
};
