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
  
  // Custom theme configuration to match your website
  const customLightTheme = lightTheme({
    accentColor: '#3b82f6', // Blue accent to match your site
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
  });

  const customDarkTheme = darkTheme({
    accentColor: '#3b82f6', // Blue accent to match your site
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
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
