import { DejavuFootball } from "../../target/types/dejavu_football";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";
import * as Token from "@solana/spl-token";
import { Program } from "@project-serum/anchor";

interface Input {
  inputs: {
    roomId: number;
    teamAResult: number;
    teamBResult: number;
    playerKey: number;
    initAmount: number;
  };
  accounts: {
    user: PublicKey;
    vaultMint: PublicKey;
    oracle: PublicKey;
    authorizer: PublicKey;
    playerMintTokenAccount: PublicKey;
  };
}

interface Output {
  accounts: {
    room: PublicKey;
    vault: PublicKey;
    roomPlayers: PublicKey;
    roomPlayerMetadata: PublicKey;
  };
}

export default async (
  program: Program<DejavuFootball>,
  input: Input
): Promise<Output> => {
  // const authorizer = await program.account.authorizerAccount.fetch(input.accounts.authorizer);

  const [room] = await anchor.web3.PublicKey.findProgramAddress(
    [
      input.accounts.oracle.toBuffer(),
      Buffer.from(`room-${input.inputs.roomId}`),
    ],
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

  // console.log(authorizer.mint.toString());

  // program.

  const [roomPlayerMetadata] = await anchor.web3.PublicKey.findProgramAddress(
    [room.toBuffer(), Buffer.from("player-0")],
    program.programId
  );

  // console.log(authorizer);
  await program.methods
    .createRoom({
      id: new BN(input.inputs.roomId),
      playerBet: {
        resultTeamA: input.inputs.teamAResult,
        resultTeamB: input.inputs.teamBResult,
        playerRoomIndex: input.inputs.playerKey,
      },
      initAmount: new BN(input.inputs.initAmount),
    })
    .accounts({
      vaultAccount: vault,
      mint: input.accounts.vaultMint,
      authorizer: input.accounts.authorizer,
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
      roomPlayerMetadata,
    },
  };
};
