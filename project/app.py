from flask import Flask, render_template, request, jsonify, session
import json
from datetime import datetime
import requests
from utils.text_processor import split_text
from utils.chat_history import save_conversation, get_conversation_history, get_conversation_by_id

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta_aqui'

API_URL = "http://localhost:11434/v1/chat/completions"
MODEL_NAME = "gemma2:2b"

@app.route('/')
def home():
    conversations = get_conversation_history()
    if not conversations:
        conversations = []  # Garante que a variável não será None
    return render_template('index.html', conversations=conversations)

@app.route('/get_conversation/<conversation_id>')
def get_conversation(conversation_id):
    conversation = get_conversation_by_id(conversation_id)
    if conversation:
        return jsonify(conversation)
    return jsonify({'error': 'Conversa não encontrada'}), 404

@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.json
    message = data.get('message', '')
    conversation_id = data.get('conversation_id')
    
    if len(message.split()) > 300:
        chunks = split_text(message)
        responses = []
        for chunk in chunks:
            response = process_with_ai(chunk)
            responses.append(response)
        final_response = " ".join(responses)
    else:
        final_response = process_with_ai(message)
    
    # Verifica se um ID válido foi fornecido, caso contrário, cria um novo
    if not conversation_id:
        conversation_id = save_conversation(message, final_response)
    else:
        save_conversation(message, final_response, conversation_id)
    
    # Retorna a resposta decodificada corretamente
    return app.response_class(
        response=json.dumps({
            'response': final_response,
            'timestamp': datetime.now().isoformat(),
            'conversation_id': conversation_id
        }, ensure_ascii=False),  # Garante que caracteres especiais sejam exibidos corretamente
        mimetype='application/json'
    )

def process_with_ai(text):
    try:
        payload = {
            "model": MODEL_NAME,
            "messages": [
                {"role": "system", "content": "Você é um assistente útil."},
                {"role": "user", "content": text}
            ],
            "stream": True  # Habilita o streaming
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        print("Enviando payload para a API:", payload)
        response = requests.post(API_URL, json=payload, headers=headers, stream=True)
        response.raise_for_status()

        # Loga o conteúdo bruto da resposta antes de processar
        print("Resposta completa da API (bruta):")
        full_response = ""
        for line in response.iter_lines(decode_unicode=True):
            print("Linha recebida:", line)

            if line.strip():  # Ignora linhas em branco
                if line.startswith("data: "):  # Remove o prefixo 'data: '
                    line = line[6:].strip()

                try:
                    response_data = json.loads(line)
                    if 'choices' in response_data and len(response_data['choices']) > 0:
                        delta = response_data['choices'][0]['delta']
                        if "content" in delta:
                            content = delta["content"]
                            full_response += content
                            print("Parte da resposta da IA:", content)
                except json.JSONDecodeError:
                    print(f"Erro ao decodificar JSON, ignorando linha: {line}")
                    continue

        # Verifica se a resposta final está vazia
        if not full_response.strip():
            print("A resposta da IA está vazia após processamento.")
            return "Desculpe, não consegui processar sua mensagem."

        # Normaliza e limpa a resposta
        normalized_response = (
            full_response
            .encode('latin1')  # Ajusta para codificação correta
            .decode('utf-8')  # Decodifica para UTF-8
        )
        normalized_response = normalized_response.replace("ð", "").strip()  # Remove 'ð'
        print("Resposta completa da IA (normalizada):", normalized_response)
        
        return normalized_response

    except requests.exceptions.RequestException as e:
        print(f"Erro na requisição HTTP: {str(e)}")
        return "Ocorreu um erro ao se conectar com a IA."
    except Exception as e:
        print(f"Erro inesperado: {str(e)}")
        return "Ocorreu um erro inesperado ao processar sua mensagem."

if __name__ == '__main__':
    app.run(debug=True)