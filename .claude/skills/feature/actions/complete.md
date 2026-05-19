# Complete Action

1. Stage all changes and commit with a descriptive message
2. Switch to main and merge feature branch (no push yet)
3. Delete local feature branch
4. Generate history records:
   - Run helper script: `node .claude/skills/feature/scripts/generate-history.js`
   - This script automatically:
     * Reads current feature details from `context/current-feature.md`
     * Creates detailed record for `context/current-feature-detailed-history.md`
     * Creates summarized record for `context/current-feature.md` history section
     * Appends records to both files
5. Reset current-feature.md:
   - Change H1 back to `# Current Feature`
   - Clear Goals and Notes sections (keep placeholder comments)
   - History section already updated by the script with summarized record
6. Commit the reset: `chore: reset current-feature.md after completing [feature]`
7. Push main to origin ONCE (single push with all changes)
8. If feature branch was previously pushed, delete it from origin

## History Record Format

### Detailed Record (current-feature-detailed-history.md)
```
- **YYYY-MM-DD**: [Feature Name] - [Detailed description combining goals and implementation notes]
```

### Summarized Record (current-feature.md History section)
```
- **YYYY-MM-DD**: [Feature Name]
```