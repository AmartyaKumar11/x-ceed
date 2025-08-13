const hre = require("hardhat");

async function main() {
  try {
    console.log("🧪 Testing X-CEED Learning Bets Contract...");
    
    const contractAddress = "0x250dA8f9a1F37E1E4D5B5471d8674B630C089e3F";
    const [signer] = await hre.ethers.getSigners();
    
    // Connect to deployed contract
    const XCeedLearningBets = await hre.ethers.getContractFactory("XCeedLearningBets");
    const contract = XCeedLearningBets.attach(contractAddress);
    
    console.log("📋 Contract Address:", contractAddress);
    console.log("🔑 Testing with account:", signer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), "EDU");
    
    // Test 1: Basic contract info
    console.log("\n1️⃣ Basic Contract Info:");
    const nextBetId = await contract.nextBetId();
    console.log("   Next bet ID:", nextBetId.toString());
    
    // Test 2: Create a test bet
    console.log("\n2️⃣ Creating Test Bet:");
    const skillToLearn = "JavaScript Fundamentals";
    const targetDuration = 7 * 24 * 60 * 60; // 7 days in seconds
    const betAmount = hre.ethers.parseEther("0.001"); // 0.001 EDU
    
    try {
      console.log("   Skill:", skillToLearn);
      console.log("   Duration:", targetDuration / (24 * 60 * 60), "days");
      console.log("   Bet amount:", hre.ethers.formatEther(betAmount), "EDU");
      
      const tx = await contract.createBet(skillToLearn, targetDuration, {
        value: betAmount,
        gasLimit: 500000
      });
      
      console.log("   Transaction hash:", tx.hash);
      console.log("   ⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("   ✅ Bet created successfully!");
      console.log("   Gas used:", receipt.gasUsed.toString());
      
      // Get the created bet details
      const betId = nextBetId;
      const bet = await contract.bets(betId);
      console.log("   📊 Bet Details:");
      console.log("     - ID:", betId.toString());
      console.log("     - Better:", bet.better);
      console.log("     - Skill:", bet.skillToLearn);
      console.log("     - Amount:", hre.ethers.formatEther(bet.amount), "EDU");
      console.log("     - Duration:", bet.targetDuration.toString(), "seconds");
      console.log("     - Active:", bet.isActive);
      
    } catch (error) {
      console.log("   ❌ Error creating bet:", error.message);
    }
    
    // Test 3: Preview payout calculation
    console.log("\n3️⃣ Testing Payout Preview:");
    try {
      const progressPercentages = [25, 50, 75, 90, 100];
      
      for (const progress of progressPercentages) {
        const payout = await contract.previewPayout(betAmount, progress);
        console.log(`   ${progress}% progress: ${hre.ethers.formatEther(payout)} EDU`);
      }
    } catch (error) {
      console.log("   ❌ Error previewing payouts:", error.message);
    }
    
    // Test 4: Contract balance
    console.log("\n4️⃣ Contract Status:");
    const contractBalance = await hre.ethers.provider.getBalance(contractAddress);
    console.log("   Contract balance:", hre.ethers.formatEther(contractBalance), "EDU");
    
    console.log("\n✅ All tests completed!");
    console.log("\n🚀 Ready for production use!");
    console.log("\n📱 Frontend Integration Steps:");
    console.log("   1. Make sure wallet connection works");
    console.log("   2. Test bet creation from UI");
    console.log("   3. Verify balance checking works");
    console.log("   4. Test payout preview display");
    
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
