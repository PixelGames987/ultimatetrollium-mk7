#!/bin/bash

echo "The website should be accessible on 172.16.42.1:8000 in a few seconds"

python3 -m http.server
