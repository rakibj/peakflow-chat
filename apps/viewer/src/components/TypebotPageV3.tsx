import { Bubble, Standard } from "@typebot.io/react";
import { defaultSettings } from "@typebot.io/settings/constants";
import { BackgroundType } from "@typebot.io/theme/constants";
import type { Font } from "@typebot.io/theme/schemas";
import type { Typebot } from "@typebot.io/typebot/schemas/typebot";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { SEO } from "./Seo";

export type TypebotV3PageProps = {
  url: string;
  isMatchingViewerUrl?: boolean;
  name: string;
  publicId: string | null;
  font: Font | null;
  isHideQueryParamsEnabled: boolean | null;
  background: NonNullable<Typebot["theme"]["general"]>["background"];
  metadata: Typebot["settings"]["metadata"];
};

export const TypebotPageV3 = ({
  font,
  isMatchingViewerUrl,
  publicId,
  name,
  url,
  isHideQueryParamsEnabled,
  metadata,
  background,
}: TypebotV3PageProps) => {
  const { asPath, push, query } = useRouter();

  const isBubbleView = query.view === "bubble";

  const clearQueryParamsIfNecessary = () => {
    const hasQueryParams = asPath.includes("?");
    if (
      !hasQueryParams ||
      !(
        isHideQueryParamsEnabled ??
        defaultSettings.general.isHideQueryParamsEnabled
      )
    )
      return;
    push(asPath.split("?")[0], undefined, { shallow: true });
  };

  const apiOrigin = useMemo(() => {
    if (isMatchingViewerUrl) return;
    return new URL(url).origin;
  }, [isMatchingViewerUrl, url]);

  if (isBubbleView) {
    return (
      <div
        style={{
          height: "100dvh",
          backgroundColor: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SEO
          url={url}
          typebotName={name}
          metadata={metadata}
          isMatchingViewerUrl={isMatchingViewerUrl}
        />
        <p
          style={{
            color: "#9ca3af",
            fontSize: "0.875rem",
            userSelect: "none",
          }}
        >
          Chat bubble preview
        </p>
        <Bubble
          typebot={publicId ?? undefined}
          autoShowDelay={1000}
          font={font ?? undefined}
          apiHost={apiOrigin}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100dvh",
        // Set background color to avoid SSR flash
        backgroundColor:
          background?.type === BackgroundType.COLOR
            ? background?.content
            : background?.type === BackgroundType.NONE
              ? undefined
              : "#fff",
      }}
    >
      <SEO
        url={url}
        typebotName={name}
        metadata={metadata}
        isMatchingViewerUrl={isMatchingViewerUrl}
      />
      <Standard
        typebot={publicId ?? undefined}
        onInit={clearQueryParamsIfNecessary}
        font={font ?? undefined}
        apiHost={apiOrigin}
      />
    </div>
  );
};
