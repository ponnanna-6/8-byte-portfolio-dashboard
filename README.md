# 8-Byte Portfolio Dashboard

A real-time portfolio dashboard for tracking Indian stock market investments with live prices, fundamentals, and sector-wise analysis.

**Live Demo:** [https://8-byte-portfolio-dashboard.vercel.app/](https://8-byte-portfolio-dashboard.vercel.app/)

## About

This is a Next.js-based portfolio dashboard that provides:

- **Real-time Stock Prices**: Live prices from BSE India API
- **Fundamental Analysis**: PE ratio, Price-to-Book, EPS, ROE, and more
- **Sector-wise Grouping**: View holdings organized by sectors
- **Performance Tracking**: Gain/loss calculations with percentage changes
- **Optimized API Calls**: Intelligent caching to minimize API requests
- **Auto-refresh**: Updates every 30 seconds with latest market data

The dashboard automatically resolves NSE symbols to BSE scripcodes and caches data for optimal performance.

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 8-byte-portfolio-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Used

### BSE India APIs

The dashboard uses the following BSE India APIs:

#### 1. Stock Price Data
- **Endpoint**: `https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w`
- **Purpose**: Fetch real-time stock prices, OHLC data, and market information
- **Parameters**: `scripcode` (BSE scripcode), `seriesid` (optional)

#### 2. Fundamentals Data
- **Endpoint**: `https://api.bseindia.com/BseIndiaAPI/api/ComHeadernew/w`
- **Purpose**: Fetch fundamental metrics (PE, PB, ROE, EPS, etc.)
- **Parameters**: `quotetype=EQ`, `scripcode`, `seriesid` (optional)
- **Cache Duration**: 24 hours

#### 3. Symbol Search
- **Endpoint**: `https://api.bseindia.com/Msource/1D/getQouteSearch.aspx`
- **Purpose**: Search and resolve NSE symbols to BSE scripcodes
- **Parameters**: `Type=EQ`, `text` (symbol name), `flag=site`
- **Cache Duration**: Permanent (one-time fetch per symbol)

## Technology Stack

- **Framework**: Next.js 16.0.8
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS
- **Deployment**: Vercel