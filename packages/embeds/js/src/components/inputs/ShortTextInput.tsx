import { splitProps } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";

type ShortTextInputProps = {
  ref?: HTMLInputElement | ((el: HTMLInputElement) => void);
  onInput: (value: string) => void;
  inputmode?: string;
} & Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "onInput">;

export const ShortTextInput = (props: ShortTextInputProps) => {
  const [local, others] = splitProps(props, ["ref", "onInput", "inputmode"]);

  return (
    <input
      ref={(el) => {
        if (typeof props.ref === "function") props.ref(el);
      }}
      dir="auto"
      class="focus:outline-none bg-transparent px-4 py-4 flex-1 w-full text-input"
      type="text"
      inputmode={local.inputmode}
      onInput={(e) => local.onInput(e.currentTarget.value)}
      {...others}
    />
  );
};
