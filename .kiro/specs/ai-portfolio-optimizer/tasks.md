# Implementation Plan

- [x] 1. Set up database tables and services


  - [x] 1.1 Create Supabase tables for portfolios


    - Create `user_portfolios`, `portfolio_stocks`, `user_risk_profiles` tables
    - Set up RLS policies for user data security
    - Create indexes for performance
    - _Requirements: 1.4_
  


  - [ ] 1.2 Create portfolio service functions
    - Implement `createPortfolio`, `getPortfolios`, `updatePortfolio`, `deletePortfolio`
    - Implement `addStock`, `updateStock`, `removeStock` functions
    - Implement `saveRiskProfile`, `getRiskProfile` functions
    - _Requirements: 1.4, 2.4_
  
  - [x]* 1.3 Write property test for portfolio save/load




    - **Property 2: Portfolio save/load round-trip**
    - **Validates: Requirements 1.4**

- [x] 2. Implement Portfolio Input Component

  - [ ] 2.1 Create PortfolioInput component
    - Build form with stock symbol autocomplete
    - Add quantity and average price inputs
    - Implement stock validation against VN100 list
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ] 2.2 Implement portfolio calculations
    - Calculate total value, weights, PnL for each stock
    - Calculate portfolio totals
    - Fetch current prices from Supabase
    - _Requirements: 1.3_


  

  - [ ]* 2.3 Write property test for portfolio calculations
    - **Property 1: Portfolio value calculation consistency**
    - **Validates: Requirements 1.3**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Risk Profile Assessment
  - [ ] 4.1 Create RiskProfileQuiz component
    - Build questionnaire UI with 5-7 questions
    - Implement answer selection and scoring
    - Calculate and classify risk profile
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 4.2 Write property test for risk classification
    - **Property 3: Risk profile classification determinism**
    - **Validates: Requirements 2.2**

- [x] 5. Implement Portfolio Health Analysis
  - [x] 5.1 Create PortfolioHealthScore calculator
    - Calculate diversification score
    - Calculate risk score based on SENAI scores
    - Calculate momentum, quality, valuation scores
    - Compute overall health score (0-100)
    - _Requirements: 3.1_
  
  - [x] 5.2 Create PortfolioAnalysis component
    - Build radar chart for 5 criteria visualization
    - Implement strengths/weaknesses identification
    - Generate warnings for high-risk stocks
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ]* 5.3 Write property tests for health analysis
    - **Property 4: Health score bounds**
    - **Property 5: Strengths and weaknesses count**
    - **Property 6: Low SENAI Score warning generation**
    - **Validates: Requirements 3.1, 3.3, 3.4**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Correlation and Diversification Analysis
  - [ ] 7.1 Create correlation matrix calculator
    - Fetch historical price data for portfolio stocks
    - Calculate pairwise correlations
    - Identify high correlation pairs (> 0.7)
    - _Requirements: 5.1, 5.2_
  
  - [ ] 7.2 Create sector allocation analyzer
    - Calculate sector weights from portfolio
    - Generate sector concentration warnings
    - Build pie chart visualization
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 7.3 Write property tests for correlation analysis
    - **Property 9: Correlation matrix symmetry**
    - **Property 10: High correlation warning**
    - **Property 11: Sector concentration warning**
    - **Validates: Requirements 5.1, 5.2, 5.4**

- [x] 8. Implement AI Optimization Engine
  - [x] 8.1 Create optimization algorithm
    - Implement portfolio optimization based on risk profile
    - Generate buy/sell/hold recommendations
    - Calculate expected improvements
    - _Requirements: 4.1, 4.3_
  
  - [x] 8.2 Create OptimizationResult component
    - Display before/after comparison
    - Show action list with reasoning
    - Highlight improvements in metrics
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [ ]* 8.3 Write property tests for optimization
    - **Property 7: Optimization produces valid portfolio**
    - **Property 8: Optimization actions are actionable**
    - **Validates: Requirements 4.1, 4.3**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Rebalancing Suggestions
  - [x] 10.1 Create rebalancing calculator
    - Calculate drift from target weights
    - Generate buy/sell quantities
    - Estimate transaction costs
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 10.2 Create RebalanceSuggestions component
    - Display rebalancing recommendations
    - Show cost estimates
    - Allow threshold configuration
    - _Requirements: 6.4_
  
  - [ ]* 10.3 Write property tests for rebalancing
    - **Property 12: Rebalancing threshold respect**
    - **Property 13: Rebalancing quantity validity**
    - **Validates: Requirements 6.1, 6.2, 6.4**

- [ ] 11. Implement Dashboard and Reporting
  - [ ] 11.1 Create PortfolioOptimizerDashboard component
    - Integrate all analysis components
    - Build summary metrics display
    - Add navigation between sections
    - _Requirements: 7.1, 7.3_
  
  - [ ] 11.2 Implement PDF export
    - Generate comprehensive report
    - Include all charts and metrics
    - Format for printing
    - _Requirements: 7.2, 7.4_

- [ ] 12. Integration and Polish
  - [ ] 12.1 Integrate with main app
    - Add Portfolio Optimizer to sidebar navigation
    - Connect with existing auth system
    - Ensure responsive design
  
  - [ ] 12.2 Add loading states and error handling
    - Implement skeleton loaders
    - Add error boundaries
    - Show helpful error messages

- [ ] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
