import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DejavuFootball } from "../target/types/dejavu_football";
import createAuthorizer from "./utils/create-authorizer";
import { assert } from "chai";
import { BN } from "bn.js";
import createOracle from "./utils/create-oracle";
import updateOracle from "./utils/update-oracle";

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

  describe("#create-oracle", async () => {
    it("creates an oracle", async () => {
      // create an auhorizer
      const authId = new Date().getTime();
      const closedAt = new Date().getTime();
      const finishedAt = new Date().getTime() + 1;

      const { authorizer } = await createAuthorizer(program, {
        user: provider.wallet.publicKey,
        authId,
        connection: provider.connection,
        payerSign: payer,
      });

      // create an oracle

      const { oracle } = await createOracle(program, {
        teamAId: 1,
        teamBId: 2,
        context: 1,
        contextId: 666,
        user: provider.wallet.publicKey,
        closedAt,
        finishedAt,
        authorizer,
        authId,
      });

      const oracleData = await program.account.oracle.fetch(oracle);

      assert.ok(
        oracleData.authorizer.equals(authorizer),
        "verify if the authorizer was assigned"
      );

      assert.ok(
        oracleData.closedAt.eq(new BN(closedAt)),
        "verify if closed_at was assigned"
      );

      assert.ok(
        oracleData.finishedAt.eq(new BN(finishedAt)),
        "verify if finishedAt was assigned"
      );

      assert.ok(oracleData.teamsIds[0] === 1, "verify if team_a was assigned");
      assert.ok(oracleData.teamsIds[1] === 2, "verify if team_a was assigned");
      assert.ok(oracleData.context === 1, "verify if context was assigned");
      assert.ok(
        oracleData.contextId.eq(new BN(666)),
        "verify if contextId was assigned"
      );
    });
  });

  describe("#update-oracle", async () => {
    it("updates an oracle", async () => {
      // create an auhorizer

      const authId = new Date().getTime();
      const closedAt = new Date().getTime();
      const finishedAt = new Date().getTime() + 1;

      const { authorizer } = await createAuthorizer(program, {
        user: provider.wallet.publicKey,
        authId,
        connection: provider.connection,
        payerSign: payer,
      });

      // create an oracle

      const { oracle } = await createOracle(program, {
        teamAId: 20,
        teamBId: 25,
        user: provider.wallet.publicKey,
        closedAt,
        finishedAt,
        authorizer,
        authId,
      });

      // update oracle

      await updateOracle(program, {
        user: provider.wallet.publicKey,
        teamAValue: 1,
        teamBValue: 2,
        oracle,
        authorizer,
      });

      const oracleData = await program.account.oracle.fetch(oracle);

      assert.ok(oracleData.authorizer.equals(authorizer), "verify authorizer");

      assert.ok(oracleData.closedAt.eq(new BN(closedAt)), "verify closedAt");

      assert.ok(
        oracleData.finishedAt.eq(new BN(finishedAt)),
        "verify finishedAt"
      );

      assert.ok(oracleData.teamsIds[0] === 20, "verify team_a");

      assert.ok(oracleData.teamsIds[1] === 25, "verify team_b");

      assert.ok(oracleData.results[0] === 1, "verify result team_a");

      assert.ok(oracleData.results[1] === 2, "verify result team_b");
    });
  });

  describe("#invalidate-oracle", async () => {
    it("invalidates an oracle", async () => {
      const reason = "game suspended";
      // create an auhorizer

      const authId = new Date().getTime();
      const closedAt = new Date().getTime();
      const finishedAt = new Date().getTime() + 1;

      const { authorizer } = await createAuthorizer(program, {
        user: provider.wallet.publicKey,
        authId,
        connection: provider.connection,
        payerSign: payer,
      });

      // create an oracle

      const { oracle } = await createOracle(program, {
        teamAId: 20,
        teamBId: 25,
        user: provider.wallet.publicKey,
        closedAt,
        finishedAt,
        authorizer,
        authId,
      });

      // Create an oracle invalid metadata account

      const [oracleInvalidMetadata] =
        await anchor.web3.PublicKey.findProgramAddress(
          [oracle.toBuffer(), Buffer.from("invalid")],
          program.programId
        );

      // invalidate oracle

      await program.methods
        .invalidateOracle(reason)
        .accounts({
          authorizer: authorizer,
          oracle: oracle,
          user: provider.wallet.publicKey,
          oracleInvalidMedata: oracleInvalidMetadata,
        })
        .rpc();

      const oracleData = await program.account.oracle.fetch(oracle);
      const oracleInvalidData =
        await program.account.oracleInvalidMetadata.fetch(
          oracleInvalidMetadata
        );

      assert.ok(oracleData.isInvalid, "verify if the oracle was invalidaded");
      assert.equal(
        oracleInvalidData.reason,
        reason,
        "verify if the reason was asssigned"
      );
    });
  });
});
