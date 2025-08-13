'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { EDUCHAIN_TESTNET_CONFIG } from '@/config/blockchain';

// Create wagmi config for EduChain
const config = getDefaultConfig({
  appName: 'X-CEED Learning Bets',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [EDUCHAIN_TESTNET_CONFIG],
  ssr: true,
});

// Create a client
const queryClient = new QueryClient();

function RainbowKitWrapper({ children }) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    );
  }
  
  // Determine the current theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  
  // Custom theme configuration to match your website's claymorphism theme
  const customLightTheme = lightTheme({
    accentColor: 'oklch(0.5854 0.2041 277.1173)', // Your primary color
    accentColorForeground: 'oklch(1.0000 0 0)', // White
    borderRadius: 'large', // Match your border radius
    fontStack: 'system',
    overlayBlur: 'small',
  });

  const customDarkTheme = darkTheme({
    accentColor: 'oklch(0.6801 0.1583 276.9349)', // Your dark mode primary
    accentColorForeground: 'oklch(0.2244 0.0074 67.4370)', // Your dark background
    borderRadius: 'large', // Match your border radius
    fontStack: 'system',
    overlayBlur: 'small',
  });

  return (
    <RainbowKitProvider 
      theme={currentTheme === 'dark' ? customDarkTheme : customLightTheme}
      showRecentTransactions={true}
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitWrapper>
          {children}
        </RainbowKitWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
