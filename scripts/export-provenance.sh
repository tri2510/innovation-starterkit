#!/bin/bash
# Export complete git history for provenance documentation
# Run this script to create a timestamped proof of originality

OUTPUT_DIR="provenance-export"
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
OUTPUT_FILE="$OUTPUT_DIR/git-history-$TIMESTAMP.txt"

mkdir -p "$OUTPUT_DIR"

echo "========================================" > "$OUTPUT_FILE"
echo "INNOVATION STARTERKIT - GIT PROVENANCE" >> "$OUTPUT_FILE"
echo "========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Export Date: $(date -u)" >> "$OUTPUT_FILE"
echo "Repository: $(pwd)" >> "$OUTPUT_FILE"
echo "Git Origin: $(git config --get remote.origin.url)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "--- REPOSITORY INFO ---" >> "$OUTPUT_FILE"
echo "Current Branch: $(git branch --show-current)" >> "$OUTPUT_FILE"
echo "Current Commit: $(git rev-parse HEAD)" >> "$OUTPUT_FILE"
echo "Total Commits: $(git rev-list --count HEAD)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "--- FIRST COMMIT ---" >> "$OUTPUT_FILE"
git log --reverse --pretty=format:"Hash: %H%nAuthor: %an <%ae>%nDate: %ad%nMessage: %s%n" --date=iso | head -10 >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "--- COMPLETE COMMIT HISTORY ---" >> "$OUTPUT_FILE"
git log --all --pretty=format:"Commit: %H%nAuthor: %an <%ae>%nDate: %ad%nMessage: %s%n" --date=iso >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "--- CONTRIBUTORS ---" >> "$OUTPUT_FILE"
git shortlog -sn --all >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "--- FILE HISTORY ---" >> "$OUTPUT_FILE"
echo "Total lines of code:" >> "$OUTPUT_FILE"
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l | tail -1 >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "--- TAGS ---" >> "$OUTPUT_FILE"
git tag -l >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "--- REMOTE ORIGIN ---" >> "$OUTPUT_FILE"
git remote -v >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "========================================" >> "$OUTPUT_FILE"
echo "END OF PROVENANCE EXPORT" >> "$OUTPUT_FILE"
echo "========================================" >> "$OUTPUT_FILE"

echo "✅ Provenance export created: $OUTPUT_FILE"
echo "✅ This file serves as timestamped proof of originality"
echo ""
echo "Next steps:"
echo "1. Review the exported file"
echo "2. Commit this export to the repository"
echo "3. Consider digitally signing or notarizing for extra legal weight"
