# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- **Dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`

**IMPORTANT:** Do not add Claude to any commit messages

## Neon MCP Usage

When using any Neon MCP tool in this project, always target the **Devstash** project and the **development** branch by default.

- **Project**: `Devstash` (ID: `polished-pond-61596170`)
- **Default branch**: `development` (ID: `br-snowy-bird-ab9i9xnj`)
- **Production branch**: `production` (ID: `br-noisy-dream-abioipyq`) — **DO NOT** query, modify, or connect to this branch unless I explicitly request it by name. If a task seems to require production, stop and ask first.

Pass `projectId: "polished-pond-61596170"` and `branchId: "br-snowy-bird-ab9i9xnj"` on every Neon tool call. If I ask for "the database" or don't specify a branch, assume development.
