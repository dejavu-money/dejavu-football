import { DejavuFootball } from "../../target/types/dejavu_football";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";

interface Input {
  user: PublicKey;
  authId: number;
}

interface Output {
  authorizer: PublicKey;
}

export default async (
  program: Program<DejavuFootball>,
  input: Input
): Promise<Output> => {
  const [authorizer] = await anchor.web3.PublicKey.findProgramAddress(
    [input.user.toBuffer(), Buffer.from(`id-${input.authId}`)],
    program.programId
  );

  await program.methods
    .createAuthorizer(new BN(input.authId))
    .accounts({
      authorizer: authorizer,
      user: input.user,
    })
    .rpc();

  return { authorizer };
};
