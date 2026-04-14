# Devstash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to ge the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Setup

- Clean Next.js 16.2.3 installation with React 19.2.4
- Uses Tailwind CSS v4 (import-only, no config file)
- TypeScript configuration
- Minimal page structure in `src/app/page.tsx`
- Removed all default SVG assets from public folder

## Key Notes

- This is NOT the Next.js you know - version has breaking changes
- Read Next.js docs in `node_modules/next/dist/docs/` before writing code
- Heed deprecation notices
- Uses Tailwind CSS v4 (different from v3 conventions)
- No Tailwind config file exists - using import-only approach
