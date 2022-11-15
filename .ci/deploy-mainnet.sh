#!/bin/bash
set -e

# default provider Devnet

export ANCHOR_PROVIDER_URL="https://api.mainnet-beta.solana.com"
export ANCHOR_WALLET='./id.json'

# Build program
anchor build --provider.cluster mainnet

# copy keypair
cp ./program-keypair.json ./target/deploy/dejavu_football-keypair.json

anchor deploy --provider.cluster mainnet
