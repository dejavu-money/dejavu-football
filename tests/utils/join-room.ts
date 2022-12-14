import { DejavuFootball } from "../../target/types/dejavu_football";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";

// import { BN } from "bn.js";

interface Input {
  inputs: {
    teamAResult: number;
    teamBResult: number;
    playerKey: number;
  };
  accounts: {
    authorizer: PublicKey;
    user: PublicKey;
    room: PublicKey;
    roomPlayers: PublicKey;
    vaultMint: PublicKey;
    oracle: PublicKey;
    playerMintTokenAccount: PublicKey;
    vaultAccount: PublicKey;
  };
}

interface Output {
  accounts: {
    joinPlayerMetadata: PublicKey;
  };
}

export default async (
  program: Program<DejavuFootball>,
  input: Input
): Promise<Output> => {
  const [joinPlayerMetadata] = await anchor.web3.PublicKey.findProgramAddress(
    [
      input.accounts.room.toBuffer(),
      Buffer.from(`player-${input.inputs.playerKey}`),
    ],
    program.programId
  );

  await program.methods
    .joinRoom({
      resultTeamA: input.inputs.teamAResult,
      resultTeamB: input.inputs.teamBResult,
      playerRoomIndex: input.inputs.playerKey,
    })
    .accounts({
      authorizer: input.accounts.authorizer,
      mint: input.accounts.vaultMint,
      room: input.accounts.room,
      oracle: input.accounts.oracle,
      vaultAccount: input.accounts.vaultAccount,
      roomHistory: joinPlayerMetadata,
      players: input.accounts.roomPlayers,
      playerTokenAccount: input.accounts.playerMintTokenAccount,
      payerTokenAccount: input.accounts.playerMintTokenAccount,
      user: input.accounts.user,
    })
    .rpc();

  return {
    accounts: {
      joinPlayerMetadata,
    },
  };
};
