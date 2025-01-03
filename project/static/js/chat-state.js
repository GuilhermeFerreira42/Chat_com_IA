// Gerenciamento do estado do chat
const chatState = {
  mode: 'normal', // 'normal' ou 'summary'
  currentConversationId: null,
  
  setMode(newMode) {
    this.mode = newMode;
  },
  
  setConversationId(id) {
    this.currentConversationId = id;
  },
  
  isInSummaryMode() {
    return this.mode === 'summary';
  }
};