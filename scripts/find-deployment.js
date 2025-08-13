const hre = require("hardhat");

async function main() {
  try {
    console.log("🔍 Detailed transaction analysis...");
    
    const [signer] = await hre.ethers.getSigners();
    console.log("Address:", signer.address);
    
    // Check more blocks (last 20)
    const latestBlock = await hre.ethers.provider.getBlock("latest");
    console.log("Latest block:", latestBlock.number);
    console.log("Checking last 20 blocks for transactions...");
    
    for (let i = 0; i < 20; i++) {
      const blockNum = latestBlock.number - i;
      try {
        const block = await hre.ethers.provider.getBlock(blockNum, true);
        
        if (block && block.transactions) {
          // Look for ANY transactions from our address
          const ourTxs = block.transactions.filter(tx => 
            tx.from.toLowerCase() === signer.address.toLowerCase()
          );
          
          if (ourTxs.length > 0) {
            console.log(`\n📋 Block ${blockNum} - Found ${ourTxs.length} transaction(s) from your address:`);
            
            for (const tx of ourTxs) {
              console.log("  Transaction hash:", tx.hash);
              console.log("  To:", tx.to || "CONTRACT CREATION");
              console.log("  Value:", hre.ethers.formatEther(tx.value), "EDU");
              console.log("  Gas limit:", tx.gasLimit.toString());
              console.log("  Gas price:", hre.ethers.formatUnits(tx.gasPrice, "gwei"), "gwei");
              
              // Get receipt for status
              try {
                const receipt = await hre.ethers.provider.getTransactionReceipt(tx.hash);
                if (receipt) {
                  console.log("  Status:", receipt.status === 1 ? "✅ SUCCESS" : "❌ FAILED");
                  console.log("  Gas used:", receipt.gasUsed.toString());
                  
                  if (receipt.contractAddress) {
                    console.log("  🎉 CONTRACT ADDRESS:", receipt.contractAddress);
                    
                    // Save to .env.local
                    const fs = require('fs');
                    const envPath = 'd:\\x-ceed\\.env.local';
                    let envContent = '';
                    
                    try {
                      envContent = fs.readFileSync(envPath, 'utf8');
                    } catch (e) {
                      console.log("  Creating new .env.local file...");
                    }
                    
                    // Update or add contract address
                    const contractLine = `NEXT_PUBLIC_CONTRACT_ADDRESS=${receipt.contractAddress}`;
                    if (envContent.includes('NEXT_PUBLIC_CONTRACT_ADDRESS=')) {
                      envContent = envContent.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/g, contractLine);
                    } else {
                      envContent += `\n${contractLine}\n`;
                    }
                    
                    fs.writeFileSync(envPath, envContent.trim() + '\n');
                    console.log("  💾 Contract address saved to .env.local");
                  }
                } else {
                  console.log("  ⏳ Receipt not found (transaction might be pending)");
                }
              } catch (receiptError) {
                console.log("  ❌ Error getting receipt:", receiptError.message);
              }
            }
          }
        }
      } catch (blockError) {
        // Skip blocks that can't be retrieved
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
