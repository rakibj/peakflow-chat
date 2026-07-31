/**
 * Diffs a bot's preset-text source file against its cached translation
 * dictionary and fills in only the missing/changed keys via one AI call
 * per target language, so the dictionary can be baked into the bot as a
 * static variable (zero AI latency at runtime).
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-... bun run scripts/translate-bot-presets.ts \
 *     builds/maison-lefleur-translations.source.json \
 *     builds/maison-lefleur-translations.json \
 *     ru,es
 */

type SourceEntry = { key: string; en: string };
type Dictionary = Record<string, Record<string, string>>;

const [sourcePath, outputPath, targetLanguagesArg] = process.argv.slice(2);

if (!sourcePath || !outputPath) {
  console.error(
    "Usage: bun run scripts/translate-bot-presets.ts <source.json> <output.json> [targetLanguages=ru,es]",
  );
  process.exit(1);
}

const targetLanguages = (targetLanguagesArg ?? "ru,es")
  .split(",")
  .map((lang) => lang.trim())
  .filter(Boolean);

const source: SourceEntry[] = await Bun.file(sourcePath).json();

const existingDictionary: Dictionary = await Bun.file(outputPath)
  .json()
  .catch(() => ({}));

const dictionary: Dictionary = { en: {}, ...existingDictionary };
for (const entry of source) dictionary.en[entry.key] = entry.en;

const translateBatch = async (language: string, entries: SourceEntry[]) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey)
    throw new Error(
      "OPENROUTER_API_KEY is not set — required to translate new/changed phrases",
    );

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.1-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You translate short customer-facing chat copy for a flower shop. Keep the tone warm and concise. Return strict JSON only: an object mapping each input key to its translation, no extra keys, no commentary.",
          },
          {
            role: "user",
            content: `Translate the following English strings to ${language} (ISO 639-1 code). Input:\n${JSON.stringify(
              Object.fromEntries(entries.map((entry) => [entry.key, entry.en])),
            )}`,
          },
        ],
      }),
    },
  );

  if (!response.ok)
    throw new Error(
      `OpenRouter request failed (${response.status}): ${await response.text()}`,
    );

  const { choices } = await response.json();
  const translations = JSON.parse(choices[0].message.content);
  return translations as Record<string, string>;
};

for (const language of targetLanguages) {
  const existingForLanguage = dictionary[language] ?? {};
  const missingOrChanged = source.filter(
    (entry) => existingForLanguage[entry.key] === undefined,
  );

  if (missingOrChanged.length === 0) {
    console.log(`[${language}] up to date (${source.length} keys)`);
    continue;
  }

  console.log(
    `[${language}] translating ${missingOrChanged.length} new/changed key(s)...`,
  );
  const translated = await translateBatch(language, missingOrChanged);
  dictionary[language] = { ...existingForLanguage, ...translated };
}

await Bun.write(outputPath, `${JSON.stringify(dictionary, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
