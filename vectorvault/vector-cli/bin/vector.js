#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "0.1.0";
const BASE_URL = process.env.VECTORVAULT_URL || "https://vectorvault-two.vercel.app";
const args = process.argv.slice(2);
const command = args.shift() || "help";

const help = () => {
  console.log(`
Vector CLI ${VERSION} — Code, without the clutter.

USAGE
  vector <command> [arguments]

COMMANDS
  clone <owner/repository>   Clone a VectorVault repository
  init [owner/repository]    Initialize a repository here
  status                     Show working-tree status
  add <path|.>               Stage changes
  commit -m "message"        Create a commit
  push [remote] [branch]     Push commits
  pull [remote] [branch]     Pull changes
  branch                     List branches
  log                        Show recent commits
  version                    Show CLI version
  help                       Show this help

EXAMPLES
  vector clone prince/portfolio
  vector init
  vector add .
  vector commit -m "Build homepage"
  vector push

Learn more: https://vectorvault-two.vercel.app
`);
};

function runGit(gitArgs, options = {}) {
  const result = spawnSync("git", gitArgs, {
    stdio: "inherit",
    cwd: process.cwd(),
    shell: false,
    ...options,
  });
  if (result.error?.code === "ENOENT") {
    console.error("Git is required. Install Git, then run this command again.");
    process.exit(1);
  }
  process.exitCode = result.status ?? 1;
}

function requireRepoSlug(value) {
  if (!value || !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(value)) {
    console.error("Use the format: owner/repository");
    process.exit(1);
  }
  return value;
}

switch (command) {
  case "help":
  case "--help":
  case "-h":
    help();
    break;
  case "version":
  case "--version":
  case "-v":
    console.log(`Vector CLI v${VERSION}`);
    break;
  case "clone": {
    const slug = requireRepoSlug(args[0]);
    console.log(`Cloning ${slug} from VectorVault...`);
    console.log("Note: remote Git hosting is being built; clone becomes available when the VectorVault Git engine is online.");
    console.log(`Target: ${BASE_URL}/${slug}.git`);
    runGit(["clone", `${BASE_URL}/${slug}.git`]);
    break;
  }
  case "init": {
    const slug = args[0] ? requireRepoSlug(args[0]) : null;
    const result = spawnSync("git", ["init"], { stdio: "inherit", shell: false });
    if (result.error?.code === "ENOENT") {
      console.error("Git is required. Install Git, then run this command again.");
      process.exit(1);
      break;
    }
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
    if (slug) {
      const remote = `${BASE_URL}/${slug}.git`;
      const check = spawnSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" });
      const remoteArgs = check.status === 0
        ? ["remote", "set-url", "origin", remote]
        : ["remote", "add", "origin", remote];
      const updated = spawnSync("git", remoteArgs, { stdio: "inherit", shell: false });
      if (updated.status !== 0) process.exitCode = updated.status ?? 1;
      else console.log(`Connected origin to ${remote}`);
    }
    break;
  }
  case "status":
    runGit(["status", "--short", "--branch"]);
    break;
  case "add":
    if (!args.length) args.push(".");
    runGit(["add", ...args]);
    break;
  case "commit": {
    const messageIndex = args.indexOf("-m");
    if (messageIndex === -1 || !args[messageIndex + 1]) {
      console.error('Usage: vector commit -m "Your message"');
      process.exitCode = 1;
    } else {
      runGit(["commit", "-m", args[messageIndex + 1]]);
    }
    break;
  }
  case "push":
    runGit(["push", ...args]);
    break;
  case "pull":
    runGit(["pull", ...args]);
    break;
  case "branch":
    runGit(["branch", "--all"]);
    break;
  case "log":
    runGit(["log", "--oneline", "--decorate", "-10"]);
    break;
  default:
    console.error(`Unknown command: ${command}\n`);
    help();
    process.exitCode = 1;
}
