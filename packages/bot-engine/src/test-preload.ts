import { mock } from "bun:test";

process.env.SKIP_ENV_CHECK = "true";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";

mock.module("isolated-vm", () => ({
  default: {},
  Isolate: class {},
  Context: class {},
}));
