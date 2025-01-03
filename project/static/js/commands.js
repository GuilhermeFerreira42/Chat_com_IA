// Comandos disponíveis
const commands = {
  '/resumo': {
    description: 'Ativa o modo de resumo de texto',
    handler: () => {
      chatState.setMode('summary');
      showMessage('Modo resumo ativado. Cole seu texto para resumir.', 'system');
    }
  },
  '/help': {
    description: 'Mostra ajuda sobre comandos disponíveis',
    handler: () => {
      showCommandsList();
    }
  },
  '/settings': {
    description: 'Configurações do chat',
    handler: () => {
      showMessage('Configurações ainda não implementadas.', 'system');
    }
  },
  '/about': {
    description: 'Informações sobre o bot',
    handler: () => {
      showMessage('Chat Assistant v1.0 - Powered by Gemma AI', 'system');
    }
  },
  '/feedback': {
    description: 'Enviar feedback',
    handler: () => {
      showMessage('Sistema de feedback em desenvolvimento.', 'system');
    }
  },
  '/exit': {
    description: 'Volta ao modo normal de chat',
    handler: () => {
      chatState.setMode('normal');
      showMessage('Modo normal ativado.', 'system');
    }
  }
};

function handleCommand(text) {
  if (!text.startsWith('/')) return false;
  
  const command = commands[text];
  if (command) {
    command.handler();
    return true;
  }
  
  return false;
}

function filterCommands(prefix) {
  return Object.entries(commands)
    .filter(([cmd]) => cmd.startsWith(prefix))
    .map(([cmd, info]) => ({
      command: cmd,
      description: info.description
    }));
}

function showCommandsList() {
  const commandsList = Object.entries(commands)
    .map(([cmd, info]) => `${cmd}: ${info.description}`)
    .join('\n');
    
  showMessage(`Comandos disponíveis:\n${commandsList}`, 'system');
}