import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DejavuFootball } from "../target/types/dejavu_football";
import createAuthorizer from "./utils/create-authorizer";
import createToken from "./utils/create-token";
import { assert } from "chai";

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

  describe("#create-authorizer", async () => {
    it("creates an authorizer", async () => {
      const token = await createToken({
        inputs: {
          connection: provider.connection,
          amount: 1,
        },
        accounts: {
          payer: provider.wallet.publicKey,
          payerSign: payer,
        },
      });

      const authId = new Date().getTime();
      const { authorizer } = await createAuthorizer(program, {
        connection: provider.connection,
        payerSign: payer,
        user: provider.wallet.publicKey,
        authId,
        mint: token.accounts.mint,
      });

      const authorizerData = await program.account.authorizerAccount.fetch(
        authorizer
      );

      assert.ok(
        authorizerData.authority.equals(provider.wallet.publicKey),
        "verify if the authority was assigned"
      );

      assert.ok(
        authorizerData.mint.equals(token.accounts.mint),
        "verify if the mint was assigned"
      );
    });
  });
});
