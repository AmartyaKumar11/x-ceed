// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract XCeedLearningBets {
    struct LearningBet {
        address user;
        uint256 stakeAmount;
        uint256 aiEstimatedTime; // in seconds
        uint256 userChallengeTime; // in seconds
        uint256 multiplier; // multiplied by 100 (e.g., 150 = 1.5x)
        uint256 qualityThreshold; // minimum quality score (out of 100)
        string courseId;
        bool isActive;
        bool isCompleted;
        uint256 actualCompletionTime;
        uint256 qualityScore;
        uint256 timestamp;
    }
    
    mapping(uint256 => LearningBet) public bets;
    mapping(address => uint256[]) public userBets;
    uint256 public nextBetId = 1;
    
    // Platform settings
    uint256 public constant PLATFORM_FEE = 5; // 5% platform fee
    uint256 public constant MIN_QUALITY_SCORE = 60;
    address public owner;
    
    event BetPlaced(uint256 indexed betId, address indexed user, uint256 stake, uint256 multiplier);
    event BetCompleted(uint256 indexed betId, address indexed user, uint256 payout);
    event BetFailed(uint256 indexed betId, address indexed user, string reason);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyBetOwner(uint256 betId) {
        require(bets[betId].user == msg.sender, "Not your bet");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function placeBet(
        uint256 aiTime,
        uint256 challengeTime,
        string memory courseId
    ) external payable {
        require(msg.value > 0, "Stake must be greater than 0");
        require(challengeTime < aiTime, "Challenge time must be faster than AI estimate");
        require(challengeTime > 0, "Challenge time must be positive");
        require(bytes(courseId).length > 0, "Course ID cannot be empty");
        
        uint256 multiplier = calculateMultiplier(aiTime, challengeTime);
        
        // Store the bet
        bets[nextBetId] = LearningBet({
            user: msg.sender,
            stakeAmount: msg.value,
            aiEstimatedTime: aiTime,
            userChallengeTime: challengeTime,
            multiplier: multiplier,
            qualityThreshold: MIN_QUALITY_SCORE,
            courseId: courseId,
            isActive: true,
            isCompleted: false,
            actualCompletionTime: 0,
            qualityScore: 0,
            timestamp: block.timestamp
        });
        
        userBets[msg.sender].push(nextBetId);
        
        emit BetPlaced(nextBetId, msg.sender, msg.value, multiplier);
        nextBetId++;
    }
    
    function completeBet(
        uint256 betId,
        uint256 actualTime,
        uint256 qualityScore
    ) external onlyBetOwner(betId) {
        LearningBet storage bet = bets[betId];
        require(bet.isActive, "Bet is not active");
        require(!bet.isCompleted, "Bet already completed");
        require(actualTime > 0, "Actual time must be positive");
        require(qualityScore <= 100, "Quality score cannot exceed 100");
        
        bet.actualCompletionTime = actualTime;
        bet.qualityScore = qualityScore;
        bet.isCompleted = true;
        bet.isActive = false;
        
        uint256 payout = calculatePayout(betId);
        
        if (payout > 0) {
            // Transfer payout to user
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Payout transfer failed");
            
            emit BetCompleted(betId, msg.sender, payout);
        } else {
            emit BetFailed(betId, msg.sender, "Conditions not met");
        }
    }
    
    function calculateMultiplier(uint256 aiTime, uint256 challengeTime) internal pure returns (uint256) {
        require(challengeTime < aiTime, "Challenge must be faster");
        
        uint256 timeReduction = ((aiTime - challengeTime) * 100) / aiTime; // Percentage reduction
        uint256 baseMultiplier = 100; // 1.0x in basis points
        
        // More aggressive time reduction = higher multiplier
        if (timeReduction >= 50) {
            return 300; // 3.0x max
        } else if (timeReduction >= 30) {
            return 200 + (timeReduction - 30) * 5; // 2.0x to 3.0x
        } else if (timeReduction >= 15) {
            return 150 + (timeReduction - 15) * 3; // 1.5x to 2.0x
        } else {
            return 105 + timeReduction * 3; // 1.05x to 1.5x
        }
    }
    
    function calculatePayout(uint256 betId) internal view returns (uint256) {
        LearningBet storage bet = bets[betId];
        
        // Check if user met the challenge conditions
        bool metTimeChallenge = bet.actualCompletionTime <= bet.userChallengeTime;
        bool metQualityRequirement = bet.qualityScore >= bet.qualityThreshold;
        
        if (!metTimeChallenge || !metQualityRequirement) {
            // Failed to meet conditions - lose stake
            return 0;
        }
        
        // Calculate base payout
        uint256 basePayout = (bet.stakeAmount * bet.multiplier) / 100;
        
        // Quality bonus: extra 10% if quality score >= 80
        if (bet.qualityScore >= 80) {
            basePayout = (basePayout * 110) / 100;
        }
        
        // Platform fee
        uint256 platformFee = (basePayout * PLATFORM_FEE) / 100;
        uint256 finalPayout = basePayout - platformFee;
        
        // Ensure contract has enough balance
        return finalPayout > address(this).balance ? address(this).balance : finalPayout;
    }
    
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }
    
    function getBetDetails(uint256 betId) external view returns (LearningBet memory) {
        return bets[betId];
    }
    
    function getActiveBets(address user) external view returns (uint256[] memory) {
        uint256[] memory allBets = userBets[user];
        uint256 activeCount = 0;
        
        // Count active bets
        for (uint256 i = 0; i < allBets.length; i++) {
            if (bets[allBets[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active bet IDs
        uint256[] memory activeBets = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allBets.length; i++) {
            if (bets[allBets[i]].isActive) {
                activeBets[index] = allBets[i];
                index++;
            }
        }
        
        return activeBets;
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 10, "Fee cannot exceed 10%");
        // Platform fee is now a constant, but this could be made variable
    }
    
    // Get contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}
