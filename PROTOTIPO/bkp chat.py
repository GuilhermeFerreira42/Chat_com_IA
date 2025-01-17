import wx
import requests
import json
import threading
import time

# Configuração da API
API_URL = "http://localhost:11434/v1/chat/completions"
MODEL_NAME = "gemma2:2b"  # Alterado para o modelo correto

class ChatApp(wx.Frame):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Configurar a interface
        self.SetTitle("Chat com IA")
        self.SetSize((600, 400))
        panel = wx.Panel(self)

        vbox = wx.BoxSizer(wx.VERTICAL)

        # Substituir painel simples por ScrolledWindow
        self.history = wx.ScrolledWindow(panel, size=(-1, 300), style=wx.VSCROLL | wx.ALWAYS_SHOW_SB)
        self.history.SetBackgroundColour(wx.Colour(240, 240, 240))  # Cor de fundo para o painel
        self.history.SetScrollRate(5, 5)
        self.history_sizer = wx.BoxSizer(wx.VERTICAL)
        self.history.SetSizer(self.history_sizer)
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

    def add_message(self, message, is_user=True, update_last=False):
        """Adiciona uma mensagem ao painel de histórico."""
        if update_last and self.history_sizer.GetChildren():
            # Atualiza o último painel em vez de criar um novo
            last_panel = self.history_sizer.GetChildren()[-1].GetWindow()
            last_text = last_panel.GetChildren()[0]
            last_text.SetLabel(message)
            last_text.Wrap(self.GetSize()[0] - 50)
            self.history.Layout()
            self.history.Scroll(-1, self.history.GetVirtualSize()[1])
            return

        message_panel = wx.Panel(self.history, size=(-1, -1))
        message_sizer = wx.BoxSizer(wx.HORIZONTAL)

        # Estilo e cores diferentes para usuário e IA
        bg_color = wx.Colour(200, 230, 201) if is_user else wx.Colour(187, 222, 251)
        text_color = wx.Colour(0, 0, 0)

        message_text = wx.StaticText(message_panel, label=message, style=wx.ALIGN_LEFT)
        message_text.Wrap(self.GetSize()[0] - 50)  # Ajuste de largura para o texto
        message_text.SetBackgroundColour(bg_color)
        message_text.SetForegroundColour(text_color)

        # Adicionar funcionalidade de cópia
        message_text.Bind(wx.EVT_RIGHT_DOWN, self.copy_message)

        # Ajustar alinhamento baseado no tipo de mensagem
        if is_user:
            message_sizer.AddStretchSpacer()
            message_sizer.Add(message_text, flag=wx.EXPAND | wx.ALL, border=5)
        else:
            message_sizer.Add(message_text, flag=wx.EXPAND | wx.ALL, border=5)
            message_sizer.AddStretchSpacer()

        message_panel.SetSizer(message_sizer)
        self.history_sizer.Add(message_panel, flag=wx.EXPAND | wx.ALL, border=5)
        self.history.Layout()
        self.history.Scroll(-1, self.history.GetVirtualSize()[1])

    def send_message(self, event):
        user_message = self.input_box.GetValue().strip()
        if not user_message:
            return

        # Exibir mensagem do usuário na interface
        self.add_message(f"Você: {user_message}", is_user=True)
        self.input_box.Clear()

        # Enviar mensagem para a API em uma thread separada
        thread = threading.Thread(target=self.handle_ai_response, args=(user_message,))
        thread.start()

    def handle_ai_response(self, user_message):
        try:
            response = self.query_ai(user_message)
            ai_response = response.get("choices", [{}])[0].get("message", {}).get("content", "Sem resposta.")
            self.display_dynamic_ai_message(ai_response)
        except Exception as e:
            wx.CallAfter(self.add_message, f"Erro: {str(e)}", is_user=False)

    def display_dynamic_ai_message(self, full_message):
        """Exibe a mensagem da IA gradualmente, simulando o carregamento."""
        current_message = "IA: "
        wx.CallAfter(self.add_message, current_message, is_user=False)

        for char in full_message:
            current_message += char
            wx.CallAfter(self.add_message, current_message, is_user=False, update_last=True)
            time.sleep(0.02)  # Simula a geração gradual de texto

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

    def copy_message(self, event):
        """Permite copiar o texto da mensagem clicada com o botão direito."""
        widget = event.GetEventObject()
        if isinstance(widget, wx.StaticText):
            text_to_copy = widget.GetLabel()
            if wx.TheClipboard.Open():
                wx.TheClipboard.SetData(wx.TextDataObject(text_to_copy))
                wx.TheClipboard.Close()

if __name__ == "__main__":
    app = wx.App(False)
    frame = ChatApp(None)
    app.MainLoop()
