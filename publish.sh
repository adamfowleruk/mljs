#!/bin/sh

cp .npmignore dist/node-prod/
cp package.json dist/node-prod/
cp -R test dist/node-prod/
cp runtests.sh dist/node-prod/
cd dist/node-prod

npm publish

cd ../..
rm -rf dist/node-prod/.npmignore
rm -rf dist/node-prod/package.json
rm -rf dist/node-prod/test
rm -rf dist/node-prod/runtests.sh

echo "Done NPM publish"

#bower register mljs git://github.com/adamfowleruk/mljs.git
#published automatically when a git push is done, followed by a version tag

#echo "Done bower publish"

exit 0
