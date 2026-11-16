#!/usr/bin/env bash
# Installs KiCad's global symbol and footprint library tables from the official libraries cloned in ~/kicad-libs.
# The libraries ship their own tables (sym-lib-table, fp-lib-table) that refer to ${KICAD10_SYMBOL_DIR} and
# ${KICAD10_FOOTPRINT_DIR}; this script copies them and writes the real folders into the paths.
# Usage:  bash tools/kicad/make-lib-tables.sh [libs-folder]      (default libs folder: ~/kicad-libs)
# Close KiCad first. Existing tables are backed up next to the new ones (*.bak-<time>).
set -euo pipefail

LIBS="${1:-$HOME/kicad-libs}"
SYM="$LIBS/kicad-symbols"
FP="$LIBS/kicad-footprints"
for need in "$SYM/sym-lib-table" "$FP/fp-lib-table"; do
  if [ ! -f "$need" ]; then
    echo "Missing $need. Clone the libraries first (see hardware/kicad/README.md)." >&2
    exit 1
  fi
done

CFG="$( (ls -d "$HOME"/.config/kicad/10* 2>/dev/null || true) | sort -V | tail -1)"
[ -n "$CFG" ] || CFG="$HOME/.config/kicad/10.0"
mkdir -p "$CFG"
echo "KiCad config folder: $CFG"

stamp="$(date +%Y%m%d-%H%M%S)"
for t in sym-lib-table fp-lib-table; do
  if [ -f "$CFG/$t" ]; then cp "$CFG/$t" "$CFG/$t.bak-$stamp"; echo "backed up $t"; fi
done

# replace the path variables with the real folders (| as the sed separator: the paths contain /)
sed "s|\${KICAD[0-9]*_SYMBOL_DIR}|$SYM|g" "$SYM/sym-lib-table" > "$CFG/sym-lib-table"
sed "s|\${KICAD[0-9]*_FOOTPRINT_DIR}|$FP|g" "$FP/fp-lib-table" > "$CFG/fp-lib-table"

echo "Wrote $(grep -c '(lib ' "$CFG/sym-lib-table") symbol libraries and $(grep -c '(lib ' "$CFG/fp-lib-table") footprint libraries."
echo "Start KiCad again, open the schematic and press A: the symbol list should now be filled."
