# Feature Requests & Roadmap

This document tracks feature requests and planned improvements for the Interactive Investor Dashboard, based on user feedback and community discussions.

## 🎯 High Priority Features

### 1. Transaction History with Cash Flow Analysis
**Description**: Comprehensive transaction tracking to accurately reflect real portfolio performance.

**Features**:
- Show every movement of funds into ISA
- Distinguish between money inflow (deposits) vs investment gains/losses
- Track deposits and trades over time
- Visualize cash contributions vs market performance

**Challenges**:
- ii only provides data from 2020 onwards
- Limited to 2-year exports at a time
- Historical ISAs transferred from previous company (pre-ii acquisition)

**Status**: 🔍 Investigating - Awaiting response from ii about full history export options

---

### 2. Portfolio Value in Charts
**Description**: Show actual portfolio value, not just price movements.

**Features**:
- Display value of holdings in portfolio
- Show weighted performance based on position sizes
- Chart total portfolio value over time

**Status**: 📋 Planned

---

### 3. Exposure/Balance Across Funds
**Description**: Visualize how your portfolio is distributed across different funds.

**Features**:
- Pie chart or treemap showing fund allocation
- Percentage breakdown by fund
- Identify concentration risk

**Status**: 📋 Planned

---

### 4. Top Holdings Aggregation
**Description**: See through all funds to identify your actual top investments across entire portfolio.

**Features**:
- Aggregate duplicate holdings across multiple funds
- Display top 20 individual investments (e.g., stocks, bonds)
- Show what percentage each individual holding represents
- Example: "How much Nvidia makes up of my total portfolio across all funds?"

**Use Case**: Many funds hold the same underlying stocks. This feature helps you understand your true exposure to individual companies.

**Status**: 📋 Planned

---

## 🚀 Medium Priority Features

### 5. Gains Filter
**Description**: Filter and sort investments by performance.

**Features**:
- Filter graphs to only show funds above/below X% gain
- Sort by best/worst performers
- Time-period specific performance filters

**Status**: 📋 Planned

---

### 6. Industry/Sector Breakdown
**Description**: Categorize portfolio by industry and sector.

**Categories**:
- Banks & Financial Services
- Commodities
- Electric Cars / EVs
- Small Tech Companies
- Large Tech Companies
- Agriculture
- Healthcare
- Energy
- Real Estate
- And more...

**Features**:
- Sector allocation visualization
- Industry exposure percentages
- Compare your allocation to market benchmarks

**Status**: 💭 Under Consideration

---

## 🔮 Advanced/Future Features

### 7. Thematic Portfolio Analysis
**Description**: Analyze portfolio based on investment themes and values.

**Themes**:

#### Environmental Impact
- **Green/Sustainability Score**: How much supports green/sustainable initiatives?
- **Carbon Impact**: Net carbon negative/positive calculation
- Example: 10% Monsanto vs 3% Lime bikes = net negative

#### Ethical Screening
- Support for/against specific countries or causes
- Weapons manufacturers exposure
- Labor practices and human rights
- Other ethical considerations

#### Risk Exposure Analysis
- Sector-specific risks (e.g., "How exposed am I to an AI crash?")
- Geographic risk concentration
- Currency exposure

**Challenges**:
- Requires expensive third-party ESG/screening databases (e.g., Shariah databases)
- Data quality and consistency issues
- No standardized reporting from companies
- Maintaining up-to-date information
- Building high-fidelity ontology for categorization

**Status**: 💭 Research Phase - Exploring data sources and feasibility

---

### 8. AI Portfolio Chatbot
**Description**: Natural language interface to query your portfolio.

**Example Queries**:
- "How is my portfolio doing without my XYZ stock?"
- "What's my exposure to the tech sector?"
- "Show me all my holdings related to renewable energy"
- "How would my returns look if I had sold fund X last month?"

**Requirements**:
- High-fidelity ontology for all funds and their breakdowns
- Structured reference data for categories (green, ethical screens, etc.)
- Strict definitions database for consistency across queries
- Integration with existing portfolio data

**Challenges**:
- LLM reliability concerns without quality structured data
- Conditional question handling (as noted in Nate Silver's poker simulation research)
- Data availability and quality
- Ensuring consistent categorization across users
- Cost of API calls for complex analysis

**Notes**:
- Good for mathematical queries and data retrieval
- Struggles with investment appraisal and complex conditional scenarios
- Needs structured data backbone, not just LLM

**Status**: 💭 Under Consideration - Requires thematic analysis (Feature #7) foundation

---

### 9. Advanced Analytics
**Description**: Additional analytical features suggested by the community.

**Ideas**:
- AbuBot: AI assistant trained on investment principles
- Benchmark comparison (vs S&P 500, FTSE 100, etc.)
- Risk metrics (Sharpe ratio, volatility, etc.)
- Dividend tracking and forecasting
- Tax optimization suggestions (for ISAs, SIPPs, etc.)

**Status**: 💡 Ideas - Community input welcome

---

## 📊 Known Data Challenges

### Data Availability
1. **Historical Data Limitations**:
   - ISAs transferred from previous company to ii
   - Data gaps pre-2020
   - ii's total gain/loss metric suggests they have older data internally

2. **Export Restrictions**:
   - Can only download 2 years at a time
   - No bulk export functionality

### Data Quality
3. **Third-party Data Costs**:
   - ESG/Shariah screening databases are expensive
   - Even paid databases have data quality issues

4. **Data Consistency**:
   - No consistency in company reporting or accuracy
   - Different funds report holdings differently
   - Underlying securities data can be stale or incomplete

---

## 🎨 Technical Implementation Notes

### Current Tech Stack
- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: SQLite with Prisma ORM

### Data Sources
- Interactive Investor CSV exports
- Fund factsheet data
- Price data (needs enhancement)

---

## 🤝 Contributing

This is an open-source project! If you'd like to work on any of these features:

1. Check the [Issues](../../issues) page to see if someone is already working on it
2. Comment on the issue or create a new one to discuss your approach
3. Fork the repo and create a feature branch
4. Submit a PR with your implementation

For major features (especially #7 and #8), please open an issue first to discuss architecture and data sources.

---

## 📮 Submitting Feature Requests

Have an idea not listed here?

1. Check existing [Issues](../../issues) to avoid duplicates
2. Create a new issue with the `enhancement` label
3. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Any alternative approaches you've considered
   - Why this would be valuable to users

---

## Status Legend

- 🔍 **Investigating**: Researching feasibility and data sources
- 📋 **Planned**: Confirmed for implementation, awaiting development
- 🚧 **In Progress**: Currently being developed
- ✅ **Completed**: Feature is live
- 💭 **Under Consideration**: Good idea, needs more discussion/research
- 💡 **Ideas**: Community suggestions, not yet evaluated
- ❌ **Not Planned**: Decided against implementation (with reasoning)

---

*Last Updated: February 2026*
*Based on community feedback and discussions*
