#!/bin/sh
mocha --recursive -R doc > test-results.html
echo "Done!"
exit 0
