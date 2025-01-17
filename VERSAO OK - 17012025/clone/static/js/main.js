// Estado global
let currentTheme = 'light';
let currentModel = 'gemma2:2b';
let conversas = [];
let conversaAtual = null;

// Elementos DOM
const themeToggle = document.querySelector('.theme-toggle');
const modelSelect = document.querySelector('.model-select');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const headerSidebarToggle = document.querySelector('.header-sidebar-toggle');
const welcomeScreen = document.querySelector('.welcome-screen');
const chatContainer = document.querySelector('.chat-container');
const inputContainer = document.querySelector('.input-container');
const welcomeForm = document.querySelector('#welcome-form');
const chatForm = document.querySelector('#chat-form');
const welcomeInput = document.querySelector('#welcome-input');
const chatInput = document.querySelector('#chat-input');
const newChatBtn = document.querySelector('.new-chat-btn');
const searchInput = document.querySelector('#search-input');
const chatList = document.querySelector('.chat-list');

// Funções
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    themeToggle.innerHTML = currentTheme === 'light' 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
}

function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

function mostrarTelaInicial() {
    welcomeScreen.style.display = 'flex';
    chatContainer.style.display = 'none';
    inputContainer.style.display = 'none';
    welcomeInput.value = '';
    chatInput.value = '';
    conversaAtual = null;
}

function iniciarChat() {
    welcomeScreen.style.display = 'none';
    chatContainer.style.display = 'block';
    inputContainer.style.display = 'block';
    chatContainer.innerHTML = '';
}

// Função para escapar caracteres HTML
function escapeHTML(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

function adicionarMensagem(texto, tipo) {
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `message ${tipo}`;
    mensagemDiv.innerHTML = `
        <p>${escapeHTML(texto).replace(/\n/g, '<br>')}</p>
        <div class="message-actions">
            <button class="action-btn" onclick="copiarMensagem(this)">
                <i class="fas fa-copy"></i>
            </button>
            ${tipo === 'assistant' ? `
                <button class="action-btn" onclick="regenerarResposta(this)">
                    <i class="fas fa-redo"></i>
                </button>
            ` : ''}
        </div>
    `;
    chatContainer.appendChild(mensagemDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function mostrarCarregamento() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading message assistant';
    loadingDiv.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return loadingDiv;
}

async function enviarMensagem(mensagem, input) {
    if (!mensagem.trim()) return;

    if (!conversaAtual) {
        iniciarChat();
        conversaAtual = {
            id: Date.now(),
            titulo: mensagem.slice(0, 30) + (mensagem.length > 30 ? '...' : ''),
            mensagens: []
        };
        conversas.push(conversaAtual);
        atualizarListaConversas();
    }

    input.value = '';
    input.style.height = 'auto';
    adicionarMensagem(mensagem, 'user');
    conversaAtual.mensagens.push({ tipo: 'user', conteudo: mensagem });

    const loadingDiv = mostrarCarregamento();
    let accumulatedMessage = '';

    try {
        const response = await fetch('/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: mensagem,
                conversation_id: conversaAtual.id
            })
        });

        if (response.ok && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;

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
                                    accumulatedMessage += json.content;
                                    loadingDiv.innerHTML = `<p>${escapeHTML(accumulatedMessage).replace(/\n/g, '<br>')}</p>`;
                                }
                            }
                        }
                    } catch (e) {
                        console.error('[Debug] Erro ao processar chunk:', chunk, e);
                    }
                }
            }

            loadingDiv.remove();
            adicionarMensagem(accumulatedMessage, 'assistant');
            conversaAtual.mensagens.push({ tipo: 'assistant', conteudo: accumulatedMessage });
        } else {
            throw new Error('Resposta inválida do servidor');
        }
    } catch (erro) {
        loadingDiv.remove();
        const mensagemErro = 'Erro ao conectar com o servidor. Verifique se o servidor está rodando.';
        adicionarMensagem(mensagemErro, 'assistant');
        conversaAtual.mensagens.push({ tipo: 'assistant', conteudo: mensagemErro });
        console.error('Erro:', erro);
    }
}

function carregarConversa(id) {
    const conversa = conversas.find(c => c.id === id);
    if (!conversa) return;

    conversaAtual = conversa;
    iniciarChat();

    chatContainer.innerHTML = '';

    conversa.mensagens.forEach(msg => {
        adicionarMensagem(msg.conteudo, msg.tipo);
    });
}

function atualizarListaConversas() {
    const chatList = document.querySelector('.chat-list');
    chatList.innerHTML = '';
    conversas.forEach(conversa => {
        const conversaElement = document.createElement('div');
        conversaElement.className = 'chat-item';
        conversaElement.onclick = () => carregarConversa(conversa.id);
        conversaElement.innerHTML = `
            <span>${conversa.titulo}</span>
            <div class="action-buttons">
                <button class="action-btn" onclick="event.stopPropagation(); renomearConversa(${conversa.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); excluirConversa(${conversa.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        chatList.appendChild(conversaElement);
    });
}

function copiarMensagem(button) {
    const mensagem = button.closest('.message').textContent.trim();
    navigator.clipboard.writeText(mensagem);
    
    const icon = button.querySelector('i');
    icon.className = 'fas fa-check';
    setTimeout(() => {
        icon.className = 'fas fa-copy';
    }, 1000);
}

function regenerarResposta(button) {
    const mensagemElement = button.closest('.message');
    const mensagemAnterior = mensagemElement.previousElementSibling;
    if (mensagemAnterior && mensagemAnterior.classList.contains('user')) {
        const mensagemUsuario = mensagemAnterior.textContent.trim();
        mensagemElement.remove();
        if (conversaAtual) {
            conversaAtual.mensagens.pop();
        }
        enviarMensagem(mensagemUsuario, chatInput);
    }
}

function renomearConversa(id) {
    const conversa = conversas.find(c => c.id === id);
    if (!conversa) return;

    const novoTitulo = prompt('Digite o novo título da conversa:', conversa.titulo);
    if (novoTitulo && novoTitulo.trim()) {
        conversa.titulo = novoTitulo.trim();
        atualizarListaConversas();
    }
}

function excluirConversa(id) {
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
        conversas = conversas.filter(c => c.id !== id);
        if (conversaAtual && conversaAtual.id === id) {
            mostrarTelaInicial();
        }
        atualizarListaConversas();
    }
}

// Função para configurar o textarea autoexpansível
function configureTextarea(textarea) {
    if (!textarea) return;

    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = this.closest('form');
            if (form) {
                const event = new Event('submit', {
                    'bubbles': true,
                    'cancelable': true
                });
                form.dispatchEvent(event);
            }
        }
    });
}

// Event Listeners
themeToggle.addEventListener('click', toggleTheme);
sidebarToggle?.addEventListener('click', toggleSidebar);
headerSidebarToggle?.addEventListener('click', toggleSidebar);
newChatBtn.addEventListener('click', mostrarTelaInicial);

welcomeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    enviarMensagem(welcomeInput.value, welcomeInput);
});

chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    enviarMensagem(chatInput.value, chatInput);
});

modelSelect?.addEventListener('change', (e) => {
    currentModel = e.target.value;
});

searchInput?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const title = item.querySelector('span').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
});

// Configurar textareas
configureTextarea(document.querySelector('#chat-input'));
configureTextarea(document.querySelector('#welcome-input'));

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        toggleTheme();
    }
});
