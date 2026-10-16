# kade-agent/agent-config-local: this repository's own notes

The root `AGENTS.md` is the local setup's global rules, installed as `~/.claude/AGENTS.md` (and
`~/.pi/agent/AGENTS.md`) by `setup/install.cjs`; the root `CLAUDE.md` is the one line
`@AGENTS.md`. Neither holds anything about this repository, and neither applies to a session
working on it: Kade's global rules do. `install.cjs` copies only the files it lists, so this
file is never installed.

## What this repository is

- The company line of the rules: Windows 10, local repositories, no push, no CI, local models.
- It began on 2026-10-16 as a branch of `kade-agent/agent-config` (the GitHub setup) and moved
  here with its history. The two never merge; a fix to a shared part (`context-guard`, the
  skills) is ported by hand in either direction.
- Public: nothing here names a company, an internal path or a host.

## Gates

| Part | Gate |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `skills/`, `hooks/`, `tools/`, `setup/`, `settings.global.json` | `node --test` |
| Windows 10: Git for Windows, cmd.exe running a gate, `%USERPROFILE%` paths | NOT VERIFIED until run on the developer's PC |
| A local model following the rules and skills (Claude Code, Pi) | NOT VERIFIED until a session there |

## Version control

- `claude/<task>` from an up-to-date `main`, one task per PR. Every file here is an agent rule
  or tool, so each PR is opened as a draft and Kade merges it.
- Bump line 1 of `AGENTS.md` with any change to the rules or skills.
