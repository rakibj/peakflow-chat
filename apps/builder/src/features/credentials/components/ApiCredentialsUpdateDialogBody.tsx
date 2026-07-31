import { useMutation, useQuery } from "@tanstack/react-query";
import type { ApiCredentials } from "@typebot.io/credentials/schemas";
import { isNotEmpty } from "@typebot.io/lib/utils";
import { Button } from "@typebot.io/ui/components/Button";
import { Dialog } from "@typebot.io/ui/components/Dialog";
import type React from "react";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { orpc } from "@/lib/queryClient";
import { toast } from "@/lib/toast";
import { ApiCredentialsDialogTitle } from "./ApiCredentialsCreateDialog";
import { ApiCredentialsFieldsForm } from "./ApiCredentialsFieldsForm";

type Props = {
  credentialsId: string;
  onUpdate: () => void;
};

export const ApiCredentialsUpdateDialogBody = ({
  credentialsId,
  onUpdate,
}: Props) => {
  const { workspace } = useWorkspace();
  const [name, setName] = useState<string>();
  const [fields, setFields] = useState<ApiCredentials["data"]["fields"]>();

  const { data: existingCredentials } = useQuery(
    orpc.credentials.getCredentials.queryOptions({
      input: {
        scope: "workspace",
        workspaceId: workspace?.id ?? "",
        credentialsId,
      },
      enabled: !!workspace?.id,
    }),
  );

  useEffect(() => {
    if (!existingCredentials || fields) return;
    setName(existingCredentials.name);
    setFields(
      (existingCredentials.data as ApiCredentials["data"]).fields.length > 0
        ? (existingCredentials.data as ApiCredentials["data"]).fields
        : [{ key: "", value: "" }],
    );
  }, [existingCredentials, fields]);

  const { mutate: updateCredentials, isPending } = useMutation(
    orpc.credentials.updateCredentials.mutationOptions({
      onError: (err) => {
        toast({ description: err.message });
      },
      onSuccess: () => {
        onUpdate();
      },
    }),
  );

  const usableFields = (fields ?? []).filter(
    (field) => isNotEmpty(field.key) && isNotEmpty(field.value),
  );

  const handleUpdateClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !workspace?.id ||
      !name ||
      !isNotEmpty(name) ||
      usableFields.length === 0
    )
      return;
    updateCredentials({
      credentialsId,
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
    <Dialog.Popup render={<form onSubmit={handleUpdateClick} />}>
      <ApiCredentialsDialogTitle mode="update" />
      <ApiCredentialsFieldsForm
        name={name ?? ""}
        onNameChange={setName}
        fields={fields ?? [{ key: "", value: "" }]}
        onFieldsChange={setFields}
      />
      <Dialog.Footer>
        <Button
          type="submit"
          disabled={
            !workspace?.id ||
            !isNotEmpty(name ?? "") ||
            usableFields.length === 0 ||
            isPending
          }
        >
          Update
        </Button>
      </Dialog.Footer>
    </Dialog.Popup>
  );
};
