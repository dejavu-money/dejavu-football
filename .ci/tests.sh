#!/bin/bash
set -e

# default provider Devnet

export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
export ANCHOR_WALLET='./id.json'


anchor build
cp ./program-keypair.json ./target/deploy/dejavu_football-keypair.json


yarn 
anchor test
