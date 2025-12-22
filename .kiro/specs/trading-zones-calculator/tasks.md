# Implementation Plan

- [x] 1. Create Trading Zones Calculator Service

  - [x] 1.1 Create `services/tradingZonesService.ts` with core calculation functions

    - Implement findSwingHighs/findSwingLows functions
    - Implement clusterLevels function for S/R detection
    - Implement calculateBuyZone function
    - Implement calculateStopLoss function
    - Implement calculateTargets function
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2_
  

  - [x] 1.2 Implement Pivot Points calculation

    - Calculate daily pivot points (P, R1, R2, R3, S1, S2, S3)
    - Calculate weekly pivot points
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  

  - [ ] 1.3 Implement Fibonacci calculation
    - Calculate retracement levels (23.6%, 38.2%, 50%, 61.8%, 78.6%)
    - Calculate extension levels (127.2%, 161.8%, 200%)


    - Detect Golden Zone (Fib 61.8% + Support confluence)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Implement Confluence Detection

  - [x] 2.1 Create confluence zone finder

    - Aggregate all support/resistance levels
    - Find overlapping zones within threshold
    - Rank zones by strength (number of confluent levels)
    - _Requirements: 1.4, 5.5_



- [x] 3. Implement Risk/Reward Analysis


  - [x] 3.1 Create risk analysis functions

    - Calculate R:R ratio for each target
    - Calculate win rate needed for profitability

    - Suggest position size based on 2% rule
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [x] 4. Implement Strategy Classification


  - [ ] 4.1 Create strategy classifier
    - Classify as Scalping/Swing/Position based on targets
    - Detect trend following vs range trading

    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5. Create Database Sync Script

  - [x] 5.1 Create `supabase/sync-trading-strategy.js`

    - Fetch price data for all VN100 stocks
    - Calculate trading zones for each stock
    - Upsert to trading_strategy table

    - _Requirements: All_


- [x] 6. Update UI Components

  - [x] 6.1 Update StockAnalysis.tsx to display trading zones

    - Show Buy Zone with strength indicator
    - Show Stop Loss with percentage
    - Show Targets with R:R ratios
    - Show Strategy Type badge
    - _Requirements: All_

- [x] 7. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.
