# Demo Currency System Specification

## Overview

During the hackathon and development phase, the platform uses a virtual currency system that simulates all betting mechanics without any real financial transactions.

## Demo Currency Features

### Virtual Currency Types

1. **LEARN Tokens (LRN)** - Primary demo currency
   - Starting balance: 1000 LRN per new user
   - Used for placing learning bets
   - Earned through successful completions
   - No real monetary value

2. **Experience Points (XP)** - Secondary reward system
   - Earned through learning activities
   - Used for unlocking features and achievements
   - Displayed on user profiles and leaderboards

3. **Achievement Badges** - Non-transferable rewards
   - Earned through specific accomplishments
   - Displayed on user profiles
   - Can be shared on social media

### Demo Wallet System

```javascript
// Demo User Wallet Structure
{
  userId: string,
  demoMode: true,
  balances: {
    learnTokens: number, // LRN balance
    experiencePoints: number, // XP balance
    totalEarned: number, // Lifetime earnings
    totalStaked: number, // Lifetime stakes
    successRate: number // Completion success percentage
  },
  achievements: [
    {
      id: string,
      name: string,
      description: string,
      earnedAt: Date,
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
    }
  ],
  transactionHistory: [
    {
      id: string,
      type: 'stake' | 'payout' | 'bonus' | 'penalty',
      amount: number,
      description: string,
      timestamp: Date,
      relatedPlanId?: string
    }
  ]
}
```

### Simulated Betting Mechanics

#### Stake Placement
- Users can stake 10-500 LRN tokens on learning plan completion
- Minimum stake: 10 LRN
- Maximum stake: 500 LRN (to prevent demo balance depletion)
- Stake amounts affect payout multipliers

#### Payout Calculations (Demo)
```javascript
// Demo Payout Formula
const basePayout = stakeAmount * 1.2; // 20% base return
const timelineMultiplier = calculateTimelineBonus(chosenWeeks, recommendedWeeks);
const difficultyMultiplier = calculateDifficultyBonus(contentComplexity);
const finalPayout = basePayout * timelineMultiplier * difficultyMultiplier;

// Example:
// Stake: 100 LRN
// Timeline: 2 weeks (recommended: 4 weeks) = 1.5x multiplier
// Difficulty: High = 1.3x multiplier
// Payout: 100 * 1.2 * 1.5 * 1.3 = 234 LRN
```

#### Demo Transaction Types

1. **Learning Bet Placement**
   - Deducts stake from user balance
   - Creates pending bet record
   - Shows in transaction history

2. **Milestone Rewards**
   - Partial payouts for reaching milestones
   - 25% of total payout per major milestone
   - Immediate credit to user balance

3. **Completion Payouts**
   - Full payout calculation on successful completion
   - Bonus XP for exceptional performance
   - Achievement badges for special accomplishments

4. **Failure Penalties**
   - Stake forfeiture on timeline failure
   - Partial refunds for partial completion
   - Learning from failure bonuses (small XP rewards)

### Demo Features

#### Virtual Leaderboards
- Top earners (by LRN balance)
- Most successful completions
- Fastest learners
- Most improved learners

#### Simulated Social Features
- Share achievements on demo social feed
- Challenge friends with virtual stakes
- Group learning competitions with shared virtual rewards
- Mentorship rewards in demo tokens

#### Mock Blockchain Interface
```javascript
// Simulated Smart Contract Interface
class MockLearningBetContract {
  async placeBet(userId, planId, stakeAmount, timeline) {
    // Simulate blockchain transaction
    const txHash = generateMockTxHash();
    await simulateBlockchainDelay(2000); // 2 second delay
    return {
      success: true,
      transactionHash: txHash,
      blockNumber: generateMockBlockNumber(),
      gasUsed: generateMockGasUsage()
    };
  }
  
  async verifyCompletion(planId, completionProof) {
    // Simulate oracle verification
    await simulateBlockchainDelay(3000);
    return {
      verified: true,
      payoutAmount: calculateDemoPayout(planId),
      transactionHash: generateMockTxHash()
    };
  }
}
```

### Demo Safety Features

#### Balance Protection
- Users cannot stake more than 80% of their balance
- Automatic balance refills if balance drops below 100 LRN
- Daily bonus tokens for active users

#### Reset Options
- Users can reset their demo wallet anytime
- Admin can reset all demo balances for testing
- Backup and restore demo progress

#### Educational Disclaimers
- Clear "DEMO MODE" indicators throughout the interface
- Educational tooltips explaining how real system would work
- Transition plan explanation for moving to real currency

### Implementation Notes

#### Database Schema
```sql
-- Demo wallet table
CREATE TABLE demo_wallets (
  user_id VARCHAR(255) PRIMARY KEY,
  learn_tokens INTEGER DEFAULT 1000,
  experience_points INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_staked INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Demo transactions table
CREATE TABLE demo_transactions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  type ENUM('stake', 'payout', 'bonus', 'penalty', 'refill'),
  amount INTEGER,
  description TEXT,
  related_plan_id VARCHAR(255),
  mock_tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### API Endpoints
- `GET /api/demo/wallet/:userId` - Get demo wallet balance
- `POST /api/demo/stake` - Place virtual learning bet
- `POST /api/demo/payout` - Process virtual payout
- `GET /api/demo/transactions/:userId` - Get transaction history
- `POST /api/demo/reset/:userId` - Reset demo wallet
- `GET /api/demo/leaderboard` - Get virtual leaderboards

This demo system allows full testing and demonstration of all gamification features while maintaining zero financial risk during development.