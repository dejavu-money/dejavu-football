import { DejavuFootball } from "../../target/types/dejavu_football";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";


interface Input {
  authorizer: PublicKey,
  user: PublicKey,
  authId: number,
  teamAId: number,
  teamBId: number,
  closedAt: number,
  finishedAt: number
}

interface Output {
  oracle: PublicKey
}

export default async (program: Program<DejavuFootball>, input: Input): Promise<Output> => {

  const [oracle] = await anchor.web3.PublicKey.findProgramAddress(
    [input.authorizer.toBuffer(), Buffer.from(`id-${input.authId}`)],
    program.programId
  );

  await program.methods.createOracle(
    new BN(input.authId), // oracle id
    input.teamAId, // team_a id
    input.teamBId,  // team_b id
    new BN(input.closedAt), // closed_at timestamp, 
    new BN(input.finishedAt) // finished_at timestamp
  ).accounts({
    authorizer: input.authorizer,
    user: input.user,
    oracle
  }).rpc();

  return { oracle };
}
