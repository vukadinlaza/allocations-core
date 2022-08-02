#!/bin/bash -xe

cp .npmrc-ci .npmrc
yarn install --frozen-lockfile

cd packages/api
yarn test
