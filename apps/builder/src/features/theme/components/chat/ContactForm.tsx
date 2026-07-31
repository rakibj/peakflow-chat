import { createId } from "@paralleldrive/cuid2";
import type { ChatTheme, Contact } from "@typebot.io/theme/schemas";
import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { Switch } from "@typebot.io/ui/components/Switch";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";

type Props = {
  contact: ChatTheme["contact"];
  onContactChange: (contact: Contact) => void;
};

const defaultContact = {
  isEnabled: false,
  isAlwaysVisible: true,
  whatsAppLabel: "WhatsApp",
  callLabel: "Call us",
  locations: [],
  businessHours: {
    timeZone: "America/New_York",
    startHour: 9,
    endHour: 18,
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  availableMessage: "Our representatives are available now",
  unavailableMessage:
    "Our team is available {hours}. We'll respond as soon as we're back online.",
};

export const ContactForm = ({ contact, onContactChange }: Props) => {
  const currentContact = {
    ...defaultContact,
    ...contact,
    locations: contact?.locations ?? defaultContact.locations,
    businessHours: {
      ...defaultContact.businessHours,
      ...contact?.businessHours,
    },
  };
  const isEnabled = currentContact.isEnabled ?? false;

  const update = (patch: Partial<Contact>) =>
    onContactChange({
      ...currentContact,
      ...patch,
      businessHours: {
        ...currentContact.businessHours,
        ...patch.businessHours,
      },
    });

  const addLocation = () =>
    update({
      locations: [
        ...currentContact.locations,
        { id: createId(), label: "", phone: "" },
      ],
    });

  const updateLocation = (
    index: number,
    patch: Partial<NonNullable<Contact["locations"]>[number]>,
  ) =>
    update({
      locations: currentContact.locations.map((location, locationIndex) =>
        locationIndex === index ? { ...location, ...patch } : location,
      ),
    });

  const removeLocation = (index: number) =>
    update({
      locations: currentContact.locations.filter(
        (_, locationIndex) => locationIndex !== index,
      ),
    });

  return (
    <div className="flex flex-col border rounded-md p-4 gap-4">
      <Field.Root className="flex-row items-center">
        <Field.Label className="font-medium font-heading text-lg">
          Contact buttons
        </Field.Label>
        <Switch
          checked={isEnabled}
          onCheckedChange={(enabled) => update({ isEnabled: enabled })}
        />
      </Field.Root>
      {isEnabled && (
        <>
          <Field.Root className="flex-row items-center">
            <Field.Label>WhatsApp label</Field.Label>
            <Input
              size="sm"
              defaultValue={currentContact.whatsAppLabel}
              placeholder="WhatsApp"
              onValueChange={(whatsAppLabel) => update({ whatsAppLabel })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>WhatsApp link</Field.Label>
            <Input
              size="sm"
              defaultValue={currentContact.whatsAppUrl}
              placeholder="https://wa.me/15551234567"
              onValueChange={(whatsAppUrl) => update({ whatsAppUrl })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>WhatsApp icon (optional)</Field.Label>
            <Input
              size="sm"
              defaultValue={currentContact.whatsAppIconUrl}
              placeholder="Defaults to built-in icon"
              onValueChange={(whatsAppIconUrl) => update({ whatsAppIconUrl })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Call label</Field.Label>
            <Input
              size="sm"
              defaultValue={currentContact.callLabel}
              placeholder="Call us"
              onValueChange={(callLabel) => update({ callLabel })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Call icon (optional)</Field.Label>
            <Input
              size="sm"
              defaultValue={currentContact.callIconUrl}
              placeholder="Defaults to built-in icon"
              onValueChange={(callIconUrl) => update({ callIconUrl })}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label className="font-medium">Locations</Field.Label>
            {currentContact.locations.map((location, index) => (
              <div
                className="flex items-center gap-2"
                key={location.id ?? index}
              >
                <Input
                  size="sm"
                  defaultValue={location.label}
                  placeholder="Location name"
                  onValueChange={(label) => updateLocation(index, { label })}
                />
                <Input
                  size="sm"
                  defaultValue={location.phone}
                  placeholder="+1 555 123 4567"
                  onValueChange={(phone) => updateLocation(index, { phone })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => removeLocation(index)}
                  aria-label="Remove location"
                >
                  <TrashIcon />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addLocation}
            >
              <PlusSignIcon />
              Add location
            </Button>
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Available message</Field.Label>
            <Input
              size="sm"
              defaultValue={currentContact.availableMessage}
              placeholder="Our representatives are available now"
              onValueChange={(availableMessage) => update({ availableMessage })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Unavailable message</Field.Label>
            <Input
              size="sm"
              defaultValue={currentContact.unavailableMessage}
              placeholder="Our team is available {hours}."
              onValueChange={(unavailableMessage) =>
                update({ unavailableMessage })
              }
            />
          </Field.Root>
          <Field.Root>
            <Field.Description className="text-xs -mt-2">
              Use {"{hours}"} in the unavailable message to insert the open
              hours below (e.g. "9 AM - 6 PM EST").
            </Field.Description>
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Always visible</Field.Label>
            <Switch
              checked={currentContact.isAlwaysVisible ?? false}
              onCheckedChange={(isAlwaysVisible) => update({ isAlwaysVisible })}
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Timezone</Field.Label>
            <Input
              size="sm"
              defaultValue={currentContact.businessHours.timeZone}
              placeholder="America/New_York"
              onValueChange={(timeZone) =>
                update({
                  businessHours: { ...currentContact.businessHours, timeZone },
                })
              }
            />
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Hours</Field.Label>
            <div className="flex items-center gap-2">
              <Input
                size="sm"
                defaultValue={String(currentContact.businessHours.startHour)}
                placeholder="9"
                onValueChange={(startHour) =>
                  update({
                    businessHours: {
                      ...currentContact.businessHours,
                      startHour: Number(startHour),
                    },
                  })
                }
              />
              <span>to</span>
              <Input
                size="sm"
                defaultValue={String(currentContact.businessHours.endHour)}
                placeholder="18"
                onValueChange={(endHour) =>
                  update({
                    businessHours: {
                      ...currentContact.businessHours,
                      endHour: Number(endHour),
                    },
                  })
                }
              />
            </div>
          </Field.Root>
          <Field.Root className="flex-row items-center">
            <Field.Label>Open days</Field.Label>
            <Input
              size="sm"
              defaultValue={currentContact.businessHours.days.join(",")}
              placeholder="0,1,2,3,4,5,6"
              onValueChange={(days) =>
                update({
                  businessHours: {
                    ...currentContact.businessHours,
                    days: days
                      .split(",")
                      .map(Number)
                      .filter(
                        (day) => Number.isInteger(day) && day >= 0 && day <= 6,
                      ),
                  },
                })
              }
            />
          </Field.Root>
        </>
      )}
    </div>
  );
};
