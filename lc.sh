#!/bin/sh
./cpjs.sh
echo "Core:-"
wc -l src/js/mljs*.js
echo "Widget API:-"
wc -l src/js/widget*.js
echo "Done."
