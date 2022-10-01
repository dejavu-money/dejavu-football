import { DejavuFootball } from "../../target/types/dejavu_football";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";

interface Input {
  inputs: {
    roomId: number;
    teamAResult: number;
    teamBResult: number;
    playerKey: number;
    initAmount: number;
  },
  accounts: {
    user: PublicKey;
    vaultMint: PublicKey;
    oracle: PublicKey;
    playerMintTokenAccount: PublicKey;
  }
}

interface Output {
  accounts: {
    room: PublicKey;
    vault: PublicKey;
    roomPlayers: PublicKey;
    roomPlayerMetadata: PublicKey;
  }
}

export default async (
  program: Program<DejavuFootball>,
  input: Input
): Promise<Output> => {

  const [room] = await anchor.web3.PublicKey.findProgramAddress(
    [input.accounts.user.toBuffer(), Buffer.from(`room-${input.inputs.roomId}`)],
    program.programId
  );

  const [vault] = await anchor.web3.PublicKey.findProgramAddress(
    [room.toBuffer(), Buffer.from("vault")],
    program.programId
  );


  const [roomPlayers] = await anchor.web3.PublicKey.findProgramAddress(
    [room.toBuffer(), Buffer.from("players")],
    program.programId
  );

  const [roomPlayerMetadata] =
        await anchor.web3.PublicKey.findProgramAddress(
          [room.toBuffer(), Buffer.from("player-0")],
          program.programId
        );
  
  await program.methods
        .createRoom(
          new BN(input.inputs.roomId),
          [
            input.inputs.teamAResult,
            input.inputs.teamBResult,
            input.inputs.playerKey,
          ],
          new BN(input.inputs.initAmount)
        )
        .accounts({
          vaultAccount: vault,
          mint: input.accounts.vaultMint,
          room: room,
          user: input.accounts.user,
          oracle: input.accounts.oracle,
          players: roomPlayers,
          playerMetadata: roomPlayerMetadata,
          playerTokenAccount: input.accounts.playerMintTokenAccount,
        })
        .rpc();

  return {
    accounts: {
      room,
      vault,
      roomPlayers,
      roomPlayerMetadata
    }
  }
};
