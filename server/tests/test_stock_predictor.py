import unittest
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import pytz
from model.train import (
    get_stock_data,
    prepare_features,
    calculate_rsi,
    train_model,
    update_predictions
)

class TestStockPredictor(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.test_symbol = 'AAPL'
        self.required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
    
    def test_get_stock_data(self):
        """Test if we can fetch stock data successfully."""
        df = get_stock_data(self.test_symbol)
        
        # Check if we got a DataFrame
        self.assertIsInstance(df, pd.DataFrame)
        
        # Check if all required columns are present
        for col in self.required_columns:
            self.assertIn(col, df.columns)
            
        # Check if we have reasonable amount of data
        self.assertGreater(len(df), 100)
        
        # Check if dates are within expected range (using timezone-aware datetimes)
        end_date = datetime.now(pytz.UTC)
        start_date = end_date - timedelta(days=365)
        
        # Convert index to UTC for comparison
        df_index_utc = df.index.tz_localize('UTC') if df.index.tz is None else df.index.tz_convert('UTC')
        
        self.assertGreaterEqual(df_index_utc.max(), start_date)
        self.assertLessEqual(df_index_utc.min(), end_date)

    def test_prepare_features(self):
        """Test feature preparation."""
        # Get sample data
        df = get_stock_data(self.test_symbol)
        df_features = prepare_features(df)
        
        # Check if all expected features are present
        expected_features = ['Open', 'High', 'Low', 'Close', 'Volume', 
                           'SMA_5', 'SMA_20', 'RSI', 'Target']
        for feature in expected_features:
            self.assertIn(feature, df_features.columns)
        
        # Check if Target is binary (0 or 1)
        self.assertTrue(set(df_features['Target'].unique()).issubset({0, 1}))
        
        # Check if technical indicators are calculated correctly
        self.assertTrue(df_features['SMA_5'].notna().any())
        self.assertTrue(df_features['SMA_20'].notna().any())
        self.assertTrue(df_features['RSI'].notna().any())

    def test_calculate_rsi(self):
        """Test RSI calculation."""
        # Create sample price data with known behavior
        prices = pd.Series([
            10, 11, 12, 11, 10,  # Downtrend
            11, 12, 13, 14, 15,  # Uptrend
            14, 13, 12, 13, 14   # Mixed
        ])
        
        rsi = calculate_rsi(prices, period=5)  # Use smaller period for test
        
        # Drop NaN values that occur at the start due to the rolling window
        rsi = rsi.dropna()
        
        # Check if RSI is within valid range (0-100)
        self.assertTrue((rsi >= 0).all(), "RSI values should be >= 0")
        self.assertTrue((rsi <= 100).all(), "RSI values should be <= 100")
        
        # Verify RSI behavior
        # During uptrend (higher values), RSI should be higher
        uptrend_rsi = rsi[5:10].mean()  # RSI during uptrend period
        self.assertGreater(uptrend_rsi, 50, "RSI should be higher during uptrend")

    def test_train_model(self):
        """Test model training and prediction."""
        prediction, confidence, accuracy = train_model(self.test_symbol)
        
        # Check prediction is binary
        self.assertIn(prediction, [0, 1])
        
        # Check confidence is between 0 and 1
        self.assertGreaterEqual(confidence, 0)
        self.assertLessEqual(confidence, 1)
        
        # Check accuracy is between 0 and 1
        self.assertGreaterEqual(accuracy, 0)
        self.assertLessEqual(accuracy, 1)

    def test_update_predictions(self):
        """Test full prediction update process."""
        cache_data = update_predictions()
        
        # Check if cache data has all required fields
        self.assertIn('last_updated', cache_data)
        self.assertIn('prediction_date', cache_data)
        self.assertIn('predictions', cache_data)
        self.assertIn('performance', cache_data)
        
        # Check if predictions exist for all stocks
        stocks = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN']
        for symbol in stocks:
            self.assertIn(symbol, cache_data['predictions'])
            
            # Check prediction structure
            pred = cache_data['predictions'][symbol]
            self.assertIn('prediction', pred)
            self.assertIn('confidence', pred)
            self.assertIn('accuracy', pred)
            
            # Check value types and ranges
            self.assertIn(pred['prediction'], ['UP', 'DOWN', 'ERROR'])
            self.assertGreaterEqual(pred['confidence'], 0)
            self.assertLessEqual(pred['confidence'], 1)
            self.assertGreaterEqual(pred['accuracy'], 0)
            self.assertLessEqual(pred['accuracy'], 1)

if __name__ == '__main__':
    unittest.main() 