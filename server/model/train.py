import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from datetime import datetime, timedelta
import json
import os
import time

# Constants
STOCKS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN']
FEATURES = ['Open', 'High', 'Low', 'Close', 'Volume']
# Use /tmp directory for Vercel serverless functions
CACHE_FILE = '/tmp/cache.json' if os.environ.get('VERCEL') else 'cache.json'

def get_stock_data(symbol, days=365):
    try:
        # Create a Ticker object
        ticker = yf.Ticker(symbol)
        
        # Get the end date (today) and start date
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Try to get historical data
        df = ticker.history(start=start_date, end=end_date, interval='1d')
        
        if df.empty:
            raise Exception(f"No data downloaded for {symbol}")
            
        # Verify we have the required columns
        required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise Exception(f"Missing required columns for {symbol}: {missing_columns}")
            
        print(f"Successfully downloaded {len(df)} days of data for {symbol}")
        return df
        
    except Exception as e:
        print(f"Error downloading data for {symbol}: {str(e)}")
        raise

def prepare_features(df):
    # Calculate technical indicators
    df['SMA_5'] = df['Close'].rolling(window=5).mean()
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['RSI'] = calculate_rsi(df['Close'])
    
    # Create target variable (1 if tomorrow's price is higher, 0 if lower)
    df['Target'] = (df['Close'].shift(-1) > df['Close']).astype(int)
    
    # Drop NaN values
    df = df.dropna()
    
    return df

def calculate_rsi(prices, period=14):
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def train_model(symbol):
    # Get historical data
    df = get_stock_data(symbol)
    df = prepare_features(df)
    
    # Prepare features and target
    features = ['Open', 'High', 'Low', 'Close', 'Volume', 'SMA_5', 'SMA_20', 'RSI']
    X = df[features]
    y = df['Target']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Get accuracy
    accuracy = model.score(X_test, y_test)
    
    # Make prediction for tomorrow
    last_data = X.iloc[-1:]
    prediction = model.predict(last_data)[0]
    confidence = model.predict_proba(last_data)[0][prediction]
    
    return prediction, confidence, accuracy

def update_predictions():
    predictions = {}
    total_accuracy = 0
    successful_predictions = 0
    
    # Calculate next trading day
    now = datetime.now()
    next_day = now + timedelta(days=1)
    # If next day is weekend, move to Monday
    while next_day.weekday() >= 5:  # 5 is Saturday, 6 is Sunday
        next_day = next_day + timedelta(days=1)
    
    for symbol in STOCKS:
        try:
            # Add delay between API calls
            if successful_predictions > 0:  # Don't delay on first request
                time.sleep(2)  # Wait 2 seconds between requests
                
            prediction, confidence, accuracy = train_model(symbol)
            predictions[symbol] = {
                'prediction': 'UP' if prediction == 1 else 'DOWN',
                'confidence': float(confidence),
                'accuracy': float(accuracy)
            }
            total_accuracy += accuracy
            successful_predictions += 1
            print(f"Successfully added prediction for {symbol}")
        except Exception as e:
            print(f"Error processing {symbol}: {str(e)}")
            predictions[symbol] = {
                'prediction': 'ERROR',
                'confidence': 0.0,
                'accuracy': 0.0
            }
    
    # Update cache
    cache_data = {
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'prediction_date': next_day.strftime('%Y-%m-%d'),
        'predictions': predictions,
        'performance': {
            'accuracy': float(total_accuracy / max(successful_predictions, 1)),
            'total_predictions': successful_predictions
        }
    }
    
    try:
        print(f"Saving predictions to {CACHE_FILE}")
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache_data, f)
        print("Successfully saved predictions")
    except Exception as e:
        print(f"Error saving cache file: {str(e)}")
    
    return cache_data 