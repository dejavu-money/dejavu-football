import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DejavuFootball } from "../target/types/dejavu_football";
import { assert } from "chai";
import createAuthorizer from "./utils/create-authorizer";
import * as Token from "@solana/spl-token";
import { BN } from "bn.js";
import createOracle from "./utils/create-oracle";

describe("Program Authorizer methods", () => {
  // anchor.AnchorProvide
  const provider = anchor.AnchorProvider.env();
  //provider
  anchor.setProvider(provider);
  const program = anchor.workspace.DejavuFootball as Program<DejavuFootball>;

  // describe("#create-room", async () => {
  //   it("creates a room", async () => {
  //     const authId = new Date().getTime();
  //     const roomId = new Date().getTime();

  //     const payer = anchor.web3.Keypair.fromSecretKey(
  //       Buffer.from(
  //         JSON.parse(
  //           require("fs").readFileSync(process.env.ANCHOR_WALLET, {
  //             encoding: "utf-8",
  //           })
  //         )
  //       )
  //     );

  //     // create auth
  //     const { authorizer } = await createAuthorizer(program, {
  //       user: provider.wallet.publicKey,
  //       authId,
  //     });

  //     // create oracle
  //     const closedAt = new Date().getTime();
  //     const finishedAt = new Date().getTime() + 1;
  //     const { oracle } = await createOracle(program, {
  //       teamAId: 1,
  //       teamBId: 2,
  //       user: provider.wallet.publicKey,
  //       closedAt,
  //       finishedAt,
  //       authorizer,
  //       authId,
  //     });

  //     const [room] = await anchor.web3.PublicKey.findProgramAddress(
  //       [provider.wallet.publicKey.toBuffer(), Buffer.from(`room-${roomId}`)],
  //       program.programId
  //     );

  //     const [vault] = await anchor.web3.PublicKey.findProgramAddress(
  //       [room.toBuffer(), Buffer.from("vault")],
  //       program.programId
  //     );

  //     const [roomPlayers] = await anchor.web3.PublicKey.findProgramAddress(
  //       [room.toBuffer(), Buffer.from("players")],
  //       program.programId
  //     );

  //     const [roomPlayerMetadata] =
  //       await anchor.web3.PublicKey.findProgramAddress(
  //         [room.toBuffer(), Buffer.from("player-0")],
  //         program.programId
  //       );

  //     const vualtMint = await Token.createMint(
  //       provider.connection,
  //       payer,
  //       payer.publicKey,
  //       null,
  //       0
  //     );

  //     const playerMintTokenAccount = await Token.createAccount(
  //       provider.connection,
  //       payer,
  //       vualtMint,
  //       payer.publicKey
  //     );

  //     // mint 5 tokens to the account.

  //     await Token.mintTo(
  //       provider.connection,
  //       payer,
  //       vualtMint,
  //       playerMintTokenAccount,
  //       payer,
  //       5
  //     );

  //     const roomInstruction = {
  //       roomId: new BN(roomId),
  //       initAmount: new BN(1),
  //       teamAResult: 1,
  //       teamBResult: 2,
  //       playerKey: 0,
  //     };

  //     await program.methods
  //       .createRoom(
  //         roomInstruction.roomId,
  //         [
  //           roomInstruction.teamAResult,
  //           roomInstruction.teamBResult,
  //           roomInstruction.playerKey,
  //         ],
  //         roomInstruction.initAmount
  //       )
  //       .accounts({
  //         vaultAccount: vault,
  //         mint: vualtMint,
  //         room: room,
  //         user: provider.wallet.publicKey,
  //         oracle: oracle,
  //         players: roomPlayers,
  //         playerMetadata: roomPlayerMetadata,
  //         playerTokenAccount: playerMintTokenAccount,
  //       })
  //       .rpc();

  //     const roomData = await program.account.room.fetch(room);
  //     const roomPlayerData = await program.account.roomPlayers.fetch(
  //       roomPlayers
  //     );
  //     const roomPlayerMetaData = await program.account.roomPlayerMetadata.fetch(
  //       roomPlayerMetadata
  //     );

  //     const playerMintAccountBalance =
  //       await provider.connection.getTokenAccountBalance(
  //         playerMintTokenAccount
  //       );

  //     // room checks

  //     assert.equal(
  //       Number(playerMintAccountBalance.value.amount),
  //       4,
  //       "checks if player mint account was decreased a token by the program"
  //     );

  //     assert.ok(
  //       roomData.mintAccount.equals(vualtMint),
  //       "checks if the mint account is assigned on the room account"
  //     );
  //     assert.ok(
  //       roomData.isFinished === false,
  //       "checks if the attr is_finished is set false when the room is initialized"
  //     );
  //     assert.ok(
  //       roomData.createdBy.equals(provider.wallet.publicKey),
  //       "checks if the attr created_by is setted with the signer account"
  //     );
  //     assert.ok(
  //       roomData.oracle.equals(oracle),
  //       "checks if the oracle is assigned on the room account"
  //     );
  //     assert.ok(
  //       roomData.initAmount.eq(roomInstruction.initAmount),
  //       "checks if the init amount is assigned on the room account"
  //     );

  //     // player metadata checks

  //     assert.ok(
  //       roomPlayerMetaData.createdBy.equals(provider.wallet.publicKey),
  //       "checks if the attr created_by was assigned on the room player metadata"
  //     );

  //     // room players checks

  //     assert.ok(
  //       (roomPlayerData.list as [[number]]).length === 1,
  //       "checks if the player list length is 1 when the room is initialized"
  //     );

  //     assert.equal(
  //       JSON.stringify(roomPlayerData.list),
  //       JSON.stringify([[1, 2, 0]]),
  //       "check if the player list is correctly"
  //     );
  //   });
  // });

  describe("#join-room", async () => {
    it("joins to a room", async () => {
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

      // mint 5 tokens to the account.

      await Token.mintTo(
        provider.connection,
        payer,
        vualtMint,
        playerMintTokenAccount,
        payer,
        5
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

      // join room
      const joinPlayerKeypair = anchor.web3.Keypair.generate();

      const joinProvider = new anchor.AnchorProvider(
        provider.connection,
        new anchor.Wallet(joinPlayerKeypair),
        anchor.AnchorProvider.defaultOptions()
      );

      const [joinPlayerMetadata] =
        await anchor.web3.PublicKey.findProgramAddress(
          [room.toBuffer(), Buffer.from("player-1")],
          program.programId
        );

      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          joinPlayerKeypair.publicKey,
          10000000000
        ),
        "confirmed"
      );

      const joinPlayerMintTokenAccount = await Token.createAccount(
        provider.connection,
        joinPlayerKeypair,
        vualtMint,
        joinPlayerKeypair.publicKey
      );

      await program.methods
        .joinRoom([0, 0, 1])
        .accounts({
          mint: vualtMint,
          room: room,
          oracle: oracle,
          vaultAccount: vault,
          playerMetadata: joinPlayerMetadata,
          players: roomPlayers,
          playerTokenAccount: joinPlayerMintTokenAccount,
          user: provider.wallet.publicKey,
        })
        .rpc();

      let roomPlayerData = await program.account.roomPlayers.fetch(roomPlayers);

      let joinPlayerMetaData = await program.account.roomPlayerMetadata.fetch(
        joinPlayerMetadata
      );

      assert.equal(
        (roomPlayerData.list as [number]).length,
        2,
        "checks if the room players length is correctly"
      );

      assert.equal(
        JSON.stringify(roomPlayerData.list),
        JSON.stringify([
          [1, 2, 0],
          [0, 0, 1],
        ]),
        "check if the player list is correctly"
      );

      assert.ok(
        joinPlayerMetaData.createdBy.equals(provider.wallet.publicKey),
        "checks if the attr created_by was assigned on the room player metadata"
      );
    });
  });
});
