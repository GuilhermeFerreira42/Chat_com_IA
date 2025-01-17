import wx
import requests
import json
import threading
import time
from flask import Flask, render_template_string, request, jsonify
import wx
import requests
import json
import threading
import time

app = Flask(__name__)

# Configuração da API
API_URL = "http://localhost:11434/v1/chat/completions"
MODEL_NAME = "gemma2:2b"  # Alterado para o modelo correto

@app.route('/')
def index():
    return render_template_string('''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Chat com IA</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f0f0f0;
                margin: 0;
                padding: 20px;
            }
            .chat-container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            #chat-history {
                height: 300px;
                overflow-y: scroll;
                border: 1px solid #ddd;
                padding: 10px;
                margin-bottom: 10px;
                background-color: #fafafa;
            }
            .message {
                margin: 10px 0;
                padding: 10px;
                border-radius: 5px;
            }
            .message.user {
                background-color: #dcedc8;
                text-align: right;
            }
            .message.ai {
                background-color: #bbdefb;
            }
        </style>
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    </head>
    <body>
        <div class="chat-container">
            <div id="chat-history"></div>
            <input type="text" id="message-input" placeholder="Digite sua mensagem">
            <button id="send-btn">Enviar</button>
        </div>

        <script>
            $('#send-btn').click(function() {
                let userMessage = $('#message-input').val().trim();
                if (!userMessage) return;

                $('#chat-history').append('<div class="message user"><strong>Você:</strong> ' + userMessage + '</div>');
                $('#message-input').val('');

                $.post('/send_message', {message: userMessage}, function(data) {
                    let aiResponse = data.response;
                    $('#chat-history').append('<div class="message ai"><strong>IA:</strong> ' + aiResponse + '</div>');
                    $("#chat-history").scrollTop($("#chat-history")[0].scrollHeight);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    $('#chat-history').append('<div class="message error"><strong>Erro:</strong> ' + textStatus + ' - ' + errorThrown + '</div>');
                });
            });
        </script>
    </body>
    </html>
    ''')

@app.route('/send_message', methods=['POST'])
def send_message():
    user_message = request.form['message']
    try:
        response = query_ai(user_message)
        return jsonify({'response': response})
    except Exception as e:
        return jsonify({'response': f"Erro: {str(e)}"}), 500

def query_ai(message):
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "Você é um assistente útil."},
            {"role": "user", "content": message}
        ]
    }
    headers = {"Content-Type": "application/json"}
    response = requests.post(API_URL, headers=headers, data=json.dumps(payload))
    response.raise_for_status()
    result = response.json()
    return result.get("choices", [{}])[0].get("message", {}).get("content", "Sem resposta.")

if __name__ == "__main__":
    app.run(debug=True)
