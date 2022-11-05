#!/bin/bash
set -e

# default provider Devnet

export ANCHOR_PROVIDER_URL="https://api.testnet.solana.com"
export ANCHOR_WALLET='./id.json'

# Airdrop some solanas to the wallet
solana airdrop 2 $(solana-keygen pubkey $ANCHOR_WALLET) --url https://api.testnet.solana.com && solana airdrop 2 $(solana-keygen pubkey $ANCHOR_WALLET) --url https://api.testnet.solana.com

# Build program
anchor build --provider.cluster devnet

# copy keypair
cp ./program-keypair.json ./target/deploy/dejavu_football-keypair.json
anchor deploy --provider.cluster testnet
