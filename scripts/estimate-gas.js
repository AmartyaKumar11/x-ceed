const hre = require("hardhat");

async function main() {
  console.log("⛽ Estimating gas costs for XCeedLearningBets deployment...");

  try {
    // Get the contract factory
    const XCeedLearningBets = await hre.ethers.getContractFactory("contracts/XCeedLearningBets.sol:XCeedLearningBets");

    // Estimate deployment gas
    const deployTx = XCeedLearningBets.getDeployTransaction();
    const estimatedGas = await hre.ethers.provider.estimateGas(deployTx);
    
    console.log("📊 Gas Estimation:");
    console.log("💨 Estimated gas:", estimatedGas.toString());
    
    // Calculate cost at different gas prices
    const gasPrices = [
      { name: "Ultra Low", price: 250000000n }, // 0.25 gwei
      { name: "Low", price: 500000000n },       // 0.5 gwei
      { name: "Standard", price: 1000000000n }, // 1 gwei
      { name: "High", price: 2000000000n }      // 2 gwei
    ];
    
    console.log("\n💰 Cost estimates:");
    gasPrices.forEach(({ name, price }) => {
      const cost = estimatedGas * price;
      const ethCost = hre.ethers.formatEther(cost);
      console.log(`${name.padEnd(12)}: ${ethCost} EDU`);
    });
    
    // Current account balance
    if (hre.network.name === 'educhain') {
      const [deployer] = await hre.ethers.getSigners();
      if (deployer) {
        const balance = await deployer.provider.getBalance(deployer.address);
        console.log(`\n💼 Your current balance: ${hre.ethers.formatEther(balance)} EDU`);
        
        // Check if sufficient for deployment
        const requiredForDeployment = estimatedGas * 500000000n; // At 0.5 gwei
        const sufficient = balance >= requiredForDeployment;
        
        console.log(`🎯 Required for deployment: ${hre.ethers.formatEther(requiredForDeployment)} EDU`);
        console.log(`${sufficient ? '✅' : '❌'} ${sufficient ? 'Sufficient funds!' : 'Need more EDU tokens'}`);
        
        if (!sufficient) {
          const needed = requiredForDeployment - balance;
          console.log(`💸 You need ${hre.ethers.formatEther(needed)} more EDU`);
          console.log(`🚰 Get testnet EDU from: https://faucet.open-campus-codex.gelato.digital/`);
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Gas estimation failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
