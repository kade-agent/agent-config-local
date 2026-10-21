// Run: node --test tests/rules.test.cjs
// The rules and skills fit the local setup: no GitHub, no push, no PRs; the commands they name
// exist in agent-board; the files fit their limits and Pi's skill format.
"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const board = require("../tools/agent-board.cjs");

const ROOT = path.join(__dirname, "..");
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
const SKILLS = fs.readdirSync(path.join(ROOT, "skills")).sort();
const RULES = read("AGENTS.md");
const TEXTS = [["AGENTS.md", RULES], ...SKILLS.map((s) => [`skills/${s}/SKILL.md`, read("skills", s, "SKILL.md")])];

// What only the GitHub setup has. "PR doc" is the local replacement and stays allowed.
const FORBIDDEN = [
  /\bKade\b/,
  /GitHub/,
  /\bgh\b/,
  /pull request/i,
  /\bPRs?\b(?! doc)/,
  /auto-merge/i,
  /\bcmd:/,
  /origin\/main/,
  /status branch/i,
  /\bActions\b/,
  /cloud session/i,
  /Antigravity/,
  /\bissues?\b/i,
];

test("the rules: version on line 1, at most 100 lines; CLAUDE.md only imports them", () => {
  assert.match(RULES.split("\n")[0], /^Local rules: local-\d{4}\.\d{2}\.\d{2}(\.\d+)?$/);
  assert.ok(RULES.trimEnd().split("\n").length <= 100, `${RULES.trimEnd().split("\n").length} lines`);
  assert.strictEqual(read("CLAUDE.md"), "@AGENTS.md\n");
});

test("nothing from the GitHub setup is left in the rules, the skills or the hook's messages", () => {
  const texts = [...TEXTS, ["hooks/context-guard.cjs", read("hooks", "context-guard.cjs")]];
  for (const [file, text] of texts) {
    for (const re of FORBIDDEN) {
      const line = text.split("\n").findIndex((l) => re.test(l));
      assert.strictEqual(line, -1, `${file}:${line + 1} matches ${re}: ${text.split("\n")[line]}`);
    }
  }
});

test("push appears only as something never done", () => {
  for (const [file, text] of TEXTS) {
    text.split("\n").forEach((l, i) => {
      if (/\bpush/i.test(l)) assert.match(l, /\b(never|no)\b/i, `${file}:${i + 1}: ${l}`);
    });
  }
});

test("the rules name AgentNotes, agent-board, the merge flow and the line-ending attributes", () => {
  for (const needed of ["AgentNotes", "~/.claude/tools/agent-board.cjs", "agent-board merge", ".git/info/attributes", "the developer", "PR doc"]) {
    assert.ok(RULES.includes(needed), needed);
  }
});

test("every agent-board command named in the rules and skills exists", () => {
  for (const [file, text] of TEXTS) {
    for (const m of text.matchAll(/agent-board(?:\.cjs)? ([a-z]+)/g)) {
      assert.ok(board.COMMANDS.includes(m[1]), `${file}: agent-board ${m[1]}`);
    }
  }
});

test("every skill the rules name exists, and every skill has Pi's frontmatter", () => {
  for (const m of RULES.matchAll(/`([a-z]+(?:-[a-z]+)+)` skill|skills? `([a-z-]+)`/g)) {
    const name = m[1] || m[2];
    assert.ok(SKILLS.includes(name), `AGENTS.md names ${name}`);
  }
  for (const s of SKILLS) {
    const text = read("skills", s, "SKILL.md");
    const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
    assert.ok(fm, `${s}: frontmatter`);
    const name = /^name: (.+)$/m.exec(fm[1])?.[1];
    const description = /^description: (.+)$/m.exec(fm[1])?.[1] || "";
    assert.strictEqual(name, s);
    assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(name.length <= 64);
    assert.ok(description.length > 0 && description.length <= 1024, `${s}: description ${description.length} characters`);
    assert.ok(text.trimEnd().split("\n").length <= 100, `${s}: at most 100 lines`);
  }
});

test("nothing points at the branch of agent-config this repository moved from", () => {
  const { execFileSync } = require("child_process");
  const files = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" }).split("\n").filter((f) => f && f !== "tests/rules.test.cjs");
  for (const file of files) {
    const text = read(file);
    const line = text.split("\n").findIndex((l) => /local-config (branch|line|clone)|-b local-config|branch local-config|github\.com\/kade-agent\/agent-config(?!-local)/.test(l));
    assert.strictEqual(line, -1, `${file}:${line + 1}: ${text.split("\n")[line]}`);
  }
  assert.match(read("README.md"), /git clone https:\/\/github\.com\/kade-agent\/agent-config-local /);
});

// The dispatcher flow, ported from the GitHub setup (2026-10-21) for Pi on a local model: the
// rules let a dispatcher's workers run in parallel on a plan the developer approved, and the
// skill runs the queue with agent-board, worktrees and the developer's yes before each merge.
test("the rules allow the dispatcher flow and keep the developer's approval their own", () => {
  const rules = RULES.replace(/\s+/g, " ");
  for (const needed of ["`dispatcher` skill", "approval of its plan recorded in its task file",
    "never the developer's approval", "red gate on the main branch is fixed or reverted"]) {
    assert.ok(rules.includes(needed), `AGENTS.md: ${needed}`);
  }
});

test("the dispatcher skill runs the queue with agent-board and worktrees, in Pi", () => {
  assert.ok(SKILLS.includes("dispatcher"), "skills/dispatcher exists");
  const skill = read("skills", "dispatcher", "SKILL.md");
  for (const needed of ["Pi", "agent-board start <id> --worktree", "agent-board finish", "agent-board merge",
    "git diff --name-only", "references/worker-prompt.md", "One replacement per task", "waiting=developer"]) {
    assert.ok(skill.includes(needed), `SKILL.md: ${needed}`);
  }
  const prompt = read("skills", "dispatcher", "references", "worker-prompt.md");
  for (const needed of ["DONE <id>", "BLOCKED <id>", "A placeholder is a value"]) {
    assert.ok(prompt.includes(needed), `worker-prompt.md: ${needed}`);
  }
});
