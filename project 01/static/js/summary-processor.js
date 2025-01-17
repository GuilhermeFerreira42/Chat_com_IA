// Processamento de resumos
const WORDS_PER_CHUNK = 300;

async function processSummaryText(text) {
  const chunks = splitTextIntoChunks(text, WORDS_PER_CHUNK);
  const summaries = [];
  
  for (const chunk of chunks) {
    const summary = await sendForSummary(chunk);
    summaries.push(summary);
    
    // Mostra cada resumo conforme é processado
    showMessage(summary, 'assistant');
  }
  
  return summaries.join('\n\n');
}

function splitTextIntoChunks(text, wordsPerChunk) {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  
  return chunks;
}

async function sendForSummary(text) {
  const instructions = `Quero que você responda somente em Português do Brasil. Por favor, leia a parte da transcrição do vídeo e siga as instruções que lhe dou abaixo. Se as instruções não forem especificadas ou não estiverem claras, simplesmente resuma a transcrição para mim em um único parágrafo.

[INSTRUCTIONS]: Por favor, faça um resumo completo e detalhado, com explicações dos pontos principais, enumerando os tópicos mais importantes e expandindo em cada um deles de forma a não omitir nenhuma informação relevante do texto original. Certifique-se de PONTUAR e explicar OS pontos discutidos.`;

  const response = await fetch('/send_message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      message: text,
      instructions,
      mode: 'summary',
      conversation_id: chatState.currentConversationId
    })
  });
  
  const data = await response.json();
  return data.response;
}