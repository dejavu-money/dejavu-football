import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DejavuFootball } from "../target/types/dejavu_football";
import { BN } from "bn.js";
import { assert } from "chai";

describe("dejavu-football", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.DejavuFootball as Program<DejavuFootball>;

  describe('#create-authorizer', async () => {
    it("creates an authorizer", async () => {
      const authId = new Date().getTime();
      const [authorizer] = await anchor.web3.PublicKey.findProgramAddress(
        [provider.wallet.publicKey.toBuffer(), Buffer.from(`id-${authId}`)],
        program.programId
      );
  
      await program.methods.createAuthorizer(new BN(authId)).accounts({
        authorizer: authorizer,
        user: provider.wallet.publicKey
      }).rpc();
  
      const authorizerData = await program.account.authorizerAccount.fetch(authorizer);
  
      assert.ok(
        authorizerData.authority.equals(provider.wallet.publicKey)
      );
    });
  });

  describe('#create-oracle', async () => {
    it("creates an oracle", async () => {
      // create an auhorizer
      const authId = new Date().getTime();
      const closedAt = new Date().getTime();
      const finishedAt = new Date().getTime() + 1;
      
      const [authorizer] = await anchor.web3.PublicKey.findProgramAddress(
        [provider.wallet.publicKey.toBuffer(), Buffer.from(`id-${authId}`)],
        program.programId
      );
  
      await program.methods.createAuthorizer(new BN(authId)).accounts({
        authorizer: authorizer,
        user: provider.wallet.publicKey
      }).rpc();

      // create an oracle

      const [oracle] = await anchor.web3.PublicKey.findProgramAddress(
        [authorizer.toBuffer(), Buffer.from(`id-${authId}`)],
        program.programId
      );

      await program.methods.createOracle(
        new BN(authId), // oracle id
        1, // team_a id
        2,  // team_b id
        new BN(closedAt), // closed_at timestamp, 
        new BN(finishedAt) // finished_at timestamp
      ).accounts({
        authorizer: authorizer,
        oracle: oracle,
        user: provider.wallet.publicKey
      }).rpc();

      const oracleData = await program.account.oracle.fetch(oracle);

      assert.ok(
        oracleData.authorizer.equals(authorizer)
      );

      assert.ok(
        oracleData.closedAt.eq(new BN(closedAt))
      );

      assert.ok(
        oracleData.finishedAt.eq(new BN(finishedAt))
      );

      assert.ok(
        oracleData.teamIds[0] === 1
      );

      assert.ok(
        oracleData.teamIds[1] === 2
      );
    });
  });

  describe('#update-oracle', async () => {
    it("updates an oracle", async () => {
      // create an auhorizer

      const authId = new Date().getTime();
      const closedAt = new Date().getTime();
      const finishedAt = new Date().getTime() + 1;
      
      const [authorizer] = await anchor.web3.PublicKey.findProgramAddress(
        [provider.wallet.publicKey.toBuffer(), Buffer.from(`id-${authId}`)],
        program.programId
      );
  
      await program.methods.createAuthorizer(new BN(authId)).accounts({
        authorizer: authorizer,
        user: provider.wallet.publicKey
      }).rpc();

      // create an oracle

      const [oracle] = await anchor.web3.PublicKey.findProgramAddress(
        [authorizer.toBuffer(), Buffer.from(`id-${authId}`)],
        program.programId
      );

      await program.methods.createOracle(
        new BN(authId), // oracle id
        20, // team_a id
        25,  // team_b id
        new BN(closedAt), // closed_at timestamp, 
        new BN(finishedAt) // finished_at timestamp
      ).accounts({
        authorizer: authorizer,
        oracle: oracle,
        user: provider.wallet.publicKey
      }).rpc();

      // update oracle

      await program.methods.updateOracle(1, 2).accounts({
        authorizer: authorizer,
        oracle: oracle,
        user: provider.wallet.publicKey
      }).rpc();

      const oracleData = await program.account.oracle.fetch(oracle);

      assert.ok(
        oracleData.authorizer.equals(authorizer)
      );

      assert.ok(
        oracleData.closedAt.eq(new BN(closedAt))
      );

      assert.ok(
        oracleData.finishedAt.eq(new BN(finishedAt))
      );

      assert.ok(
        oracleData.teamIds[0] === 20
      );

      assert.ok(
        oracleData.teamIds[1] === 25
      );

      assert.ok(
        oracleData.results[0] === 1
      );

      assert.ok(
        oracleData.results[1] === 2
      );
    });
  });

});
