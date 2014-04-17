From SO.com (stored for my own benefit):-

To create a tag manually via the command line:

open Terminal and navigate to your repository (either via cd or just drag in the folder from Finder)
use the following commands:
git remote (displays the name of your remote, for example YourRemote)
git tag -a v1.2 -m 'tagging Version 1.2' (creates tag v1.2 from current branch)
git push YourRemote v1.2 (pushes the tag you've created to YourRemote)
http://pinkstone.co.uk/how-to-tag-a-release-in-git/
