#!/bin/sh 
":" // ; exec node --experimental-modules --no-warnings "$0" "$@"

import index from '.'

index();
