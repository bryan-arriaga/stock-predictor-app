# Stock Market Predictor

A full-stack application that predicts daily stock market movements using machine learning.

## Features

- Daily predictions for major tech stocks (AAPL, MSFT, NVDA, GOOGL, AMZN)
- Machine learning model using RandomForestClassifier
- Clean, modern UI with real-time updates
- Historical performance tracking
- Automated daily model retraining
- **NEW**: Real-time stock data from Finnhub API
- **NEW**: Interactive charts with intraday data
- **NEW**: Daily summary statistics (Open, High, Low, Close)
- **NEW**: Live indicators and modern UI components
- **NEW**: Tabbed interface for charts and statistics

## Tech Stack

- Frontend: React + TypeScript + Tailwind CSS + Radix UI
- Backend: Python + Flask
- ML: scikit-learn
- Data: Finnhub API (real-time stock data)
- Charts: Recharts
- Icons: Lucide React

## Setup

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask server:
   ```bash
   python app.py
   ```

### Finnhub API Setup

The application uses Finnhub API for real-time stock data. To set up:

1. Get a free API key from [Finnhub](https://finnhub.io/)
2. Create a `.env` file in the root directory with your API key:
   ```
   # Finnhub API Configuration
   # Get your free API key from: https://finnhub.io/
   FINNHUB_API_KEY=your_actual_api_key_here
   ```

3. Restart the Flask server after creating the .env file.

**Security Note**: The .env file is automatically ignored by git to keep your API key secure.

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

The application will automatically:
- Fetch daily stock data at 8:00 AM
- Retrain the model with the latest data
- Update predictions for each stock
- Display results in the UI

The frontend will automatically refresh every 5 minutes to show the latest predictions.

## API Endpoints

- GET `/api/predict`: Get current predictions for all stocks
- GET `/api/stats`: Get model performance statistics
- GET `/api/stock-data/<symbol>`: Get intraday stock data from Finnhub
- GET `/api/summary/<symbol>`: Get daily summary (open, close, high, low, % change)

## Contributing

Feel free to submit issues and enhancement requests! 