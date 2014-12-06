# mljsadmin command reference

## Installation

Running mljsadmin install will perform the following actions:-

- Create a database, single forest, REST app server, modules database (again with single forest) (mljsadmin --install=restapi)
- Create a modules rest api app server (for copying modules via) (mljsadmin --install=modulesrestapi)
- Installs all code modules (mljsadmin --install=modules)
- Installs all rest extensions (mljsadmin --install=extensions)
- Installs all search options (mljsadmin --update=searchoptions)
- Loads initial content (mljsadmin --load=initial)
- Updates (patches) the ontology installed (mljsadmin --update=ontology)
- 

## Patching

You may wish to patch your current app with the latest MLJS webapp or npm mljs code. There are two commands for this:-

- mljsadmin patch - Patches MLJS to the latest STABLE and tested code base
- mljsadmin devpatch - Patches MLJS to the latest DEVELOPMENT and untested, possibly broken, code base

An internet connection is required for this to work.
