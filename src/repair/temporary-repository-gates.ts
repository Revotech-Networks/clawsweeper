import { ghJson, ghText } from "./github-cli.js";

export function withTemporaryRepositoryGates<T>(
  repo: string,
  names: readonly string[],
  operation: () => T,
): T {
  if (names.length === 0) return operation();

  // Repository presence and value must be known before any write. Effective
  // workflow environment values cannot describe what needs restoring here.
  const variables = ghJson<unknown>(["variable", "list", "--repo", repo, "--json", "name,value"]);
  if (!Array.isArray(variables)) throw new Error("Invalid repository variable snapshot");
  const previous = new Map<string, string>();
  for (const variable of variables) {
    if (
      !variable ||
      typeof variable !== "object" ||
      typeof variable.name !== "string" ||
      !variable.name ||
      typeof variable.value !== "string" ||
      previous.has(variable.name)
    ) {
      throw new Error("Invalid repository variable snapshot");
    }
    previous.set(variable.name, variable.value);
  }

  const attempted: string[] = [];
  let outcome: { value: T } | { error: unknown };
  try {
    for (const name of new Set(names)) {
      if (previous.get(name) === "1") continue;
      // A failed command can still have applied its write.
      attempted.push(name);
      setGate(name, "1");
    }
    outcome = { value: operation() };
  } catch (error) {
    outcome = { error };
  }

  const cleanupErrors: unknown[] = [];
  for (const name of attempted.reverse()) {
    try {
      const value = previous.get(name);
      if (value === undefined) {
        ghText(["variable", "delete", name, "--repo", repo]);
        console.log(`${name} deleted`);
      } else {
        setGate(name, value);
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      [...("error" in outcome ? [outcome.error] : []), ...cleanupErrors],
      "Failed to restore temporary repository gates",
    );
  }
  if ("error" in outcome) throw outcome.error;
  return outcome.value;

  function setGate(name: string, value: string) {
    ghText(["variable", "set", name, "--repo", repo, "--body", value]);
    console.log(`${name}=${value}`);
  }
}
