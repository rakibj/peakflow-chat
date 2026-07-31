import type { LinkBubbleBlock } from "@typebot.io/blocks-bubbles/link/schema";

type Props = {
  block: LinkBubbleBlock;
};

export const LinkBubbleContent = ({ block }: Props) => {
  const label = block.content?.label;
  const url = block.content?.url;

  if (!url && !label) return <p className="text-gray-500">Click to edit</p>;

  return (
    <p className="text-sm truncate">
      {label ? (
        <>
          <span className="underline text-blue-500">{label}</span>
          {url && <span className="text-gray-400 ml-1 text-xs">→ {url}</span>}
        </>
      ) : (
        <span className="underline text-blue-500">{url}</span>
      )}
    </p>
  );
};
