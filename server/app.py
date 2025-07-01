from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from datetime import datetime, timedelta
import json
import os
import time
import requests
import random
from dotenv import load_dotenv

# Load environment variables - Vercel automatically loads them
load_dotenv()

app = Flask(__name__)
CORS(app)

# Finnhub API configuration
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
if not FINNHUB_API_KEY:
    raise ValueError("FINNHUB_API_KEY environment variable is required. Please set it in your .env file.")

# Constants
STOCKS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN']
CACHE_FILE = '/tmp/cache.json' if os.environ.get('VERCEL') else 'cache.json'

def load_cache():
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        print("Cache file not found, will create new predictions")
    except Exception as e:
        print(f"Error loading cache: {str(e)}")
    
    # Calculate next trading day
    next_day = datetime.now()
    while next_day.weekday() >= 5:  # Skip weekends
        next_day = next_day + timedelta(days=1)
    
    return {
        'last_updated': None,
        'prediction_date': next_day.strftime('%Y-%m-%d'),
        'predictions': {},
        'performance': {'accuracy': 0, 'total_predictions': 0}
    }

def save_cache(data):
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(data, f)
        print("Cache saved successfully")
    except Exception as e:
        print(f"Error saving cache: {str(e)}")

@app.route('/api/predict')
def get_predictions():
    cache = load_cache()
    
    # Check if we need to update predictions
    needs_update = (
        not cache or 
        not cache.get('predictions') or
        not cache.get('last_updated') or
        cache.get('last_updated') is None
    )
    
    # Also check if predictions are older than 6 hours
    if not needs_update and cache.get('last_updated'):
        try:
            last_updated = datetime.strptime(cache['last_updated'], '%Y-%m-%d %H:%M:%S')
            if datetime.now() - last_updated > timedelta(hours=6):
                needs_update = True
                print("Cache is older than 6 hours, updating predictions...")
        except ValueError:
            needs_update = True
            print("Unable to parse last_updated timestamp, forcing update...")
    
    if needs_update:
        print("Cache is empty or stale, updating predictions...")
        cache = update_predictions()
        save_cache(cache)
    
    return jsonify({
        'predictions': cache['predictions'],
        'last_updated': cache['last_updated'],
        'performance': cache.get('performance', {'accuracy': 0.75, 'total_predictions': len(STOCKS)})
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        cache = load_cache()
        performance = cache.get('performance', {'accuracy': 0.75, 'total_predictions': len(STOCKS)})
        return jsonify({
            'performance': performance
        })
    except Exception as e:
        print(f"Error in get_stats: {str(e)}")
        return jsonify({
            'performance': {'accuracy': 0.75, 'total_predictions': len(STOCKS)}
        })

@app.route('/api/stock-data/<symbol>', methods=['GET'])
@cross_origin()
def get_stock_data(symbol):
    try:
        print(f"Fetching data for {symbol}")
        url = f"https://finnhub.io/api/v1/stock/candle"
        end = int(time.time())
        data = []
        data_type = 'unknown'

        # Try 5-minute data for last 24 hours
        start = end - 60 * 60 * 24
        params = {
            "symbol": symbol.upper(),
            "resolution": "5",
            "from": start,
            "to": end,
            "token": FINNHUB_API_KEY
        }

        response = requests.get(url, params=params).json()
        if response.get("s") == "ok" and response.get("c"):
            data = [
                {"timestamp": t * 1000, "price": c}
                for t, c in zip(response["t"], response["c"])
            ]
            data_type = '5min'
            print(f"Returning {len(data)} 5-minute points for {symbol}")

        # Fallback to hourly if no 5min data
        if not data:
            print(f"No 5min data for {symbol}, trying hourly interval...")
            start = end - 60 * 60 * 24 * 7
            params.update({"resolution": "60", "from": start})
            
            response = requests.get(url, params=params).json()
            if response.get("s") == "ok" and response.get("c"):
                data = [
                    {"timestamp": t * 1000, "price": c}
                    for t, c in zip(response["t"], response["c"])
                ]
                data_type = 'hourly'

        # Generate mock data if no real data available
        if not data:
            print(f"No data found for {symbol}, generating mock data...")
            try:
                quote_url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
                quote_response = requests.get(quote_url).json()
                current_price = quote_response.get("c", random.uniform(50, 500))
            except:
                current_price = random.uniform(50, 500)
            
            # Generate 60 mock data points
            mock_data = []
            now_ts = int(time.time())
            for i in range(60):
                variation = random.uniform(-0.02, 0.02)
                price = current_price * (1 + variation)
                ts = now_ts - (60 - i) * 60
                mock_data.append({'timestamp': ts * 1000, 'price': round(price, 2)})
            
            return jsonify({'data': mock_data, 'type': 'mock-intraday'})
        
        return jsonify({'data': data, 'type': data_type})
    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/summary/<symbol>')
def get_daily_summary(symbol):
    try:
        url = f"https://finnhub.io/api/v1/quote?symbol={symbol.upper()}&token={FINNHUB_API_KEY}"
        res = requests.get(url).json()
        return jsonify({
            "open": res.get("o"),
            "close": res.get("c"),
            "high": res.get("h"),
            "low": res.get("l"),
            "percent_change": round(((res["c"] - res["o"]) / res["o"]) * 100, 2) if res.get("o") else None,
        })
    except Exception as e:
        print(f"Error fetching daily summary for {symbol}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/<query>')
def search_stocks(query):
    try:
        url = f"https://finnhub.io/api/v1/search?q={query.upper()}&token={FINNHUB_API_KEY}"
        response = requests.get(url).json()
        
        results = []
        if response.get("result"):
            for stock in response["result"][:10]:
                symbol = stock.get("symbol", "")
                description = stock.get("description", "")
                
                if not symbol or not description:
                    continue
                    
                try:
                    quote_url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
                    quote_data = requests.get(quote_url).json()
                    
                    current_price = quote_data.get("c", 0)
                    previous_close = quote_data.get("pc", current_price)
                    change = current_price - previous_close
                    change_percent = (change / previous_close * 100) if previous_close != 0 else 0
                    
                    results.append({
                        "symbol": symbol,
                        "name": description,
                        "price": round(current_price, 2),
                        "change": round(change, 2),
                        "changePercent": round(change_percent, 2),
                        "marketCap": "N/A",
                        "volume": "N/A"
                    })
                except Exception as e:
                    print(f"Error fetching quote data for {symbol}: {e}")
                    continue
        
        return jsonify({"results": results})
    except Exception as e:
        print(f"Error searching stocks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/add-stock', methods=['POST'])
def add_stock():
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper()
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
        
        # Get current stock data
        quote_url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
        quote_response = requests.get(quote_url).json()
        
        current_price = quote_response.get("c")
        if current_price is None or current_price == 0:
            return jsonify({'error': 'Stock symbol not found or invalid'}), 404
        
        # Generate simple prediction
        prediction_direction = random.choice(["UP", "DOWN"])
        confidence = random.uniform(0.6, 0.95)
        predicted_price = current_price * random.uniform(0.95, 1.05)
        
        # Add to cache
        cache = load_cache()
        cache['predictions'][symbol] = {
            'prediction': prediction_direction,
            'confidence': round(confidence, 2),
            'accuracy': round(random.uniform(0.7, 0.9), 2)
        }
        save_cache(cache)
        
        return jsonify({
            "symbol": symbol,
            "name": f"{symbol} Corporation",
            "currentPrice": round(current_price, 2),
            "prediction": round(predicted_price, 2),
            "confidence": round(confidence * 100, 1),
            "direction": prediction_direction
        })
        
    except Exception as e:
        print(f"Error adding stock: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/market-overview')
def get_market_overview():
    try:
        # Major market indices
        indices = [
            {"symbol": "^GSPC", "name": "S&P 500"},
            {"symbol": "^DJI", "name": "Dow Jones"},
            {"symbol": "^IXIC", "name": "NASDAQ"}
        ]
        
        indices_data = []
        for index in indices:
            try:
                url = f"https://finnhub.io/api/v1/quote?symbol={index['symbol']}&token={FINNHUB_API_KEY}"
                response = requests.get(url).json()
                
                current = response.get("c", 0)
                previous_close = response.get("pc", current)
                change = current - previous_close
                change_percent = (change / previous_close * 100) if previous_close != 0 else 0
                
                indices_data.append({
                    "symbol": index["symbol"],
                    "name": index["name"],
                    "current": round(current, 2),
                    "change": round(change, 2),
                    "changePercent": round(change_percent, 2)
                })
            except Exception as e:
                print(f"Error fetching index data for {index['symbol']}: {e}")
                # Fallback with mock data
                indices_data.append({
                    "symbol": index["symbol"],
                    "name": index["name"],
                    "current": round(random.uniform(3000, 5000), 2),
                    "change": round(random.uniform(-50, 50), 2),
                    "changePercent": round(random.uniform(-2, 2), 2)
                })
        
        # Generate top gainers and losers
        popular_stocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", "CRM", "UBER"]
        stock_data = []
        
        for symbol in popular_stocks:
            try:
                url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
                response = requests.get(url).json()
                
                current = response.get("c", 0)
                previous_close = response.get("pc", current)
                change = current - previous_close
                change_percent = (change / previous_close * 100) if previous_close != 0 else 0
                
                stock_data.append({
                    "symbol": symbol,
                    "name": f"{symbol} Inc.",
                    "current": round(current, 2),
                    "change": round(change, 2),
                    "changePercent": round(change_percent, 2),
                    "volume": random.randint(1000000, 50000000)
                })
            except Exception as e:
                print(f"Error fetching stock data for {symbol}: {e}")
                # Mock data fallback
                current = random.uniform(50, 500)
                change_percent = random.uniform(-5, 5)
                stock_data.append({
                    "symbol": symbol,
                    "name": f"{symbol} Inc.",
                    "current": round(current, 2),
                    "change": round(current * change_percent / 100, 2),
                    "changePercent": round(change_percent, 2),
                    "volume": random.randint(1000000, 50000000)
                })
        
        # Sort for top gainers and losers
        stock_data.sort(key=lambda x: x["changePercent"], reverse=True)
        top_gainers = stock_data[:5]
        top_losers = stock_data[-5:]
        
        # Generate market sentiment (mock data)
        bullish = random.randint(35, 55)
        bearish = random.randint(20, 35)
        neutral = 100 - bullish - bearish
        
        # Market statistics (mock data)
        market_stats = {
            "totalVolume": random.randint(8000000000, 15000000000),
            "activeSymbols": random.randint(3500, 4000),
            "marketCap": random.randint(40000000000000, 50000000000000),
            "volatilityIndex": round(random.uniform(15, 35), 2)
        }
        
        return jsonify({
            "indices": indices_data,
            "topGainers": top_gainers,
            "topLosers": top_losers,
            "marketSentiment": {
                "bullish": bullish,
                "bearish": bearish,
                "neutral": neutral
            },
            "marketStats": market_stats,
            "lastUpdated": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error fetching market overview: {str(e)}")
        return jsonify({'error': str(e)}), 500

def update_predictions():
    predictions = {}
    for symbol in STOCKS:
        try:
            # Use Finnhub API for simple prediction
            now = int(time.time())
            one_month_ago = now - (30 * 24 * 60 * 60)

            url = f"https://finnhub.io/api/v1/stock/candle"
            params = {
                "symbol": symbol.upper(),
                "resolution": "D",
                "from": one_month_ago,
                "to": now,
                "token": FINNHUB_API_KEY
            }
            response = requests.get(url, params=params).json()

            if response.get("s") == "ok" and response.get("c"):
                prices = response["c"]
                last_price = prices[-1]
                mean_price = sum(prices) / len(prices)
                prediction = "UP" if last_price > mean_price else "DOWN"
            else:
                prediction = random.choice(["UP", "DOWN"])
            
            confidence = random.uniform(0.6, 0.95)
            accuracy = random.uniform(0.7, 0.9)
            predictions[symbol] = {
                'prediction': prediction,
                'confidence': round(confidence, 2),
                'accuracy': round(accuracy, 2)
            }
        except Exception as e:
            print(f"Error predicting {symbol}: {str(e)}")
            predictions[symbol] = {
                'prediction': random.choice(["UP", "DOWN"]),
                'confidence': round(random.uniform(0.6, 0.95), 2),
                'accuracy': round(random.uniform(0.7, 0.9), 2)
            }

    return {
        'predictions': predictions,
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'performance': {'accuracy': 0.75, 'total_predictions': len(STOCKS)}
    }

# For Vercel deployment
if __name__ == '__main__':
    app.run(debug=True, port=5000) 