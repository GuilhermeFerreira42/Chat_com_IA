document.addEventListener('DOMContentLoaded', function () {
    const messagesContainer = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat-btn');
    const conversationItems = document.querySelectorAll('.conversation-item');
    const typingIndicator = document.getElementById('typing-indicator');
    let currentMessageDiv = null; // Para rastrear a mensagem que está sendo atualizada

    function showMessage(content, type = 'assistant') {
        if (!currentMessageDiv || type !== 'assistant') {
            // Cria nova mensagem apenas se não for incremental ou for do usuário
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}-message`;
            messageDiv.textContent = content;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            if (type === 'assistant') currentMessageDiv = messageDiv; // Atualiza o rastreador
            return messageDiv;
        }
        // Atualiza mensagem existente para o assistente
        currentMessageDiv.textContent += content;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return currentMessageDiv;
    }

    async function handleMessage(message) {
        showMessage(message, 'user'); // Mostra a mensagem do usuário
        messageInput.value = '';
        typingIndicator.style.display = 'block';

        try {
            const response = await fetch('/send_message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversation_id: chatState.currentConversationId,
                }),
            });

            if (response.ok && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let done = false;
                currentMessageDiv = null; // Reset para uma nova resposta

                while (!done) {
                    const { value, done: streamDone } = await reader.read();
                    done = streamDone;
                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        try {
                            if (chunk.includes('data: ')) {
                                const jsonString = chunk.split('data: ')[1].trim();
                                if (jsonString && jsonString !== '[DONE]') {
                                    const json = JSON.parse(jsonString);
                                    if (json.content) {
                                        showMessage(json.content, 'assistant'); // Atualiza mensagem incremental
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('[Debug] Erro ao processar chunk:', chunk, e);
                        }
                    }
                }

                typingIndicator.style.display = 'none';
            } else {
                throw new Error('Resposta inválida do servidor');
            }
        } catch (error) {
            console.error('Erro:', error);
            showMessage('Erro ao processar sua mensagem.', 'system');
            typingIndicator.style.display = 'none';
        }
    }

    async function loadConversation(conversationId) {
        try {
            const response = await fetch(`/get_conversation/${conversationId}`);
            const conversation = await response.json();

            messagesContainer.innerHTML = ''; // Limpa mensagens anteriores

            conversation.messages.forEach((msg) => {
                showMessage(msg.content, msg.role);
            });

            chatState.setConversationId(conversationId); // Atualiza ID atual

            document.querySelectorAll('.conversation-item').forEach((item) => {
                item.classList.remove('active');
                if (item.dataset.id === conversationId) {
                    item.classList.add('active');
                }
            });
        } catch (error) {
            console.error('Erro ao carregar conversa:', error);
            showMessage('Erro ao carregar conversa.', 'system');
        }
    }

    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            handleMessage(message);
        }
    });

    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = this.value.trim();
            if (message) {
                handleMessage(message);
            }
        }
    });

    newChatButton.addEventListener('click', () => {
        chatState.setConversationId(null); // Resetar ID da conversa
        chatState.setMode('normal');
        messagesContainer.innerHTML = '';
        messageInput.value = '';
        messageInput.focus();

        document.querySelectorAll('.conversation-item.active').forEach((item) =>
            item.classList.remove('active')
        );

        const newChatPlaceholder = document.createElement('div');
        newChatPlaceholder.className = 'conversation-item active';
        newChatPlaceholder.dataset.id = 'new';
        newChatPlaceholder.innerHTML = `
            <span class="conversation-preview">Novo Chat...</span>
            <span class="conversation-date">${new Date().toISOString().split('T')[0]}</span>
        `;
        document.querySelector('.conversation-list').prepend(newChatPlaceholder);
    });

    conversationItems.forEach((item) => {
        item.addEventListener('click', function () {
            const conversationId = this.dataset.id;
            loadConversation(conversationId);
        });
    });
});
