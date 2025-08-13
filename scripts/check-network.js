const hre = require("hardhat");

async function main() {
  try {
    console.log("🔍 Checking network parameters...");
    
    // Get network info
    const provider = hre.ethers.provider;
    const network = await provider.getNetwork();
    console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
    
    // Get current gas price
    const gasPrice = await provider.getFeeData();
    console.log("Current gas price:", hre.ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    console.log("Max fee per gas:", hre.ethers.formatUnits(gasPrice.maxFeePerGas || gasPrice.gasPrice, "gwei"), "gwei");
    console.log("Max priority fee:", hre.ethers.formatUnits(gasPrice.maxPriorityFeePerGas || 0, "gwei"), "gwei");
    
    // Get block info
    const block = await provider.getBlock("latest");
    console.log("Latest block:", block.number);
    console.log("Block gas limit:", block.gasLimit.toString());
    console.log("Block gas used:", block.gasUsed.toString());
    
    // Get signer info
    const [signer] = await hre.ethers.getSigners();
    const balance = await provider.getBalance(signer.address);
    console.log("Signer address:", signer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "EDU");
    
    // Calculate costs at different gas prices
    const gasLimit = 6000000n; // Use BigInt
    console.log("\n💰 Cost calculations for gas limit", gasLimit.toString(), ":");
    
    const prices = ["0.01", "0.02", "0.1", "0.25", "0.5", "1.0"];
    for (const price of prices) {
      const gasPrice = hre.ethers.parseUnits(price, "gwei");
      const cost = gasLimit * gasPrice;
      console.log(`${price} gwei: ${hre.ethers.formatEther(cost)} EDU`);
    }
    
  } catch (error) {
    console.error("❌ Error checking network:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
