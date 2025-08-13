'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const LINEA_NETWORK = {
  chainId: '0xe708', // 59144 in hex
  chainName: 'Linea',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.linea.build'],
  blockExplorerUrls: ['https://lineascan.build'],
};

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LEARNING_BETS_CONTRACT;
const CONTRACT_ABI = [
  "function placeBet(uint256 aiTime, uint256 challengeTime, uint256 courseId) external payable",
  "function completeBet(uint256 betId, uint256 actualTime, uint256 qualityScore) external",
  "function bets(uint256) external view returns (tuple(address user, uint256 stakeAmount, uint256 aiEstimatedTime, uint256 userChallengeTime, uint256 multiplier, uint256 qualityThreshold, uint256 courseId, bool isActive, bool isCompleted, uint256 actualCompletionTime, uint256 qualityScore, uint256 timestamp))",
  "function userBets(address, uint256) external view returns (uint256)",
  "event BetPlaced(uint256 betId, address user, uint256 stake, uint256 multiplier)",
  "event BetCompleted(uint256 betId, address user, uint256 payout)"
];

export const useLinea = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Switch to Linea network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: LINEA_NETWORK.chainId }],
        });
      } catch (switchError) {
        // Network not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [LINEA_NETWORK],
          });
        } else {
          throw switchError;
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(accounts[0]);
      setIsConnected(true);

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const placeLearningBet = async (aiTime, challengeTime, courseId, stakeETH) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const stakeWei = ethers.parseEther(stakeETH.toString());
      const tx = await contract.placeBet(aiTime, challengeTime, courseId, {
        value: stakeWei,
      });
      
      const receipt = await tx.wait();
      
      // Extract bet ID from event logs
      const event = receipt.logs.find(log => 
        log.topics[0] === ethers.id("BetPlaced(uint256,address,uint256,uint256)")
      );
      
      if (event) {
        const betId = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], event.topics[1])[0];
        return { betId, txHash: receipt.hash };
      }
      
      return { txHash: receipt.hash };
    } catch (error) {
      console.error('Failed to place bet:', error);
      throw error;
    }
  };

  const completeLearningBet = async (betId, actualTime, qualityScore) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const tx = await contract.completeBet(betId, actualTime, qualityScore);
      const receipt = await tx.wait();
      return { txHash: receipt.hash };
    } catch (error) {
      console.error('Failed to complete bet:', error);
      throw error;
    }
  };

  const getBetDetails = async (betId) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const bet = await contract.bets(betId);
      return {
        user: bet.user,
        stakeAmount: ethers.formatEther(bet.stakeAmount),
        aiEstimatedTime: bet.aiEstimatedTime.toString(),
        userChallengeTime: bet.userChallengeTime.toString(),
        multiplier: bet.multiplier.toString(),
        courseId: bet.courseId.toString(),
        isActive: bet.isActive,
        isCompleted: bet.isCompleted,
        actualCompletionTime: bet.actualCompletionTime.toString(),
        qualityScore: bet.qualityScore.toString(),
        timestamp: bet.timestamp.toString(),
      };
    } catch (error) {
      console.error('Failed to get bet details:', error);
      throw error;
    }
  };

  // Convert INR to ETH (approximate)
  const convertINRToETH = (inrAmount) => {
    // This should use a real exchange rate API
    const ethPriceINR = 200000; // Approximate ETH price in INR
    return inrAmount / ethPriceINR;
  };

  const convertETHToINR = (ethAmount) => {
    const ethPriceINR = 200000;
    return ethAmount * ethPriceINR;
  };

  useEffect(() => {
    // Auto-connect if previously connected
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        
        if (accounts.length > 0) {
          connectWallet();
        }
      }
    };

    checkConnection();
  }, []);

  return {
    provider,
    signer,
    contract,
    account,
    isConnected,
    isLoading,
    connectWallet,
    placeLearningBet,
    completeLearningBet,
    getBetDetails,
    convertINRToETH,
    convertETHToINR,
  };
};
