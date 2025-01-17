document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat-btn');
    const conversationItems = document.querySelectorAll('.conversation-item');

    function showMessage(content, type = 'assistant') {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = content; // Define apenas o texto da mensagem
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Rolagem automática
    }

    async function simulateTyping(text, element) {
        let index = 0;
        element.textContent = '';
        
        return new Promise(resolve => {
            function type() {
                if (index < text.length) {
                    element.textContent += text[index];
                    index++;
                    setTimeout(type, 20);
                } else {
                    resolve();
                }
            }
            type();
        });
    }

    async function handleMessage(message) {
        // Verifica se é um comando
        if (handleCommand(message)) {
            return;
        }

        // Processa o texto baseado no modo atual
        if (chatState.isInSummaryMode()) {
            await processSummaryText(message);
            chatState.setMode('normal'); // Volta ao modo normal após processar
        } else {
            await sendRegularMessage(message);
        }
    }

    async function sendRegularMessage(message) {
        showMessage(message, 'user'); // Mostra a mensagem do usuário
        messageInput.value = '';
    
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.style.display = 'block';
    
        try {
            const response = await fetch('/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    conversation_id: chatState.currentConversationId,
                }),
            });
    
            const data = await response.json(); // Parse do JSON
            const finalResponse = data.response; // Extrai o valor da propriedade 'response'
            showMessage(finalResponse, 'assistant'); // Mostra o texto no chat
            typingIndicator.style.display = 'none';
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
            
            // Limpa mensagens anteriores
            messagesContainer.innerHTML = '';
            
            // Mostra todas as mensagens da conversa
            conversation.messages.forEach(msg => {
                showMessage(msg.content, msg.role);
            });
            
            // Atualiza ID da conversa atual
            chatState.setConversationId(conversationId);
            
            // Atualiza visual do item selecionado
            document.querySelectorAll('.conversation-item').forEach(item => {
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

    // Event Listeners
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            handleMessage(message);
        }
    });
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = this.value.trim();
            if (message) {
                handleMessage(message);
            }
        }
    });

    newChatButton.addEventListener('click', () => {
        chatState.setConversationId(null); // Garante que o ID da conversa é resetado
        chatState.setMode('normal');
        messagesContainer.innerHTML = '';
        messageInput.value = '';
        messageInput.focus();
    
        // Remove a seleção de chats anteriores no frontend
        document.querySelectorAll('.conversation-item.active')
            .forEach(item => item.classList.remove('active'));
        
        // Adiciona uma entrada de placeholder para novos chats no histórico
        const newChatPlaceholder = document.createElement('div');
        newChatPlaceholder.className = 'conversation-item active';
        newChatPlaceholder.dataset.id = 'new';
        newChatPlaceholder.innerHTML = `
            <span class="conversation-preview">Novo Chat...</span>
            <span class="conversation-date">${new Date().toISOString().split('T')[0]}</span>
        `;
        document.querySelector('.conversation-list').prepend(newChatPlaceholder);
    });
   

    conversationItems.forEach(item => {
        item.addEventListener('click', function() {
            const conversationId = this.dataset.id;
            loadConversation(conversationId);
        });
    });
});