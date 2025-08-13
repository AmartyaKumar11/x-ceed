const hre = require("hardhat");

async function main() {
  try {
    console.log("🔍 READ-ONLY Contract Testing (No tokens spent!)...");
    
    const contractAddress = "0x250dA8f9a1F37E1E4D5B5471d8674B630C089e3F";
    const [signer] = await hre.ethers.getSigners();
    
    // Connect to deployed contract
    const XCeedLearningBets = await hre.ethers.getContractFactory("contracts/XCeedLearningBets.sol:XCeedLearningBets");
    const contract = XCeedLearningBets.attach(contractAddress);
    
    console.log("📋 Contract Address:", contractAddress);
    console.log("🔑 Connected account:", signer.address);
    console.log("💰 Your balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), "EDU");
    
    // Test 1: Basic contract info (FREE - no gas cost)
    console.log("\n1️⃣ Contract Status (FREE READ):");
    const nextBetId = await contract.nextBetId();
    console.log("   ✅ Next bet ID:", nextBetId.toString());
    console.log("   ✅ Contract is responsive!");
    
    // Test 2: Preview payout calculations (FREE - no gas cost)
    console.log("\n2️⃣ Payout Preview Testing (FREE READ):");
    const testAmount = hre.ethers.parseEther("0.01"); // 0.01 EDU for calculation only
    
    try {
      const progressLevels = [0, 25, 50, 75, 90, 100];
      console.log(`   Testing payouts for ${hre.ethers.formatEther(testAmount)} EDU bet:`);
      
      for (const progress of progressLevels) {
        const payout = await contract.previewPayout(testAmount, progress);
        const percentage = (Number(hre.ethers.formatEther(payout)) / Number(hre.ethers.formatEther(testAmount)) * 100).toFixed(1);
        console.log(`   ${progress}% progress: ${hre.ethers.formatEther(payout)} EDU (${percentage}% of bet)`);
      }
      console.log("   ✅ Partial payout system working!");
    } catch (error) {
      console.log("   ❌ Error testing payouts:", error.message);
    }
    
    // Test 3: Contract balance (FREE - no gas cost)
    console.log("\n3️⃣ Contract Info (FREE READ):");
    const contractBalance = await hre.ethers.provider.getBalance(contractAddress);
    console.log("   Contract balance:", hre.ethers.formatEther(contractBalance), "EDU");
    
    // Test 4: Check if any existing bets (FREE - no gas cost)
    console.log("\n4️⃣ Existing Bets Check (FREE READ):");
    try {
      if (nextBetId > 1) {
        for (let i = 1; i < nextBetId; i++) {
          try {
            const bet = await contract.bets(i);
            console.log(`   Bet #${i}:`);
            console.log(`     - Skill: ${bet.skillToLearn}`);
            console.log(`     - Amount: ${hre.ethers.formatEther(bet.amount)} EDU`);
            console.log(`     - Active: ${bet.isActive}`);
          } catch (e) {
            console.log(`   Bet #${i}: Not found or error`);
          }
        }
      } else {
        console.log("   📝 No bets created yet");
      }
    } catch (error) {
      console.log("   ❌ Error checking bets:", error.message);
    }
    
    console.log("\n✅ READ-ONLY TESTING COMPLETE!");
    console.log("💰 No tokens were spent in this test!");
    
    console.log("\n🎯 Next Steps:");
    console.log("   1. Test frontend wallet connection");
    console.log("   2. Verify betting interface displays correctly");
    console.log("   3. Check balance validation in UI");
    console.log("   4. Test payout preview in frontend");
    console.log("\n💡 When ready to test with real betting, use TINY amounts like 0.001 EDU!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
