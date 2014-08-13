#!/bin/sh

JSDOC=/Users/adamfowler/Documents/marklogic/git/jsdoc/jsdoc

P=../mljs-pages/apidocs
D=./dist/docs
MD=./documentation
rm -rf $D
rm -rf $P
mkdir $P
mkdir $D
mkdir $D/core
mkdir $D/widgets

echo "Generating core documentation..."
$JSDOC --verbose -u ./tutorials -c jsdoc-conf.json --lenient -d $D/core ./src/js/mljs.js ./src/js/lib/basic-wrapper.js ./src/js/lib/digest-wrapper.js ./src/js/lib/noop.js ./src/js/lib/passthrough-wrapper.js core.md
echo "...done."
echo "Generating widget documentation..."
$JSDOC --verbose -u ./tutorials -c jsdoc-conf.json --lenient -d $D/widgets ./src/js/mljs-*.js ./src/js/widget*.js browser.md
echo "...done."

cp -R $D/core $P/
cp -R $D/widgets $P/
mkdir $P/core/images
mkdir $P/widgets/images
cp $MD/*/*.png $P/core/images/
cp $MD/*/*.png $P/widgets/images/

#tar czf jsdoc-core.tar.gz $D/core
#tar czf jsdoc-widgets.tar.gz $D/widgets
#tar czf jsdoc-all.tar.gz $D

echo "Pushing docs to GitHub Pages"
cd ../mljs-pages
# git add apidocs
# git commit -a -m "link fix"
# git push origin gh-pages
cd ../mljs

echo "Done All."
exit 0
