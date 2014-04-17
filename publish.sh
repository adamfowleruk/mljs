#!/bin/sh

npm publish

echo "Done NPM publish"

bower register mljs git://github.com/adamfowleruk/mljs.git

echo "Done bower publish"

exit 0
