#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
} from "node:fs";
import path from "node:path";

const GENERATED_PATHS = [
  "records",
  "jobs",
  "results",
  "assets",
  "apply-report.json",
  "repair-apply-report.json",
];

type Args = {
  stateDir?: string;
  worktree?: string;
};

const args = parseArgs(process.argv.slice(2));
const stateRoot = path.resolve(
  args.stateDir ?? process.env.CLAWSWEEPER_STATE_DIR ?? "../clawsweeper-state",
);
const worktreeRoot = path.resolve(args.worktree ?? process.cwd());

if (!existsSync(stateRoot)) {
  throw new Error(`State directory does not exist: ${stateRoot}`);
}

if (!GENERATED_PATHS.some((relativePath) => existsSync(path.join(stateRoot, relativePath)))) {
  throw new Error(
    `State directory has no generated paths: ${stateRoot}. Check out the generated state branch first, for example: git -C ${stateRoot} switch state`,
  );
}

const stateRoots = sourceAccessPaths(stateRoot);
const sources = GENERATED_PATHS.flatMap((relativePath) =>
  sourceAccessPaths(path.join(stateRoot, relativePath)),
);
for (const relativePath of GENERATED_PATHS) {
  const destinationPath = path.join(worktreeRoot, relativePath);
  const destinations = [destinationPath, resolveExistingPath(destinationPath)];
  if (
    destinations.some(
      (destination) =>
        stateRoots.some((source) => containsPath(destination, source)) ||
        sources.some(
          (source) => containsPath(source, destination) || containsPath(destination, source),
        ),
    )
  ) {
    throw new Error(
      `Hydration paths overlap: ${path.join(worktreeRoot, relativePath)} and ${stateRoot}`,
    );
  }
}

for (const relativePath of GENERATED_PATHS) {
  const source = path.join(stateRoot, relativePath);
  const destination = path.join(worktreeRoot, relativePath);
  rmSync(destination, { force: true, recursive: true });
  if (!existsSync(source)) continue;
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
}

console.log(JSON.stringify({ hydrated: GENERATED_PATHS, source: stateRoot, target: worktreeRoot }));

function sourceAccessPaths(filePath: string, seen = new Set<string>()): string[] {
  if (seen.has(filePath)) return [];
  seen.add(filePath);
  const paths = [filePath, resolveExistingPath(filePath)];
  // Keep symlink traversal paths: deleting an intermediate link also destroys access.
  for (let entry = filePath; entry !== path.dirname(entry); entry = path.dirname(entry)) {
    if (!lstatSync(entry, { throwIfNoEntry: false })?.isSymbolicLink()) continue;
    const linkedPath = path.resolve(
      path.dirname(entry),
      readlinkSync(entry),
      path.relative(entry, filePath),
    );
    paths.push(...sourceAccessPaths(linkedPath, seen));
  }
  return paths;
}

function resolveExistingPath(filePath: string): string {
  if (existsSync(filePath)) return realpathSync(filePath);
  return path.join(resolveExistingPath(path.dirname(filePath)), path.basename(filePath));
}

function containsPath(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}

function parseArgs(argv: string[]): Args {
  const parsed: Args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    if (arg === "--state-dir") parsed.stateDir = requiredValue(argv, ++index, arg);
    else if (arg === "--worktree") parsed.worktree = requiredValue(argv, ++index, arg);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function requiredValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}
