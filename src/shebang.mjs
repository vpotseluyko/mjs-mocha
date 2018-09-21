#!/bin/sh 
":" // ; exec node --experimental-modules "$0" "$@"

import index from '.'

index();
