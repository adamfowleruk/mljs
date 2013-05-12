#!/bin/sh

JSDOC=/Users/adamfowler/Documents/marklogic/git/jsdoc/jsdoc

rm -rf ./jsdocs
mkdir ./jsdocs
mkdir ./jsdocs/core
mkdir ./jsdocs/widgets

echo "Generating core documentation..."
$JSDOC -u ./tutorials -c jsdoc-conf.json -d ./jsdocs/core mldb.js ./lib/basic-wrapper.js ./lib/digest-wrapper.js ./lib/noop.js ./lib/passthrough-wrapper.js core.md
echo "...done."
echo "Generating widget documentation..."
$JSDOC -u ./tutorials -c jsdoc-conf.json -d ./jsdocs/widgets ./mldbwebtest/src/public/js/mldbtest/mldb-*.js ./mldbwebtest/src/public/js/mldbtest/widget*.js browser.md
echo "...done."

tar czf jsdoc-core.tar.gz jsdocs/core
tar czf jdsoc-widgets.tar.gz jsdocs/widgets
tar czf jsdoc-all.tar.gz jsdocs

echo "Done All."
exit 0

