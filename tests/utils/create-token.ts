import { PublicKey } from "@solana/web3.js";
import * as Token from "@solana/spl-token";

import type { Connection, Signer } from "@solana/web3.js";

interface Input {
  inputs: {
    connection: Connection;
    amount: number;
    decimals?: number;
  };

  accounts: {
    payerSign: Signer;
    payer: PublicKey;
  };
}

interface Output {
  accounts: {
    mint: PublicKey;
    payerMintAccount: PublicKey;
  };
}

export default async (input: Input): Promise<Output> => {
  const mint = await Token.createMint(
    input.inputs.connection,
    input.accounts.payerSign,
    input.accounts.payer,
    null,
    input.inputs.decimals || 0
  );

  const payerMintAccount = await Token.createAccount(
    input.inputs.connection,
    input.accounts.payerSign,
    mint,
    input.accounts.payer
  );

  await Token.mintTo(
    input.inputs.connection,
    input.accounts.payerSign,
    mint,
    payerMintAccount,
    input.accounts.payerSign,
    input.inputs.amount
  );

  return {
    accounts: {
      mint,
      payerMintAccount,
    },
  };
};
