#!/bin/bash
# Cureate Connect — local prototype.
#
# Runs the main repo. This previously pointed at .claude/worktrees/elastic-wilbur-8ed5b9,
# a stale worktree pinned to an older commit — sprint-2 work wouldn't have shown up.
# The local preview harness (Gemfile, bin/, config/*, package.json) now lives here and
# is untracked by design, see .git/info/exclude.

set -e
cd "/Users/naz/Desktop/Workspaces/Clients/Cureate/cureate-demo" || exit 1

# ── Ruby ────────────────────────────────────────────────────────────────────
# macOS ships Ruby 2.6 at /usr/bin/ruby, which is far too old (the lockfile needs
# Bundler 4). Find a Homebrew Ruby and put it FIRST on the PATH.
for candidate in \
  /opt/homebrew/opt/ruby@4.0/bin \
  /opt/homebrew/opt/ruby/bin \
  /usr/local/opt/ruby@4.0/bin \
  /usr/local/opt/ruby/bin
do
  if [ -x "$candidate/ruby" ]; then
    export PATH="$candidate:$PATH"
    break
  fi
done

if [ "$(command -v ruby)" = "/usr/bin/ruby" ]; then
  echo "✗ Only macOS system Ruby ($(ruby -v | awk '{print $2}')) was found."
  echo "  This app needs a modern Ruby. Install one with:"
  echo ""
  echo "      brew install ruby"
  echo ""
  echo "  then run this script again."
  exit 1
fi

export PATH="$(gem env gemdir)/bin:$PATH"
echo "→ Ruby $(ruby -v | awk '{print $2}')  ($(command -v ruby))"

# ── Gems ────────────────────────────────────────────────────────────────────
echo "→ Ruby gems…"
gem list -i bundler >/dev/null 2>&1 || gem install bundler
bundle check >/dev/null 2>&1 || bundle install

# ── Node packages ───────────────────────────────────────────────────────────
if ! command -v npm >/dev/null 2>&1; then
  echo "✗ npm not found. Install Node with:  brew install node"
  exit 1
fi
echo "→ Node packages…"
[ -x node_modules/.bin/esbuild ] && [ -x node_modules/.bin/tailwindcss ] || npm install

# ── Assets ──────────────────────────────────────────────────────────────────
# Rebuild whenever views or Stimulus controllers change:
#   JS  — esbuild bundles app/javascript/application.js → app/assets/builds/application.js
#   CSS — Tailwind scans the .erb views for utility classes → app/assets/builds/application.css
# New views introduce new utility classes, so skipping this leaves them unstyled.
echo "→ Building assets…"
npm run build

( sleep 3 && open "http://localhost:3000" >/dev/null 2>&1 ) &
echo "→ Starting Rails on http://localhost:3000  (Ctrl-C to stop)"
exec bin/rails server -p 3000
