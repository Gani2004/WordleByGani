from flask import Flask, render_template, request, jsonify, session
import random

app = Flask(__name__)
app.secret_key = 'your-secret-key'

# Load full English 5-letter words list
with open('wordlist.txt') as f:
    WORDS = [word.strip().lower() for word in f if len(word.strip()) == 5]

@app.route('/')
def index():
    if 'word' not in session:
        session['word'] = random.choice(WORDS)
        session['attempts'] = 0
    return render_template('index.html')

@app.route('/guess', methods=['POST'])
def guess():
    data = request.get_json()
    guess_word = data.get('guess', '').lower()
    target_word = session.get('word', '')

    if len(guess_word) != 5 or guess_word not in WORDS:
        return jsonify({'error': 'Invalid word'}), 400

    session['attempts'] = session.get('attempts', 0) + 1
    result = ['grey'] * 5
    used_target = [False] * 5

    # First pass: green
    for i in range(5):
        if guess_word[i] == target_word[i]:
            result[i] = 'green'
            used_target[i] = True

    # Second pass: yellow
    for i in range(5):
        if result[i] == 'grey':
            for j in range(5):
                if guess_word[i] == target_word[j] and not used_target[j]:
                    result[i] = 'yellow'
                    used_target[j] = True
                    break

    response = {'result': result}

    if guess_word == target_word:
        response['win'] = True
    elif session['attempts'] >= 6:
        response['reveal'] = target_word
        session.pop('attempts', None)

    return jsonify(response)

@app.route('/reset', methods=['POST'])
def reset():
    session['word'] = random.choice(WORDS)
    session['attempts'] = 0
    return jsonify({'message': 'Game reset!'})

if __name__ == '__main__':
    app.run(debug=True)
