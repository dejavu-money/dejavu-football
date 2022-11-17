import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DejavuFootball } from "../target/types/dejavu_football";
import createAuthorizer from "./utils/create-authorizer";
import { assert } from "chai";
import { BN } from "bn.js";
import createOracle from "./utils/create-oracle";
import updateOracle from "./utils/update-oracle";
import createRoom from "./utils/create-room";
import createToken from "./utils/create-token";
import joinRoom from "./utils/join-room";

describe("dejavu-solana", () => {
  const provider = anchor.AnchorProvider.env();
  const payer = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        require("fs").readFileSync(process.env.ANCHOR_WALLET, {
          encoding: "utf-8",
        })
      )
    )
  );

  anchor.setProvider(provider);

  const program = anchor.workspace.DejavuFootball as Program<DejavuFootball>;

  describe("#create-room", async () => {
    it("creates a room", async () => {
      const authId = new Date().getTime();
      const roomId = new Date().getTime();

      // create token
      const token = await createToken({
        inputs: {
          connection: provider.connection,
          amount: 5,
        },
        accounts: {
          payerSign: payer,
          payer: payer.publicKey,
        },
      });

      // create auth
      const { authorizer } = await createAuthorizer(program, {
        user: provider.wallet.publicKey,
        authId,
        connection: provider.connection,
        payerSign: payer,
        mint: token.accounts.mint,
      });

      const closedAt = Math.floor(Date.now() / 1000) + 60;
      const finishedAt = Math.floor(Date.now() / 1000);

      // create oracle
      const { oracle } = await createOracle(program, {
        teamAId: 1,
        teamBId: 2,
        user: provider.wallet.publicKey,
        closedAt,
        finishedAt,
        authorizer,
        authId,
      });

      const { payerMintAccount: playerMintTokenAccount, mint: vaultMint } =
        token.accounts;

      const roomInstruction = {
        roomId: roomId,
        initAmount: 1,
        teamAResult: 1,
        teamBResult: 2,
        playerKey: 0,
      };

      // create room
      const response = await createRoom(program, {
        inputs: {
          roomId: roomInstruction.roomId,
          teamAResult: roomInstruction.teamAResult,
          teamBResult: roomInstruction.teamBResult,
          playerKey: roomInstruction.playerKey,
          initAmount: roomInstruction.initAmount,
        },
        accounts: {
          user: provider.wallet.publicKey,
          vaultMint: vaultMint,
          oracle: oracle,
          authorizer: authorizer,
          playerMintTokenAccount: playerMintTokenAccount,
        },
      });

      const { room, roomPlayers, roomPlayerMetadata, vault } =
        response.accounts;

      const roomData = await program.account.room.fetch(room);
      const roomPlayerData = await program.account.roomPlayers.fetch(
        roomPlayers
      );
      const roomPlayerMetaData = await program.account.roomsHistory.fetch(
        roomPlayerMetadata
      );

      const vaultMintAccountBalance =
        await provider.connection.getTokenAccountBalance(vault);

      const playerMintAccountBalance =
        await provider.connection.getTokenAccountBalance(
          playerMintTokenAccount
        );

      // room checks

      assert.equal(
        Number(playerMintAccountBalance.value.amount),
        4,
        "checks if player mint account was decreased a token by the program"
      );

      assert.equal(
        Number(roomData.playersCount),
        1,
        "checks if room player count is assigned"
      );

      assert.equal(
        Number(vaultMintAccountBalance.value.amount),
        1,
        "checks if player mint account was decreased a token by the program"
      );

      assert.ok(
        roomData.isFinished === false,
        "checks if the attr is_finished is set false when the room is initialized"
      );

      assert.ok(
        roomData.oracle.equals(oracle),
        "checks if the oracle is assigned on the room account"
      );
      assert.ok(
        roomData.initAmount.eq(new BN(roomInstruction.initAmount)),
        "checks if the init amount is assigned on the room account"
      );

      // player metadata checks

      assert.ok(
        roomPlayerMetaData.createdBy.equals(provider.wallet.publicKey),
        "checks if the attr created_by was assigned on the room player metadata"
      );

      // room players checks

      assert.ok(
        (roomPlayerData.list as [[number]]).length === 1,
        "checks if the player list length is 1 when the room is initialized"
      );

      assert.equal(
        JSON.stringify(roomPlayerData.list),
        JSON.stringify([[1, 2, 0]]),
        "check if the player list is correctly"
      );
    });
  });

  describe("#join-room", async () => {
    it("joins to a room", async () => {
      const authId = new Date().getTime();
      const roomId = new Date().getTime();

      // create token
      const token = await createToken({
        inputs: {
          connection: provider.connection,
          amount: 5,
        },
        accounts: {
          payerSign: payer,
          payer: payer.publicKey,
        },
      });

      // create auth
      const { authorizer } = await createAuthorizer(program, {
        user: provider.wallet.publicKey,
        authId,
        connection: provider.connection,
        payerSign: payer,
        mint: token.accounts.mint,
      });

      // create oracle
      const closedAt = Math.floor(Date.now() / 1000) + 60;
      const finishedAt = Math.floor(Date.now() / 1000);
      const { oracle } = await createOracle(program, {
        teamAId: 1,
        teamBId: 2,
        user: provider.wallet.publicKey,
        closedAt,
        finishedAt,
        authorizer,
        authId,
      });

      const { payerMintAccount: playerMintTokenAccount, mint: vaultMint } =
        token.accounts;

      const roomInstruction = {
        roomId: roomId,
        initAmount: 1,
        teamAResult: 1,
        teamBResult: 2,
        playerKey: 0,
      };

      // create room
      const response = await createRoom(program, {
        inputs: {
          roomId: roomInstruction.roomId,
          teamAResult: roomInstruction.teamAResult,
          teamBResult: roomInstruction.teamBResult,
          playerKey: roomInstruction.playerKey,
          initAmount: roomInstruction.initAmount,
        },
        accounts: {
          authorizer: authorizer,
          user: provider.wallet.publicKey,
          vaultMint: vaultMint,
          oracle: oracle,
          playerMintTokenAccount: playerMintTokenAccount,
        },
      });

      const { room, roomPlayers, vault } = response.accounts;

      // join room

      const joinRoomResponse = await joinRoom(program, {
        inputs: {
          teamAResult: 0,
          teamBResult: 0,
          playerKey: 1,
        },
        accounts: {
          authorizer: authorizer,
          user: provider.wallet.publicKey,
          room,
          roomPlayers,
          vaultMint,
          oracle,
          playerMintTokenAccount,
          vaultAccount: vault,
        },
      });
      const roomData = await program.account.room.fetch(room);
      const { joinPlayerMetadata } = joinRoomResponse.accounts;

      let roomPlayerData = await program.account.roomPlayers.fetch(roomPlayers);

      let joinPlayerMetaData = await program.account.roomsHistory.fetch(
        joinPlayerMetadata
      );

      const vaultMintAccountBalance =
        await provider.connection.getTokenAccountBalance(vault);

      const playerMintAccountBalance =
        await provider.connection.getTokenAccountBalance(
          playerMintTokenAccount
        );

      assert.equal(
        Number(roomData.playersCount),
        2,
        "checks if room player count is assigned"
      );

      assert.equal(
        Number(vaultMintAccountBalance.value.amount),
        2,
        "checks if room vault account was increased a token by the program"
      );

      assert.equal(
        Number(playerMintAccountBalance.value.amount),
        3,
        "checks if player mint account was decreased a token by the program"
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

  describe("#withdraw", async () => {
    it("withdraws all the funds because the player won the bet", async () => {
      const authId = new Date().getTime();
      const roomId = new Date().getTime();

      const playerInitBalance = 1000000 * 20; // 20$;
      // create token
      const token = await createToken({
        inputs: {
          connection: provider.connection,
          amount: playerInitBalance,
          decimals: 6,
        },
        accounts: {
          payerSign: payer,
          payer: payer.publicKey,
        },
      });

      // create auth
      const { authorizer, vaultAccount: authorizerVaultAccount } =
        await createAuthorizer(program, {
          user: provider.wallet.publicKey,
          authId,
          connection: provider.connection,
          payerSign: payer,
          mint: token.accounts.mint,
          fee: 50,
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

      const { payerMintAccount: playerMintTokenAccount, mint: vaultMint } =
        token.accounts;

      const roomInstruction = {
        roomId: roomId,
        initAmount: 1000000,
        teamAResult: 1,
        teamBResult: 2,
        playerKey: 0,
      };

      // create room
      const response = await createRoom(program, {
        inputs: {
          roomId: roomInstruction.roomId,
          teamAResult: roomInstruction.teamAResult,
          teamBResult: roomInstruction.teamBResult,
          playerKey: roomInstruction.playerKey,
          initAmount: roomInstruction.initAmount,
        },
        accounts: {
          authorizer: authorizer,
          user: provider.wallet.publicKey,
          vaultMint: vaultMint,
          oracle: oracle,
          playerMintTokenAccount: playerMintTokenAccount,
        },
      });

      const { room, roomPlayers, vault } = response.accounts;

      // join room

      const joinRoomResponse = await joinRoom(program, {
        inputs: {
          teamAResult: 2,
          teamBResult: 2,
          playerKey: 1,
        },
        accounts: {
          authorizer: authorizer,
          user: provider.wallet.publicKey,
          room,
          roomPlayers,
          vaultMint,
          oracle,
          playerMintTokenAccount,
          vaultAccount: vault,
        },
      });

      const { joinPlayerMetadata } = joinRoomResponse.accounts;

      // withdraw

      await updateOracle(program, {
        user: provider.wallet.publicKey,
        teamAValue: 2,
        teamBValue: 2,
        oracle,
        authorizer,
      });

      await program.methods
        .withdraw()
        .accounts({
          authorizer: authorizer,
          oracle: oracle,
          mint: vaultMint,
          room: room,
          roomHistory: joinPlayerMetadata,
          players: roomPlayers,
          vaultAccount: vault,
          playerTokenAccount: playerMintTokenAccount,
          authorizerVaultAccount: authorizerVaultAccount,
        })
        .rpc();

      const vaultMintAccountBalance =
        await provider.connection.getTokenAccountBalance(vault);

      const playerMintAccountBalance =
        await provider.connection.getTokenAccountBalance(
          playerMintTokenAccount
        );

      assert.equal(
        Number(vaultMintAccountBalance.value.amount),
        0,
        "checks if room vault account was decreased"
      );

      assert.equal(
        Number(playerMintAccountBalance.value.amount),
        (playerInitBalance - roomInstruction.initAmount * 2 * 0.5) as number,
        "checks if player token account was increased"
      );
    });

    it("withdraws the player bet because anyone won the bet", async () => {
      const authId = new Date().getTime();
      const roomId = new Date().getTime();

      // create token
      const token = await createToken({
        inputs: {
          connection: provider.connection,
          amount: 5,
        },
        accounts: {
          payerSign: payer,
          payer: payer.publicKey,
        },
      });

      // create auth
      const { authorizer, vaultAccount: authorizerVaultAccount } =
        await createAuthorizer(program, {
          user: provider.wallet.publicKey,
          authId,
          connection: provider.connection,
          payerSign: payer,
          mint: token.accounts.mint,
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

      const { payerMintAccount: playerMintTokenAccount, mint: vaultMint } =
        token.accounts;

      const roomInstruction = {
        roomId: roomId,
        initAmount: 1,
        teamAResult: 1,
        teamBResult: 2,
        playerKey: 0,
      };

      // create room
      const response = await createRoom(program, {
        inputs: {
          roomId: roomInstruction.roomId,
          teamAResult: roomInstruction.teamAResult,
          teamBResult: roomInstruction.teamBResult,
          playerKey: roomInstruction.playerKey,
          initAmount: roomInstruction.initAmount,
        },
        accounts: {
          authorizer: authorizer,
          user: provider.wallet.publicKey,
          vaultMint: vaultMint,
          oracle: oracle,
          playerMintTokenAccount: playerMintTokenAccount,
        },
      });

      const { room, roomPlayers, vault, roomPlayerMetadata } =
        response.accounts;

      // join room

      const joinRoomResponse = await joinRoom(program, {
        inputs: {
          teamAResult: 2,
          teamBResult: 2,
          playerKey: 1,
        },
        accounts: {
          authorizer: authorizer,
          user: provider.wallet.publicKey,
          room,
          roomPlayers,
          vaultMint,
          oracle,
          playerMintTokenAccount,
          vaultAccount: vault,
        },
      });

      const { joinPlayerMetadata } = joinRoomResponse.accounts;

      // withdraw

      await updateOracle(program, {
        user: provider.wallet.publicKey,
        teamAValue: 10,
        teamBValue: 10,
        oracle,
        authorizer,
      });

      await program.methods
        .withdraw()
        .accounts({
          authorizer: authorizer,
          oracle: oracle,
          mint: vaultMint,
          room: room,
          roomHistory: joinPlayerMetadata,
          players: roomPlayers,
          vaultAccount: vault,
          playerTokenAccount: playerMintTokenAccount,
          authorizerVaultAccount: authorizerVaultAccount,
        })
        .rpc();

      const joinPlayerMetadataData =
        await program.account.roomsHistory.fetch(joinPlayerMetadata);

      const vaultMintAccountBalance =
        await provider.connection.getTokenAccountBalance(vault);

      const playerMintAccountBalance =
        await provider.connection.getTokenAccountBalance(
          playerMintTokenAccount
        );

      assert.ok(
        joinPlayerMetadataData.withdrew,
        "checks if the attr withdrew on player metadata was updated by the program"
      );

      assert.equal(
        Number(vaultMintAccountBalance.value.amount),
        1,
        "checks if room vault account was increased a token by the program"
      );

      assert.equal(
        Number(playerMintAccountBalance.value.amount),
        4,
        "checks if player mint account was decreased a token by the program"
      );
    });
  });
});
