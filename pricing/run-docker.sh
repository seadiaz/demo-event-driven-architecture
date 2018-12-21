#!/usr/bin/env bash

set -e

docker run --rm -it --network confluent -v $(pwd):/opt -w /opt -p 3001:3001 node:10 bash
