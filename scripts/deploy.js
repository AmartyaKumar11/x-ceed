const hre = require("hardhat");

async function main() {
  console.log("🎓 Deploying X-CEED Learning Bets Contract to EduChain Testnet...");

  // Get the contract factory
  const XCeedLearningBets = await hre.ethers.getContractFactory("XCeedLearningBets");

  // Deploy the contract
  console.log("📦 Deploying contract...");
  const learningBets = await XCeedLearningBets.deploy();

  await learningBets.waitForDeployment();

  const contractAddress = await learningBets.getAddress();
  
  console.log("✅ XCeedLearningBets deployed to:", contractAddress);
  console.log("🔗 Contract URL:", `https://opencampus-codex.blockscout.com/address/${contractAddress}`);
  
  // Log deployment info for .env update
  console.log("\n📝 Add this to your .env.local file:");
  console.log(`NEXT_PUBLIC_LEARNING_BETS_CONTRACT=${contractAddress}`);
  
  // Wait for block confirmations before verification
  console.log("⏳ Waiting for block confirmations...");
  await learningBets.deploymentTransaction().wait(3);
  
  // Verify contract on Lineascan (optional)
  if (process.env.LINEASCAN_API_KEY) {
    console.log("🔍 Verifying contract on Lineascan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Lineascan!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }

  // Test basic contract functionality
  console.log("\n🧪 Testing contract functionality...");
  
  try {
    const balance = await learningBets.getContractBalance();
    console.log("📊 Contract balance:", hre.ethers.formatEther(balance), "ETH");
    
    const nextBetId = await learningBets.nextBetId();
    console.log("🎯 Next bet ID:", nextBetId.toString());
    
    console.log("✅ Contract is working correctly!");
  } catch (error) {
    console.log("❌ Contract test failed:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("🔧 Don't forget to update your .env.local file with the contract address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
