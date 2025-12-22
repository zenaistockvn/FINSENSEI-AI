# Requirements Document

## Introduction

Hệ thống tính toán các vùng giao dịch (Trading Zones) tự động dựa trên phân tích kỹ thuật, bao gồm: Vùng mua (Buy Zone), Điểm cắt lỗ (Stop Loss), và các Mục tiêu giá (Price Targets). Công thức được xây dựng dựa trên các phương pháp phân tích kỹ thuật chuẩn như Support/Resistance, ATR, Fibonacci, và Pivot Points.

## Glossary

- **Buy Zone**: Vùng giá khuyến nghị mua vào, thường là vùng hỗ trợ mạnh
- **Stop Loss**: Điểm cắt lỗ để bảo vệ vốn khi giá đi ngược dự đoán
- **Target (TP)**: Mục tiêu chốt lời, có thể có nhiều mức (TP1, TP2, TP3)
- **Support**: Vùng hỗ trợ - mức giá mà lực mua thường xuất hiện
- **Resistance**: Vùng kháng cự - mức giá mà lực bán thường xuất hiện
- **ATR**: Average True Range - đo lường biến động giá
- **Fibonacci Retracement**: Các mức thoái lui dựa trên tỷ lệ Fibonacci
- **Pivot Points**: Các điểm xoay chiều dựa trên giá High/Low/Close
- **Risk/Reward Ratio**: Tỷ lệ rủi ro/lợi nhuận

## Requirements

### Requirement 1: Tính toán vùng hỗ trợ/kháng cự

**User Story:** As a trader, I want the system to automatically calculate support and resistance levels, so that I can identify key price zones for trading decisions.

#### Acceptance Criteria

1. WHEN price data is provided THEN the system SHALL calculate support levels using swing lows from the last 60 trading days
2. WHEN price data is provided THEN the system SHALL calculate resistance levels using swing highs from the last 60 trading days
3. WHEN calculating support/resistance THEN the system SHALL identify at least 2 levels for each (S1, S2 and R1, R2)
4. WHEN multiple swing points cluster within 2% of each other THEN the system SHALL merge them into a single stronger level

### Requirement 2: Tính toán Buy Zone

**User Story:** As a trader, I want the system to recommend optimal buy zones, so that I can enter positions at favorable prices.

#### Acceptance Criteria

1. WHEN calculating buy zone THEN the system SHALL use the formula: Buy Zone Low = Support 1 level
2. WHEN calculating buy zone THEN the system SHALL use the formula: Buy Zone High = Support 1 + (ATR × 0.5)
3. WHEN current price is below MA20 THEN the system SHALL adjust buy zone lower by ATR × 0.3
4. WHEN RSI is below 30 (oversold) THEN the system SHALL flag the buy zone as "Strong Buy Zone"
5. WHEN price is in uptrend (above MA50) THEN the system SHALL use pullback to MA20 as alternative buy zone

### Requirement 3: Tính toán Stop Loss

**User Story:** As a trader, I want the system to calculate appropriate stop loss levels, so that I can manage risk effectively.

#### Acceptance Criteria

1. WHEN calculating stop loss THEN the system SHALL use the formula: Stop Loss = Buy Zone Low - (ATR × 1.5)
2. WHEN volatility is high (ATR > 3% of price) THEN the system SHALL widen stop loss to ATR × 2.0
3. WHEN there is a strong support below buy zone THEN the system SHALL place stop loss just below that support (Support 2 - ATR × 0.5)
4. WHEN calculating stop loss THEN the system SHALL ensure maximum loss does not exceed 7% from buy zone midpoint
5. WHEN stop loss is calculated THEN the system SHALL display the percentage risk from current price

### Requirement 4: Tính toán Price Targets

**User Story:** As a trader, I want the system to calculate multiple price targets, so that I can plan my profit-taking strategy.

#### Acceptance Criteria

1. WHEN calculating Target 1 THEN the system SHALL use the formula: TP1 = Entry + (Entry - Stop Loss) × 1.5 (Risk/Reward 1:1.5)
2. WHEN calculating Target 2 THEN the system SHALL use the formula: TP2 = Entry + (Entry - Stop Loss) × 2.5 (Risk/Reward 1:2.5)
3. WHEN calculating Target 3 THEN the system SHALL use the formula: TP3 = Resistance 1 level or 52-week high (whichever is closer)
4. WHEN a resistance level exists between entry and calculated target THEN the system SHALL adjust target to that resistance level
5. WHEN calculating targets THEN the system SHALL display expected profit percentage for each target

### Requirement 5: Tính toán Pivot Points

**User Story:** As a trader, I want the system to calculate daily/weekly pivot points, so that I have additional reference levels for trading.

#### Acceptance Criteria

1. WHEN calculating pivot THEN the system SHALL use the formula: Pivot = (High + Low + Close) / 3
2. WHEN calculating support pivots THEN the system SHALL calculate S1 = (2 × Pivot) - High, S2 = Pivot - (High - Low)
3. WHEN calculating resistance pivots THEN the system SHALL calculate R1 = (2 × Pivot) - Low, R2 = Pivot + (High - Low)
4. WHEN weekly data is available THEN the system SHALL also calculate weekly pivot points
5. WHEN pivot levels coincide with support/resistance within 1% THEN the system SHALL mark them as "Confluence Zone"

### Requirement 6: Fibonacci Retracement Levels

**User Story:** As a trader, I want the system to calculate Fibonacci retracement levels, so that I can identify potential reversal zones.

#### Acceptance Criteria

1. WHEN price is in uptrend THEN the system SHALL calculate Fibonacci retracement from recent swing low to swing high
2. WHEN price is in downtrend THEN the system SHALL calculate Fibonacci retracement from recent swing high to swing low
3. WHEN calculating Fibonacci THEN the system SHALL provide levels at 23.6%, 38.2%, 50%, 61.8%, and 78.6%
4. WHEN Fibonacci 61.8% level coincides with support THEN the system SHALL mark it as "Golden Zone"
5. WHEN calculating Fibonacci extension THEN the system SHALL provide targets at 127.2%, 161.8%, and 200%

### Requirement 7: Risk/Reward Analysis

**User Story:** As a trader, I want the system to analyze risk/reward ratio, so that I can make informed trading decisions.

#### Acceptance Criteria

1. WHEN displaying trading strategy THEN the system SHALL calculate and show Risk/Reward ratio for each target
2. WHEN Risk/Reward ratio is below 1:1.5 THEN the system SHALL flag the trade as "Low Reward"
3. WHEN Risk/Reward ratio is above 1:3 THEN the system SHALL flag the trade as "High Reward"
4. WHEN calculating position size THEN the system SHALL suggest lot size based on 2% account risk rule
5. WHEN displaying strategy THEN the system SHALL show win rate needed to be profitable at given R:R ratio

### Requirement 8: Strategy Type Classification

**User Story:** As a trader, I want the system to classify the trading strategy type, so that I know the appropriate holding period.

#### Acceptance Criteria

1. WHEN ATR is less than 2% and targets are within 10% THEN the system SHALL classify as "Scalping"
2. WHEN targets are between 5-15% and holding period is 1-5 days THEN the system SHALL classify as "Swing Trading"
3. WHEN targets are above 15% and based on weekly charts THEN the system SHALL classify as "Position Trading"
4. WHEN trend is strong (ADX > 25) THEN the system SHALL recommend "Trend Following" strategy
5. WHEN price is range-bound (ADX < 20) THEN the system SHALL recommend "Range Trading" strategy
