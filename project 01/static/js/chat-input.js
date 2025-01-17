class ChatInput {
  constructor(inputElement, dropdownContainer) {
    this.input = inputElement;
    this.dropdown = dropdownContainer;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.input.addEventListener('input', () => this.handleInput());
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    document.addEventListener('click', (e) => this.handleClickOutside(e));
  }

  handleInput() {
    const text = this.input.value;
    if (text.startsWith('/')) {
      const suggestions = filterCommands(text);
      this.showSuggestions(suggestions);
    } else {
      this.hideSuggestions();
    }
  }

  handleKeydown(e) {
    if (e.key === 'Tab' && this.dropdown.classList.contains('active')) {
      e.preventDefault();
      const suggestions = this.dropdown.querySelectorAll('.command-item');
      if (suggestions.length > 0) {
        const command = suggestions[0].dataset.command;
        this.selectCommand(command);
      }
    }
  }

  handleClickOutside(e) {
    if (!this.dropdown.contains(e.target) && e.target !== this.input) {
      this.hideSuggestions();
    }
  }

  showSuggestions(suggestions) {
    this.dropdown.innerHTML = suggestions
      .map(({ command, description }) => `
        <div class="command-item" data-command="${command}">
          <span class="command-name">${command}</span>
          <span class="command-description">${description}</span>
        </div>
      `)
      .join('');

    this.dropdown.classList.add('active');

    // Adiciona listeners para os itens
    this.dropdown.querySelectorAll('.command-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectCommand(item.dataset.command);
      });
    });
  }

  hideSuggestions() {
    this.dropdown.classList.remove('active');
  }

  selectCommand(command) {
    this.input.value = command;
    this.input.focus();
    this.hideSuggestions();
  }
}