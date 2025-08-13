const hre = require("hardhat");

async function main() {
  console.log("🎓 Deploying X-CEED Learning Bets Contract to EduChain Testnet...");

  // Get signer
  let deployer;
  try {
    [deployer] = await hre.ethers.getSigners();
    
    if (!deployer) {
      throw new Error("No deployer found");
    }
    
    console.log("🔑 Deploying with account:", deployer.address);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "EDU");

  } catch (error) {
    console.error("❌ Failed to get signer:", error.message);
    console.log("💡 Make sure your PRIVATE_KEY is set in .env file");
    console.log("💡 For educhain network, you need EDU tokens in your wallet");
    process.exit(1);
  }

  // Get the contract factory - use the enhanced version with partial payouts
  const XCeedLearningBets = await hre.ethers.getContractFactory("contracts/XCeedLearningBets.sol:XCeedLearningBets", deployer);

  // Deploy the contract with network gas settings
  console.log("📦 Deploying contract...");
  
  // Get current gas price from network
  const gasPrice = await hre.ethers.provider.getFeeData();
  console.log("Using gas price:", hre.ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
  
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
