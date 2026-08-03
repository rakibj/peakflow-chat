import type {
  ChatHeader as ChatHeaderTheme,
  Contact,
} from "@typebot.io/theme/schemas";
import { createSignal, For, onCleanup, Show } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { formatPhoneForDisplay } from "../utils/formatPhoneForDisplay";
import { PhoneIcon } from "./icons/PhoneIcon";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";

type Props = {
  header: ChatHeaderTheme;
  avatarUrl?: string;
  contact?: Contact;
  onClose?: () => void;
};

const statusDotColor = "#22c55e";
const defaultAvailableMessage = "Our representatives are available now";
const defaultUnavailableMessage =
  "Our team is available {hours}. We'll respond as soon as we're back online.";

const ContactIcon = (props: {
  iconUrl?: string;
  alt: string;
  fallback: JSX.Element;
}) => (
  <Show when={props.iconUrl} keyed fallback={props.fallback}>
    {(iconUrl) => (
      <img
        src={iconUrl}
        alt={props.alt}
        class="w-[18px] h-[18px] object-contain"
      />
    )}
  </Show>
);

export const ChatHeader = (props: Props) => {
  const [isContactMenuOpen, setIsContactMenuOpen] = createSignal(false);
  let callMenuRef: HTMLDivElement | undefined;
  const isContactAvailable = () =>
    props.contact &&
    (props.contact.isEnabled ?? true) &&
    (props.contact.isAlwaysVisible ||
      isWithinBusinessHours(props.contact.businessHours));
  const hasCallOptions = () => (props.contact?.locations?.length ?? 0) > 0;

  const closeCallMenuIfOutside = (event: MouseEvent) => {
    if (callMenuRef && !event.composedPath().includes(callMenuRef))
      setIsContactMenuOpen(false);
  };
  document.addEventListener("click", closeCallMenuIfOutside, true);
  onCleanup(() =>
    document.removeEventListener("click", closeCallMenuIfOutside, true),
  );

  const closeCallMenuOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") setIsContactMenuOpen(false);
  };
  document.addEventListener("keydown", closeCallMenuOnEscape);
  onCleanup(() =>
    document.removeEventListener("keydown", closeCallMenuOnEscape),
  );

  return (
    <div
      part="chat-header"
      dir="auto"
      class="w-full flex items-start gap-3 px-4 py-3 shrink-0 border-b border-black/10"
      style={{
        "background-color": props.header.backgroundColor ?? "#ffffff",
        color: props.header.textColor ?? "#27272A",
      }}
    >
      <Show when={props.avatarUrl} keyed>
        {(avatarUrl) => (
          <img
            src={avatarUrl}
            class="w-10 h-10 rounded-full object-cover shrink-0"
            alt="Bot avatar"
          />
        )}
      </Show>
      <div class="flex flex-col min-w-0 flex-1">
        <Show when={props.header.name}>
          <span
            class="font-semibold leading-tight truncate"
            style={{ "font-size": "15px" }}
            title={props.header.name}
          >
            {props.header.name}
          </span>
        </Show>
        <Show when={props.header.status || props.header.tagline}>
          <div class="flex items-center gap-1 text-xs leading-tight mt-0.5">
            <Show when={props.header.status}>
              <span
                class="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ "background-color": statusDotColor }}
              />
              <span style={{ color: statusDotColor }}>
                {props.header.status}
              </span>
            </Show>
            <Show when={props.header.status && props.header.tagline}>
              <span class="opacity-40">•</span>
            </Show>
            <Show when={props.header.tagline}>
              <span class="opacity-60">{props.header.tagline}</span>
            </Show>
          </div>
        </Show>
        <Show when={props.contact?.isEnabled}>
          <div class="flex flex-col gap-1.5 mt-1 min-w-0" ref={callMenuRef}>
            <div class="flex items-center gap-2 text-xs leading-tight min-w-0">
              <Show
                when={isContactAvailable()}
                fallback={
                  <span
                    class="opacity-60 truncate"
                    title={formatUnavailableMessage(props.contact)}
                  >
                    {formatUnavailableMessage(props.contact)}
                  </span>
                }
              >
                <span
                  class="opacity-60 truncate flex-1 min-w-0"
                  title={
                    props.contact?.availableMessage ?? defaultAvailableMessage
                  }
                >
                  {props.contact?.availableMessage ?? defaultAvailableMessage}
                </span>
                <div class="flex items-center gap-0.5 shrink-0">
                  <Show
                    when={props.contact?.whatsAppUrl}
                    fallback={
                      <button
                        type="button"
                        part="chat-header-whatsapp"
                        class="flex items-center justify-center w-8 h-8 rounded-full opacity-40 cursor-not-allowed"
                        aria-disabled="true"
                        aria-label={props.contact?.whatsAppLabel ?? "WhatsApp"}
                        title={props.contact?.whatsAppLabel ?? "WhatsApp"}
                      >
                        <ContactIcon
                          iconUrl={props.contact?.whatsAppIconUrl}
                          alt={props.contact?.whatsAppLabel ?? "WhatsApp"}
                          fallback={<WhatsAppIcon class="w-[18px] h-[18px]" />}
                        />
                      </button>
                    }
                  >
                    {(whatsAppUrl) => (
                      <a
                        href={whatsAppUrl()}
                        target="_blank"
                        rel="noreferrer"
                        part="chat-header-whatsapp"
                        class="flex items-center justify-center w-8 h-8 rounded-full no-underline transition-colors hover:bg-black/5"
                        aria-label={props.contact?.whatsAppLabel ?? "WhatsApp"}
                        title={props.contact?.whatsAppLabel ?? "WhatsApp"}
                      >
                        <ContactIcon
                          iconUrl={props.contact?.whatsAppIconUrl}
                          alt={props.contact?.whatsAppLabel ?? "WhatsApp"}
                          fallback={<WhatsAppIcon class="w-[18px] h-[18px]" />}
                        />
                      </a>
                    )}
                  </Show>
                  <button
                    type="button"
                    part="chat-header-call"
                    class="flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-black/5"
                    onClick={() => setIsContactMenuOpen(!isContactMenuOpen())}
                    aria-expanded={isContactMenuOpen()}
                    aria-label={props.contact?.callLabel ?? "Call us"}
                    title={props.contact?.callLabel ?? "Call us"}
                  >
                    <ContactIcon
                      iconUrl={props.contact?.callIconUrl}
                      alt={props.contact?.callLabel ?? "Call us"}
                      fallback={<PhoneIcon class="w-[18px] h-[18px]" />}
                    />
                  </button>
                </div>
              </Show>
            </div>
            <Show when={isContactAvailable() && isContactMenuOpen()}>
              <div
                part="chat-header-call-menu"
                dir="auto"
                class="flex flex-col gap-0.5 rounded-lg border border-black/10 bg-black/[0.03] p-1"
                style={{ color: "#27272A" }}
              >
                <For each={props.contact?.locations}>
                  {(location) => (
                    <a
                      href={`tel:${location.phone}`}
                      class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs no-underline transition-colors hover:bg-white"
                      onClick={() => setIsContactMenuOpen(false)}
                    >
                      <PhoneIcon class="w-3.5 h-3.5 shrink-0 opacity-50" />
                      <span class="truncate">{location.label}</span>
                      <span class="ms-auto shrink-0 opacity-50" dir="ltr">
                        {formatPhoneForDisplay(location.phone)}
                      </span>
                    </a>
                  )}
                </For>
                <Show when={!hasCallOptions()}>
                  <span class="flex px-2.5 py-1.5 text-xs text-black/50">
                    Store phone numbers are being configured.
                  </span>
                </Show>
              </div>
            </Show>
          </div>
        </Show>
      </div>
      <Show when={props.onClose}>
        <div class="flex items-center shrink-0" style={{ gap: "2px" }}>
          <button
            type="button"
            part="chat-header-minimize"
            class="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ opacity: "0.55" }}
            onClick={() => props.onClose?.()}
            aria-label="Minimize"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.55";
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "transparent";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <title>Minimize</title>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            type="button"
            part="chat-header-close"
            class="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ opacity: "0.55" }}
            onClick={() => props.onClose?.()}
            aria-label="Close"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.55";
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "transparent";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <title>Close</title>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </Show>
    </div>
  );
};

