# agent-config-local

The global rules, skills and tools for agents (Claude Code, Pi) on a Windows PC whose
repositories are local only: no push, no remote to manage, no CI, a local model. Public, and
kept generic: nothing here names a company, a path or a host.

It began on 2026-10-16 as a branch of `kade-agent/agent-config`, the GitHub setup (releases,
issues, the Project, Actions), and moved here with its history. The two never merge; a fix to a
shared part (`hooks/context-guard.cjs`, the skills) is ported by hand.

## What replaces what

| GitHub setup (`agent-config`) | Here |
|---|---|
| Issues, Project fields, `cmd:` labels | Task files in `AgentNotes\<project>\tasks\`, changed with `agent-board set` |
| `STATUS.md` on the `status` branch | `AgentNotes\<project>\STATUS.md`, rewritten on every change |
| Pull request and its description | The task branch, the PR doc in `AgentNotes\<project>\prs\`; `agent-board merge` after the developer's yes |
| Release tags, `global-sync`, `agent-sync` | `git pull` in the clone, then `node setup\install.cjs` |
| `.gitattributes` in every repository | `.git\info\attributes` in each repository (`install.cjs --repo`), never committed |
| claude.ai account skills | `~/.claude/skills/` and `~/.pi/agent/skills/` |

AgentNotes (`%USERPROFILE%\AgentNotes`, or `AGENT_NOTES_DIR`) is a local git repository, one
commit per change, never a remote. `<project>` is the name given to `install.cjs --repo --project`,
kept in `.git\agent-project`; worktrees share it, and renaming the folder does not change it.

## Setup, once per PC

Needs Git for Windows 2.31 or later and Node 20 or later. In PowerShell or cmd:

```bat
git clone https://github.com/kade-agent/agent-config-local %USERPROFILE%\agent-config-local
node %USERPROFILE%\agent-config-local\setup\install.cjs
```

It writes into `%USERPROFILE%\.claude` (and `%USERPROFILE%\.pi\agent` if Pi is installed) only
files it installed itself and you have not edited. Any other file in the way is listed, and it
asks to move them to `%USERPROFILE%\.agent-config-backup\<time>\`: only `y` moves them and
installs; any other answer, or no terminal, changes nothing. Every file a run replaces or
removes is copied to the same folder first. Your own Claude Code rules can go in
`%USERPROFILE%\.claude\rules\`. For a model with a 200K window:
`setx CLAUDE_CONTEXT_WINDOW 200000` (the default is 1M).

To update: `node %USERPROFILE%\agent-config-local\setup\install.cjs --upgrade`. It runs
`git pull --ff-only` in the clone it runs from (the folder may have any name), then the
installer it pulled. `--dry-run` shows what it would change, and pulls, asks and writes nothing.

## Pi extensions, once per PC

The skills use two Pi extensions: subagents for `dispatcher`, and a question popup for asking
you. `install.cjs` never downloads them: run these yourself, and only if the company allows it.

1. Subagents ([pi-sub-agent](https://www.npmjs.com/package/pi-sub-agent), MIT, Pi 0.74 or
   later). Its bundled `worker` sets no model, so workers run on your local model:

   ```bat
   pi install npm:pi-sub-agent
   ```

2. Questions to you (`ask_user_question`), from
   [pi-config](https://github.com/amosblomqvist/pi-config). That repository has no licence, so
   this one does not carry the file: clone it yourself and copy the one file.

   ```bat
   git clone https://github.com/amosblomqvist/pi-config %USERPROFILE%\pi-config
   if not exist %USERPROFILE%\.pi\agent\extensions mkdir %USERPROFILE%\.pi\agent\extensions
   copy %USERPROFILE%\pi-config\extensions\ask-user-question.ts %USERPROFILE%\.pi\agent\extensions\
   ```

Then restart Pi or run `/reload`. In Git Bash the folder is `~/.pi/agent/extensions/`.

## Setup, once per repository

```bat
cd C:\work\shop
node %USERPROFILE%\agent-config-local\setup\install.cjs --repo --project shop
node %USERPROFILE%\.claude\tools\agent-board.cjs config gate="gradlew.bat test"
```

`--repo [<path>]` (default: the current directory) needs `--project <name>`: the folder's name
is never used, so renaming the folder keeps the project. It writes the LF attributes into
`.git\info\attributes`, the name into `.git\agent-project`, and creates the project in
AgentNotes. A folder that is not a repository gets, after a `y`, `git init` and one empty first
commit with your own git identity; your files stay untracked. A project whose folder was
renamed or moved is moved to the new folder after a `y` (a copy stays in `AgentNotes\.backup\`). It reports how many files the repository already stores with CRLF: a commit that
touches one stores it with LF, so the whole file shows as changed. `--main <branch>` names the
main branch when it is not `main`, `master` or `develop`. Other settings: `merge=squash`,
`subjectPattern=<regular expression>` (for example a ticket key), `phases=Beta,Release`.

## agent-board

`node %USERPROFILE%\.claude\tools\agent-board.cjs <command>` inside the repository (agents call
it as `node ~/.claude/tools/agent-board.cjs` from Git Bash):

| Command | Does |
|---|---|
| `new "<title>" [--priority P1] [--phase …]` | A task `T-NNNN`, status Backlog |
| `set <id> status=Next priority=P2 waiting=developer …` | Changes fields; checks every value first |
| `board`, `show <id>`, `snapshot` | The board, one task, `STATUS.md` again |
| `start <id> [--worktree] [--no-pull]` | `git pull --ff-only` on main, branch `agent/<id>-<slug>`, the PR doc skeleton; Now |
| `finish <id>` | The PR doc is filled, the branch has commits, the tree is clean; In review |
| `merge <id> --author "<Name> <email>"` | Merge, the gate on the merged tree, the PR doc as message, branch removed; Done. A conflict or a failed gate merges nothing |
| `config [key=value …]`, `init` | `project.json`; set up a repository's project |

## Layout

| Path | What |
|---|---|
| `AGENTS.md` | The rules; line 1 is the version (edit it by hand on a change) |
| `CLAUDE.md` | `@AGENTS.md` |
| `skills/` | `repo-workflow`, `session-resume`, `session-handoff`, `handoff-trigger`, `dispatcher` (Pi only, with `pi install npm:pi-sub-agent`) |
| `hooks/context-guard.cjs` | The context-size warning (Claude Code only), registered from `settings.global.json` |
| `tools/agent-board.cjs` | The Project and Board in AgentNotes |
| `setup/install.cjs` | The installer |
| `tests/`, `*.test.cjs` | `node --test` |
| `.claude/CLAUDE.md` | This repository's notes for a session working on it; never installed |

## Tests

```bash
node --test
```
