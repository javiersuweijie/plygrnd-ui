FROM amd64/python:3.10-slim

RUN apt-get -y update && apt-get -y install curl git


WORKDIR /usr/src/app
COPY . .
RUN pip install --no-cache-dir gradio torch

#RUN curl -o /usr/local/lib/python3.8/site-packages/gradio/frpc_linux_aarch64_v0.2 -L https://cdn-media.huggingface.co/frpc-gradio-0.2/frpc_linux_aarch64
ENV ENTRYPOINT="app.py"
#ENV REPO="https://github.com/arora-r/gradio-example.git"

CMD ["sh", "entrypoint.sh"]
