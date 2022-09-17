import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DejavuFootball } from "../target/types/dejavu_football";
import { assert } from "chai";
import createAuthorizer from "./utils/create-authorizer";
import * as Token from "@solana/spl-token";
import { BN } from "bn.js";
import createOracle from "./utils/create-oracle";

describe("Program Authorizer methods", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.DejavuFootball as Program<DejavuFootball>;

  describe("#create-room", async () => {
    it("creates a room", async () => {
      const authId = new Date().getTime();
      const roomId = new Date().getTime();

      const payer = anchor.web3.Keypair.fromSecretKey(
        Buffer.from(
          JSON.parse(
            require("fs").readFileSync(process.env.ANCHOR_WALLET, {
              encoding: "utf-8",
            })
          )
        )
      );

      // create auth
      const { authorizer } = await createAuthorizer(program, {
        user: provider.wallet.publicKey,
        authId,
      });

      // create oracle
      const closedAt = new Date().getTime();
      const finishedAt = new Date().getTime() + 1;
      const { oracle } = await createOracle(program, {
        teamAId: 1,
        teamBId: 2,
        user: provider.wallet.publicKey,
        closedAt,
        finishedAt,
        authorizer,
        authId,
      });

      const [room] = await anchor.web3.PublicKey.findProgramAddress(
        [provider.wallet.publicKey.toBuffer(), Buffer.from(`room-${roomId}`)],
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

      const vualtMint = await Token.createMint(
        provider.connection,
        payer,
        payer.publicKey,
        null,
        0
      );

      const playerMintTokenAccount = await Token.createAccount(
        provider.connection,
        payer,
        vualtMint,
        payer.publicKey
      );

      // transfer some data

      await Token.mintTo(
        provider.connection,
        payer,
        vualtMint,
        playerMintTokenAccount,
        payer,
        5
      );

      console.log("playerMintTokenAccount");
      console.log(playerMintTokenAccount);
      console.log("balance: ");
      console.log(
        await provider.connection.getTokenAccountBalance(playerMintTokenAccount)
      );

      const roomInstruction = {
        roomId: new BN(roomId),
        initAmount: new BN(1),
        teamAResult: 1,
        teamBResult: 2,
        playerKey: 0,
      };

      await program.methods
        .createRoom(
          roomInstruction.roomId,
          [
            roomInstruction.teamAResult,
            roomInstruction.teamBResult,
            roomInstruction.playerKey,
          ],
          roomInstruction.initAmount
        )
        .accounts({
          vaultAccount: vault,
          mint: vualtMint,
          room: room,
          user: provider.wallet.publicKey,
          oracle: oracle,
          players: roomPlayers,
          playerMetadata: roomPlayerMetadata,
          playerTokenAccount: playerMintTokenAccount,
        })
        .rpc();

      const roomData = await program.account.room.fetch(room);
      const roomPlayerData = await program.account.roomPlayers.fetch(
        roomPlayers
      );
      const roomPlayerMetaData = await program.account.roomPlayerMetadata.fetch(
        roomPlayerMetadata
      );

      console.log("room: ");
      console.log(JSON.stringify(roomData));

      console.log("players: ");
      console.log(JSON.stringify(roomPlayerData));

      console.log("player metadata");
      console.log(JSON.stringify(roomPlayerMetaData));

      console.log("balance after: ");
      console.log(
        await provider.connection.getTokenAccountBalance(playerMintTokenAccount)
      );
    });
  });
});
