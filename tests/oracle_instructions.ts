// import * as anchor from "@project-serum/anchor";
// import { Program } from "@project-serum/anchor";
// import { DejavuFootball } from "../target/types/dejavu_football";
// import { BN } from "bn.js";
// import { assert } from "chai";
// import createAuthorizer from "./utils/create-authorizer";
// import createOracle from "./utils/create-oracle";
// import updateOracle from "./utils/update-oracle";

// describe("Program Oracle methods", () => {
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);
//   const program = anchor.workspace.DejavuFootball as Program<DejavuFootball>;

//   describe('#create-oracle', async () => {
//     it("creates an oracle", async () => {
//       // create an auhorizer
//       const authId = new Date().getTime();
//       const closedAt = new Date().getTime();
//       const finishedAt = new Date().getTime() + 1;
      
//       const { authorizer } = await createAuthorizer(program, {
//         user: provider.wallet.publicKey,
//         authId
//       });


//       // create an oracle

//       const { oracle } = await createOracle(program, {
//         teamAId: 1,
//         teamBId: 2,
//         user: provider.wallet.publicKey,
//         closedAt,
//         finishedAt,
//         authorizer,
//         authId
//       });

//       const oracleData = await program.account.oracle.fetch(oracle);

//       assert.ok(
//         oracleData.authorizer.equals(authorizer)
//       );

//       assert.ok(
//         oracleData.closedAt.eq(new BN(closedAt))
//       );

//       assert.ok(
//         oracleData.finishedAt.eq(new BN(finishedAt))
//       );

//       assert.ok(
//         oracleData.teamIds[0] === 1
//       );

//       assert.ok(
//         oracleData.teamIds[1] === 2
//       );
//     });
//   });

//   describe('#update-oracle', async () => {
//     it("updates an oracle", async () => {
//       // create an auhorizer

//       const authId = new Date().getTime();
//       const closedAt = new Date().getTime();
//       const finishedAt = new Date().getTime() + 1;
      
//       const { authorizer } = await createAuthorizer(program, {
//         user: provider.wallet.publicKey,
//         authId
//       })

//       // create an oracle

//       const { oracle } = await createOracle(program, {
//         teamAId: 20,
//         teamBId: 25,
//         user: provider.wallet.publicKey,
//         closedAt,
//         finishedAt,
//         authorizer,
//         authId
//       });

//       // update oracle

//       await updateOracle(program, {
//           user: provider.wallet.publicKey,
//           teamAValue: 1,
//           teamBValue: 2,
//           oracle,
//           authorizer
//         }
//       );

//       const oracleData = await program.account.oracle.fetch(oracle);

//       assert.ok(
//         oracleData.authorizer.equals(authorizer)
//       );

//       assert.ok(
//         oracleData.closedAt.eq(new BN(closedAt))
//       );

//       assert.ok(
//         oracleData.finishedAt.eq(new BN(finishedAt))
//       );

//       assert.ok(
//         oracleData.teamIds[0] === 20
//       );

//       assert.ok(
//         oracleData.teamIds[1] === 25
//       );

//       assert.ok(
//         oracleData.results[0] === 1
//       );

//       assert.ok(
//         oracleData.results[1] === 2
//       );
//     });
//   });

//   describe('#invalidate-oracle', async () => {
//     it("invalidates an oracle", async () => {
//       const reason = 'game suspended';
//       // create an auhorizer

//       const authId = new Date().getTime();
//       const closedAt = new Date().getTime();
//       const finishedAt = new Date().getTime() + 1;
      
//       const { authorizer } = await createAuthorizer(program, {
//         user: provider.wallet.publicKey,
//         authId
//       })

//       // create an oracle

//       const { oracle } = await createOracle(program, {
//         teamAId: 20,
//         teamBId: 25,
//         user: provider.wallet.publicKey,
//         closedAt,
//         finishedAt,
//         authorizer,
//         authId
//       });

//       // Create an oracle invalid metadata account
      
//       const [oracleInvalidMetadata] = await anchor.web3.PublicKey.findProgramAddress(
//         [oracle.toBuffer(), Buffer.from('invalid')],
//         program.programId
//       );

//       // invalidate oracle

//       await program.methods.invalidateOracle(reason).accounts({
//         authorizer: authorizer,
//         oracle: oracle,
//         user: provider.wallet.publicKey,
//         oracleInvalidMedata: oracleInvalidMetadata
//       }).rpc();

//       const oracleData = await program.account.oracle.fetch(oracle);
//       const oracleInvalidData = await program.account.oracleInvalidMetadata.fetch(oracleInvalidMetadata);

//       assert.ok(oracleData.isInvalid);
//       assert.equal(oracleInvalidData.reason, reason);
//     });
//   });
// });
