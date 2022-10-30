import { DejavuFootball } from "../../target/types/dejavu_football";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";
import { Program } from "@project-serum/anchor";
interface Input {
  authorizer: PublicKey;
  user: PublicKey;
  authId: number;
  teamAId: number;
  teamBId: number;
  closedAt: number;
  finishedAt: number;
}

interface Output {
  oracle: PublicKey;
}

export default async (
  program: Program<DejavuFootball>,
  input: Input
): Promise<Output> => {
  const [oracle] = await anchor.web3.PublicKey.findProgramAddress(
    [input.authorizer.toBuffer(), Buffer.from(`${input.authId}`)],
    program.programId
  );

  await program.methods
    .createOracle({
      id: new BN(input.authId),
      teamsIds: [input.teamAId, input.teamBId],
      closedAt: new BN(input.closedAt),
      finishedAt: new BN(input.finishedAt),
    })
    .accounts({
      authorizer: input.authorizer,
      user: input.user,
      oracle,
    })
    .rpc();

  return { oracle };
};