const isWithinBusinessHours = (businessHours: Contact["businessHours"]) => {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: businessHours.timeZone,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts();
  const hour = Number(dateParts.find((part) => part.type === "hour")?.value);
  const weekday = dateParts.find((part) => part.type === "weekday")?.value;
  const weekdayIndex = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(weekday ?? "");

  return (
    weekdayIndex >= 0 &&
    businessHours.days.includes(weekdayIndex) &&
    hour >= businessHours.startHour &&
    hour < businessHours.endHour
  );
};

const formatHour = (hour: number) => {
  const normalized = hour % 24;
  const period = normalized >= 12 ? "PM" : "AM";
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${hour12} ${period}`;
};

const formatBusinessHoursRange = (businessHours: Contact["businessHours"]) => {
  const range = `${formatHour(businessHours.startHour)} - ${formatHour(businessHours.endHour)}`;
  const timeZoneName = (() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: businessHours.timeZone,
        timeZoneName: "short",
      })
        .formatToParts(new Date())
        .find((part) => part.type === "timeZoneName")?.value;
    } catch {
      return undefined;
    }
  })();
  return timeZoneName ? `${range} ${timeZoneName}` : range;
};

const formatUnavailableMessage = (contact: Contact | undefined) => {
  if (!contact) return "";
  const template = contact.unavailableMessage ?? defaultUnavailableMessage;
  return template.replace(
    "{hours}",
    formatBusinessHoursRange(contact.businessHours),
  );
};
