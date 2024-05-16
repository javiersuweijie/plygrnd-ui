import gradio as gr
import requests

def greet(name, intensity):
    return "Hello, " + name + "!" * int(intensity)

print(requests.get("http://google.com"))

demo = gr.Interface(
    fn=greet,
    inputs=["text", "slider"],
    outputs=["text"],
)

demo.launch(share=True, share_server_address="plygrnd.live:7000")
