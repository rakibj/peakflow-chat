import { Standard } from "@typebot.io/react";
import { defaultBackgroundColor } from "@typebot.io/theme/constants";
import { Seo } from "@/components/Seo";
import { TypebotHeader } from "@/features/editor/components/TypebotHeader";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { ThemeSideMenu } from "./ThemeSideMenu";

export const ThemePage = () => {
  const { typebot } = useTypebot();

  return (
    <div className="flex overflow-hidden h-screen flex-col">
      <Seo title={typebot?.name ? `${typebot.name} | Theme` : "Theme"} />
      <TypebotHeader />
      <div className="flex items-center w-full gap-4 h-[calc(100vh-var(--header-height))]">
        <ThemeSideMenu />
        <div className="flex flex-1 h-[calc(100%-2rem)] mr-4 relative rounded-xl overflow-hidden bg-[#f3f4f6] dark:bg-gray-3">
          {typebot && (
            <>
              {/* Bubble window frame */}
              <div
                className="absolute shadow-2xl rounded-xl overflow-hidden border border-black/10"
                style={{
                  width: "min(400px, calc(100% - 96px))",
                  height: "min(640px, calc(100% - 88px))",
                  bottom: "76px",
                  right: "24px",
                }}
              >
                <Standard
                  typebot={typebot}
                  apiHost={window.location.origin}
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor:
                      typebot.theme.general?.background?.content ??
                      defaultBackgroundColor[typebot.version],
                  }}
                />
              </div>
              {/* Decorative bubble button */}
              <div
                className="absolute bottom-6 right-6 rounded-2xl shadow-lg flex items-center justify-center"
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor:
                    typebot.theme.chat?.buttons?.backgroundColor ?? "#27272a",
                }}
              >
                <svg
                  viewBox="0 0 16 16"
                  style={{
                    width: "28px",
                    height: "28px",
                    fill: typebot.theme.chat?.buttons?.color ?? "#ffffff",
                  }}
                >
                  <title>Chat</title>
                  <path d="M8 15C12.418 15 16 11.866 16 8C16 4.134 12.418 1 8 1C3.582 1 0 4.134 0 8C0 9.76 0.743 11.37 1.97 12.6C1.873 13.616 1.553 14.73 1.199 15.566C1.12 15.752 1.273 15.96 1.472 15.928C3.728 15.558 5.069 14.99 5.652 14.694C6.41791 14.8983 7.20732 15.0012 8 15Z" />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
