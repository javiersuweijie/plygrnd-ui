#!/bin/sh

entrypoint=${ENTRYPOINT:-"app.py"}

if [ -z "$REPO" ]
then
    echo "[base] Repository not set, using basic gradle app"
else
    echo "[base] Cloning app $REPO" 
    git clone $REPO app
    cd app
fi

echo "[base] Installing dependencies"
pip install -r requirements.txt

echo "[base] Replacing launch command with our own proxy"

sed -i 's/\.launch\(.*\)/\.launch\(share=True, share_server_address=\"plygrnd\.live:7000\"\)/g' $entrypoint
sed -i 's/@spaces\.GPU\(.*\)//g' $entrypoint
sed -i 's/import spaces//g' $entrypoint

echo "[base] Launching app"
python -u $entrypoint
