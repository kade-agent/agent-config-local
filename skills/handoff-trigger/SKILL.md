---
name: handoff-trigger
description: Decide when to ask about or recommend a handoff and a new session, from the size of the context against its window (1M, 200K, or a local model's smaller one) and the next task. Use when a context-guard message appears, right after a compaction, when a finished task is followed by a totally different type of task, when the context passes the recommend line for its window, or when you notice the session degrading (repeating a fix the developer rejected, forgetting a guardrail). It asks or recommends and offers the choices, never forces; the session-handoff skill does the handoff.
---

# Handoff trigger

This is about the session, not the task. In Claude Code the `context-guard` hook warns by size;
this skill says what to do when it does, and what to do without it (Pi has no hook: read the
number and the window in its footer; Claude Code: the status line or `/context`).

Quality drops gradually as the context fills ("context rot"), well before the window is full;
local models drop sooner. Auto-compaction replaces history with a summary; Pi compacts on its
own once the context passes the window less 16K. **Task boundaries matter more than the number.**

## When

| When | 1M window | 200K window or smaller (W) | Do |
|---|---|---|---|
| A task is finished and the next is a **totally different type** | 200k to 400k | 30% to 60% of the window | **Ask** |
| The context is at the recommend line or more | 400k+ | 60%+ of the window | **Recommend** |
| You notice yourself degrading (below) | under 400k | under 60% of the window | **Ask** |
| Right after a compaction | any | any | Offer the three choices |
| Anything else | below | below | Nothing; at 300k / 40% of the window the number in one line |

Never **recommend** below the recommend line. For 200K that is 60k, 120k and 80k. Claude Code's
hook needs the window size: set `CLAUDE_CONTEXT_WINDOW=200000` for a 200K window (1M is the default).

- **A totally different type of task** is one of: a different repository; a different kind of
  work (code change to research or a question, docs to build scripts, a feature to reviewing
  someone else's branch); or no shared files or plan with the task just finished. Not: fixes
  the developer asked for on the same task, the next step of the same plan, a follow-up bug in
  the same feature. Only at a task boundary, never mid-task.
- **Degrading:** you repeat a fix the developer already rejected, you have been corrected twice
  on the same point, you forget a guardrail, or you re-read files you already saw. Say what you
  noticed.

## How

- **Ask** in one neutral line, as a question: "This is a different type of task; hand off to a
  new session, or continue here?" Ask before reading anything for the new task, then wait.
- **Recommend** in one line with the number, and offer three choices:
  1. **handoff and a new session** (the `session-handoff` skill),
  2. `/compact` with a focus they name (Pi and Claude Code alike),
  3. continue.

  **Recommend, never force:** after that line, carry on with the request the normal way in the
  same reply (`repo-workflow`: a plan, then wait for approval). Recommend once when the context
  crosses the line, then once at each new task while it stays above.
- Say it **in your first reply, before any edit, commit or other command**, even when the
  message is only "go on". If you cannot read the number, say so; never call the context small.
- Finish or park the current step before a handoff; never hand off mid-edit. Record the state in
  the task (`agent-board set`, the task file's text) first, so the new session starts from it.
