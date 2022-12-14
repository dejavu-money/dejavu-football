import { DejavuSolana } from "../../target/types/dejavu_solana";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";

interface Input {
  authorizer: PublicKey;
  oracle: PublicKey;
  user: PublicKey;
  teamAValue: number;
  teamBValue: number;
}

interface Output {
  oracle: PublicKey;
}

export default async (
  program: Program<DejavuSolana>,
  input: Input
): Promise<Output> => {
  await program.methods
    .updateOracle({
      results: [input.teamAValue, input.teamBValue],
      isFinished: true,
    })
    .accounts({
      authorizer: input.authorizer,
      oracle: input.oracle,
      user: input.user,
    })
    .rpc();

  return { oracle: input.oracle };
};
