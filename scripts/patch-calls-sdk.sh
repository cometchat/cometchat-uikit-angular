#!/bin/bash
# Patches @cometchat/calls-sdk-javascript to replace Node.js require("path") and
# require("fs") calls with empty objects. These are in WASM loader code that only
# runs in Node.js and are dead code in browser builds, but esbuild still tries to
# resolve them causing build failures.

SDK_FILE="node_modules/@cometchat/calls-sdk-javascript/dist/index.es.js"

if [ -f "$SDK_FILE" ]; then
  sed -i.bak \
    -e 's/require("path")/({dirname:function(){return ""},normalize:function(p){return p},join:function(){return ""}})/g' \
    -e 's/require("fs")/({readFileSync:function(){return ""}})/g' \
    "$SDK_FILE"
  rm -f "${SDK_FILE}.bak"
  echo "Patched calls-sdk-javascript for browser build compatibility."
else
  echo "calls-sdk-javascript not found, skipping patch."
fi
