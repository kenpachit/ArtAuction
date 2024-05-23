from functools import lru_cache

from flask import Flask, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
import os
import sqlite3
from dotenv import load_dotenv
from functools import lru_cache

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
DATABASE = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    password = data['password']
    password_hash = generate_password_hash(password)
    
    conn = get_db_connection()
    conn.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', (username, password_hash))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        return jsonify({'message': 'Login successful'})
    else:
        return jsonify({'message': 'Invalid username or password'}), 401

@app.route('/auctions/<int:auction_id>', methods=['GET'])
def get_auction(auction_id):
    conn = get_db_connection()
    auction = conn.execute('SELECT * FROM auctions WHERE id = ?', (auction_id,)).fetchone()
    conn.close()
    
    if auction:
        return jsonify(dict(auction))
    else:
        return jsonify({'message': 'Auction not found'}), 404

@app.route('/external-art', methods=['GET'])
@lru_cache(maxsize=32)
def get_external_art():
    return jsonify({
        'gallery': 'External Art Gallery',
        'artworks': [
            {'id': 1, 'name': 'Mona Lisa', 'artist': 'Leonardo da Vinci'},
            {'id': 2, 'name': 'Starry Night', 'artist': 'Vincent van Gogh'}
        ]
    })

if __name__ == '__main__':
    app.run(debug=True)