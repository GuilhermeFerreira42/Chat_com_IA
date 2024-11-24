# Chat com IA

## Descrição

Este projeto consiste em um chat interativo desenvolvido em Python utilizando a biblioteca **wxPython** para a interface gráfica e a API de IA LLaMA 3.2 para processar as mensagens. O chat permite que o usuário envie mensagens e receba respostas de uma inteligência artificial, simulando uma conversa. A comunicação com a IA é feita por meio de uma API RESTful.

## Funcionalidades

- **Interface Gráfica**: Interface simples e amigável com uma área para exibição do histórico de mensagens e uma caixa de entrada para o usuário digitar suas mensagens.
- **Comunicação com IA**: Envia as mensagens do usuário para a API de IA e exibe a resposta recebida.
- **Histórico de Conversa**: Exibe o histórico de mensagens do usuário e da IA de forma contínua na interface.
- **Erro de Conexão**: Mostra mensagens de erro caso ocorra algum problema na comunicação com a API.

## Requisitos

Antes de executar o programa, você precisa ter o seguinte instalado:

### Dependências de Python

- **wxPython**: Para a interface gráfica.
- **requests**: Para a comunicação com a API de IA.

Você pode instalar as dependências usando o seguinte comando:

```bash
pip install wxPython requests
```

### API de IA

O código se conecta a uma API de IA local (LLaMA 3.2). Certifique-se de que a API esteja rodando localmente na URL `http://localhost:11434/v1/chat/completions` ou altere a URL conforme a configuração da sua API.

## Como Executar

1. **Instalar as dependências**:
   Execute o seguinte comando para instalar as bibliotecas necessárias:

   ```bash
   pip install wxPython requests
   ```

2. **Rodar a API de IA**:
   Certifique-se de que a API LLaMA 3.2 (ou qualquer outra IA com modelo compatível) esteja em execução localmente ou na URL configurada no código.

3. **Executar o Script**:
   Salve o código acima em um arquivo Python (por exemplo, `chat_ia.py`) e execute-o:

   ```bash
   python chat_ia.py
   ```

   A interface gráfica do chat será aberta.

4. **Interagir com o Chat**:
   Na interface, digite suas mensagens na caixa de entrada e clique no botão "Enviar" para enviar a mensagem à IA. A resposta será exibida no histórico de conversa.

## Estrutura do Código

### 1. **ChatApp**: A classe principal que gerencia a interface gráfica.

- **Função `send_message`**: Envia a mensagem do usuário para a IA e exibe a resposta.
- **Função `query_ai`**: Faz a requisição à API da IA usando a biblioteca `requests`.

### 2. **Interface Gráfica**: A interface gráfica foi criada utilizando a biblioteca `wxPython`, composta por uma área de texto para exibir o histórico de conversa e uma caixa de entrada para o usuário digitar suas mensagens.

## Considerações

- **Erro de Conexão**: Se a API da IA não estiver acessível ou ocorrer algum erro, o programa exibirá uma mensagem de erro no histórico de conversa.
- **Customização**: Você pode modificar o comportamento da IA alterando a variável `MODEL_NAME` para o modelo desejado ou ajustando a mensagem do sistema.

## Licença

Este projeto está sob a licença [MIT License](https://opensource.org/licenses/MIT).
