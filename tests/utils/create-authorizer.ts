import { DejavuFootball } from "../../target/types/dejavu_football";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";
import createToken from "./create-token";
import type { Connection, Signer } from "@solana/web3.js";

interface Input {
  connection: Connection;
  payerSign: Signer;
  user: PublicKey;
  mint?: PublicKey;
  authId: number;
}

interface Output {
  authorizer: PublicKey;
  vaultAccount: PublicKey;
  eventsAccount: PublicKey;
}

// Toke
export default async (
  program: Program<DejavuFootball>,
  input: Input
): Promise<Output> => {
  const [authorizer] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("authorizer"), Buffer.from(`${input.authId}`)],
    program.programId
  );

  const [vaultAccount] = await anchor.web3.PublicKey.findProgramAddress(
    [authorizer.toBuffer(), Buffer.from(`vault`)],
    program.programId
  );

  const [eventsAccount] = await anchor.web3.PublicKey.findProgramAddress(
    [authorizer.toBuffer(), Buffer.from(`events`)],
    program.programId
  );

  const mint =
    input.mint ||
    (
      await createToken({
        inputs: {
          connection: input.connection,
          amount: 2,
        },

        accounts: {
          payer: input.user,
          payerSign: input.payerSign,
        },
      })
    ).accounts.mint;

  await program.methods
    .createAuthorizer({
      id: new BN(input.authId),
      fee: new BN(50),
    })
    .accounts({
      authorizer: authorizer,
      user: input.user,
      mint: mint,
      vaultAccount: vaultAccount,
      eventsAccount: eventsAccount,
    })
    .rpc();

  return { authorizer, vaultAccount, eventsAccount };
};
