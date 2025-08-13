const hre = require("hardhat");

async function main() {
  try {
    console.log("💰 Checking deployment readiness...");
    
    // Get signer and balance
    const [signer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(signer.address);
    const balanceEDU = hre.ethers.formatEther(balance);
    
    console.log("Address:", signer.address);
    console.log("Current balance:", balanceEDU, "EDU");
    
    // Check minimum recommended balance
    const minBalance = hre.ethers.parseEther("0.1"); // 0.1 EDU minimum
    
    if (balance < minBalance) {
      console.log("❌ Insufficient balance for deployment");
      console.log("📢 Minimum recommended: 0.1 EDU");
      console.log("🚰 Please get more tokens from: https://faucet.open-campus.xyz/");
      console.log("🔄 Run this script again after getting tokens");
    } else {
      console.log("✅ Balance sufficient for deployment");
      console.log("🚀 Ready to deploy contract!");
    }
    
  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
