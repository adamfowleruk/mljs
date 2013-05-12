#!/bin/sh

JSDOC=/Users/adamfowler/Documents/marklogic/git/jsdoc/jsdoc

P=../mldb-pages/apidocs
D=./dist/docs
rm -rf $D
rm -rf $P
mkdir $P
mkdir $D
mkdir $D/core
mkdir $D/widgets

echo "Generating core documentation..."
$JSDOC -u ./tutorials -c jsdoc-conf.json -d $D/core mldb.js ./lib/basic-wrapper.js ./lib/digest-wrapper.js ./lib/noop.js ./lib/passthrough-wrapper.js core.md
echo "...done."
echo "Generating widget documentation..."
$JSDOC -u ./tutorials -c jsdoc-conf.json -d $D/widgets ./mldbwebtest/src/public/js/mldbtest/mldb-*.js ./mldbwebtest/src/public/js/mldbtest/widget*.js browser.md
echo "...done."

cp -R $D/core $P/
cp -R $D/widgets $P/

#tar czf jsdoc-core.tar.gz $D/core
#tar czf jsdoc-widgets.tar.gz $D/widgets
#tar czf jsdoc-all.tar.gz $D

echo "Pushing docs to GitHub Pages"
cd ../mldb-pages
git add apidocs
git commit -a -m "link fix"
git push origin gh-pages
cd ../mldb

echo "Done All."
exit 0

