import wx
import requests
import json

# Configuração da API
API_URL = "http://localhost:11434/v1/chat/completions"
MODEL_NAME = "llama3.2"  # Alterado para o modelo correto

class ChatApp(wx.Frame):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Configurar a interface
        self.SetTitle("Chat com IA")
        self.SetSize((600, 400))
        panel = wx.Panel(self)
        
        vbox = wx.BoxSizer(wx.VERTICAL)
        
        self.history = wx.TextCtrl(panel, style=wx.TE_MULTILINE | wx.TE_READONLY, size=(-1, 300))
        vbox.Add(self.history, proportion=1, flag=wx.EXPAND | wx.ALL, border=5)
        
        hbox = wx.BoxSizer(wx.HORIZONTAL)
        self.input_box = wx.TextCtrl(panel, size=(-1, 30))
        hbox.Add(self.input_box, proportion=1, flag=wx.EXPAND | wx.ALL, border=5)
        
        send_btn = wx.Button(panel, label="Enviar")
        send_btn.Bind(wx.EVT_BUTTON, self.send_message)
        hbox.Add(send_btn, flag=wx.ALL, border=5)
        
        vbox.Add(hbox, flag=wx.EXPAND)
        panel.SetSizer(vbox)
        
        self.Show()

    def send_message(self, event):
        user_message = self.input_box.GetValue().strip()
        if not user_message:
            return

        # Exibir mensagem do usuário na interface
        self.history.AppendText(f"Você: {user_message}\n")
        self.input_box.Clear()
        
        # Enviar mensagem para a API
        try:
            response = self.query_ai(user_message)
            ai_response = response.get("choices", [{}])[0].get("message", {}).get("content", "Sem resposta.")
            self.history.AppendText(f"IA: {ai_response}\n")
        except Exception as e:
            self.history.AppendText(f"Erro: {str(e)}\n")
    
    def query_ai(self, message):
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
        return response.json()

if __name__ == "__main__":
    app = wx.App(False)
    frame = ChatApp(None)
    app.MainLoop()
