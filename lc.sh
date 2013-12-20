#!/bin/sh
./cpjs.sh
echo "Core:-"
wc -l mldbwebtest/src/public/js/mljs/mljs*.js
echo "Widget API:-"
wc -l mldbwebtest/src/public/js/mljs/widget*.js
echo "Done."

