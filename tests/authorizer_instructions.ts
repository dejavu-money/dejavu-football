import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DejavuFootball } from "../target/types/dejavu_football";
import { assert } from "chai";
import createAuthorizer from "./utils/create-authorizer";

describe("Program Authorizer methods", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.DejavuFootball as Program<DejavuFootball>;

  describe('#create-authorizer', async () => {
    it("creates an authorizer", async () => {
      const authId = new Date().getTime();
      const { authorizer } = await createAuthorizer(program, {
        user: provider.wallet.publicKey,
        authId
      })
  
      const authorizerData = await program.account.authorizerAccount.fetch(authorizer);
  
      assert.ok(
        authorizerData.authority.equals(provider.wallet.publicKey)
      );
    });
  });
});
