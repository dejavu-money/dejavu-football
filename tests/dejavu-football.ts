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

});
