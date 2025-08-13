const hre = require("hardhat");

async function main() {
  try {
    console.log("🔍 Checking recent transactions and deployment status...");
    
    // Get signer
    const [signer] = await hre.ethers.getSigners();
    console.log("Address:", signer.address);
    
    // Get current balance
    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log("Current balance:", hre.ethers.formatEther(balance), "EDU");
    
    // Get latest transactions (check nonce)
    const nonce = await signer.getNonce();
    console.log("Current nonce:", nonce);
    
    // Check if balance decreased (indicating a transaction went through)
    const expectedBalance = "0.1135"; // Balance before deployment
    const currentBalance = hre.ethers.formatEther(balance);
    
    if (parseFloat(currentBalance) < parseFloat(expectedBalance)) {
      console.log("💸 Balance decreased - transaction likely went through!");
      console.log("🔄 Let's check for deployed contracts...");
      
      // Try to get recent blocks and look for contract creation
      const latestBlock = await hre.ethers.provider.getBlock("latest");
      console.log("Latest block:", latestBlock.number);
      
      // Check last few blocks for contract deployments
      for (let i = 0; i < 5; i++) {
        const blockNum = latestBlock.number - i;
        const block = await hre.ethers.provider.getBlock(blockNum, true);
        
        if (block && block.transactions) {
          const contractCreations = block.transactions.filter(tx => 
            tx.to === null && tx.from.toLowerCase() === signer.address.toLowerCase()
          );
          
          if (contractCreations.length > 0) {
            console.log(`📦 Found contract deployment in block ${blockNum}:`);
            for (const tx of contractCreations) {
              console.log("Transaction hash:", tx.hash);
              
              // Get transaction receipt to find contract address
              const receipt = await hre.ethers.provider.getTransactionReceipt(tx.hash);
              if (receipt && receipt.contractAddress) {
                console.log("✅ CONTRACT DEPLOYED AT:", receipt.contractAddress);
                console.log("Gas used:", receipt.gasUsed.toString());
                console.log("Block:", receipt.blockNumber);
                return receipt.contractAddress;
              }
            }
          }
        }
      }
    } else {
      console.log("💰 Balance unchanged - deployment may not have completed");
    }
    
    console.log("🔄 No recent contract deployments found");
    
  } catch (error) {
    console.error("❌ Error checking deployment status:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
