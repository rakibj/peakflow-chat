import { useTranslate } from "@tolgee/react";
import { EventType } from "@typebot.io/events/constants";
import type { InterruptionEvent } from "@typebot.io/events/schemas";
import { Badge } from "@typebot.io/ui/components/Badge";
import { EventIcon } from "@/features/events/components/EventIcon";

type Props = {
  options: InterruptionEvent["options"];
};

export const InterruptionEventNode = ({ options }: Props) => {
  const { t } = useTranslate();

  return (
    <div className="flex items-center gap-3 font-normal">
      <EventIcon type={EventType.INTERRUPTION} />
      {options?.isEnabled ? (
        <Badge className="p-2">{t("enabled")}</Badge>
      ) : (
        <p className="font-normal" color="gray.500">
          {t("configure")}
        </p>
      )}
    </div>
  );
};
