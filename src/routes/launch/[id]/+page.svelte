<script>
    import { Frown } from 'lucide-svelte';
    import { LoaderCircle } from 'lucide-svelte';

    import Button from '$lib/components/ui/button/button.svelte';
    import { Progress } from "$lib/components/ui/progress";
    import { onMount } from 'svelte';

    export let data;
    const {supabase, user, launch, id} = data;
    let {state} = data;
    let showLogs = false;
    let isStopping = false;

    const URL_REGEX = /(https?:\/\/[^\s]+\.plygrnd\.live)/;

    const STEPS = {
        CREATING: 1,
        LAUNCHING: 2,
        DOWNLOADING_DEPENDENCIES: 3,
        DEPENDENCIES_INSTALLED: 4,
        APPLICATION_LAUNCHING: 5,
        RUNNING: 6,
    }

    const STEPS_TITLE = {
        CREATING: "Looking for bids and creating a lease",
        LAUNCHING: "Launching your container",
        DOWNLOADING_DEPENDENCIES: "Downloading dependencies",
        DEPENDENCIES_INSTALLED: "Dependencies installed",
        APPLICATION_LAUNCHING: "Running your application",
        RUNNING: "Your application is running",
    }

    onMount(async () => {
        console.log("checking launch and deploy if needed")
        const deployment = {
            id: {
                owner: launch.owner,
                dseq: launch.dseq
            }
        }
        // let i = 0;
        // setInterval(() => {
        //     state.status = Object.keys(STEPS)[i % Object.keys(STEPS).length];
        //     i++;
        // }, 2000)

        switch (launch.status) {
            case "CREATING":
                console.log("launching deployment");
                const res = await fetch("/api/launch", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: launch.dseq
                })
                });
                const body = await res.json();
                console.log(body);
                if (body.error) {
                    console.log(body.error);
                    redirect(303, '/error');
                }
                state.status = body.status;

            case "LAUNCHING":
                console.log("waiting for deployment to be ready");
                while (true) {
                    const res = await fetch("/api/logs/" + launch.dseq);
                    const logs = await res.json();
                    state.logs = logs;

                    let lastState = state.status;
                    for (const log of logs) {
                        let match = log.match(URL_REGEX);
                        if (match) {
                            console.log("url found", match[0])
                            await supabase.from('launches').update({status: "RUNNING", url: match[0]}).eq('dseq', deployment.id.dseq);
                            state.status = "RUNNING"
                            state.url = match[0];
                            console.log("launch updated to running");
                            return resolve()
                        }
                        if (log.includes("Launching app")) {
                            lastState = "APPLICATION_LAUNCHING"
                        }
                        if (log.includes("Successfully installed")) {
                            lastState = "DEPENDENCIES_INSTALLED"
                        }
                        if (log.includes("Collecting")) {
                            lastState = "DOWNLOADING_DEPENDENCIES"
                        }
                    }
                    console.log("last state", lastState)
                    state.status = lastState;
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
            case "RUNNING":
                console.log("deployment running");
                break;
            case "CLOSED":
                console.log("deployment closed");
                break;
        }
    });

    async function close() {
        console.log("closing launch");
        isStopping = true;
        await fetch("/api/close", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: launch.dseq
            })
        });
        state.status = "CLOSED";
    }

    function toggleLogs() {
        showLogs = !showLogs;
    }

//     state.logs = [
//   "  'Requirement already satisfied: rpds-py>=0.7.1 in /usr/local/lib/python3.9/site-packages (from jsonschema>=3.0->altair<6.0,>=4.2.0->gradio->-r requirements.txt (line 1)) (0.18.0)'",
//   "  'Requirement already satisfied: referencing>=0.28.4 in /usr/local/lib/python3.9/site-packages (from jsonschema>=3.0->altair<6.0,>=4.2.0->gradio->-r requirements.txt (line 1)) (0.34.0)'",
//   "  'Requirement already satisfied: jsonschema-specifications>=2023.03.6 in /usr/local/lib/python3.9/site-packages (from jsonschema>=3.0->altair<6.0,>=4.2.0->gradio->-r requirements.txt (line 1)) (2023.12.1)'",
//   "  'Requirement already satisfied: attrs>=22.2.0 in /usr/local/lib/python3.9/site-packages (from jsonschema>=3.0->altair<6.0,>=4.2.0->gradio->-r requirements.txt (line 1)) (23.2.0)'",
//   "  'Requirement already satisfied: six>=1.5 in /usr/local/lib/python3.9/site-packages (from python-dateutil>=2.7->matplotlib~=3.0->gradio->-r requirements.txt (line 1)) (1.16.0)'",
//   "  'Requirement already satisfied: markdown-it-py>=2.2.0 in /usr/local/lib/python3.9/site-packages (from rich>=10.11.0->typer<1.0,>=0.12->gradio->-r requirements.txt (line 1)) (3.0.0)'",
//   "  'Requirement already satisfied: pygments<3.0.0,>=2.13.0 in /usr/local/lib/python3.9/site-packages (from rich>=10.11.0->typer<1.0,>=0.12->gradio->-r requirements.txt (line 1)) (2.17.2)'",
//   "  'Requirement already satisfied: exceptiongroup>=1.0.2 in /usr/local/lib/python3.9/site-packages (from anyio->httpx>=0.24.1->gradio->-r requirements.txt (line 1)) (1.2.1)'",
//   "  'Requirement already satisfied: mdurl~=0.1 in /usr/local/lib/python3.9/site-packages (from markdown-it-py>=2.2.0->rich>=10.11.0->typer<1.0,>=0.12->gradio->-r requirements.txt (line 1)) (0.1.2)'",
//   "  'Installing collected packages: mpmath, triton, sympy, safetensors, regex, nvidia-nvtx-cu12, nvidia-nvjitlink-cu12, nvidia-nccl-cu12, nvidia-curand-cu12, nvidia-cufft-cu12, nvidia-cuda-runtime-cu12, nvidia-cuda-nvrtc-cu12, nvidia-cuda-cupti-cu12, nvidia-cublas-cu12, networkx, nvidia-cusparse-cu12, nvidia-cudnn-cu12, tokenizers, nvidia-cusolver-cu12, transformers, torch, torchvision'",
//   "  'Successfully installed mpmath-1.3.0 networkx-3.2.1 nvidia-cublas-cu12-12.1.3.1 nvidia-cuda-cupti-cu12-12.1.105 nvidia-cuda-nvrtc-cu12-12.1.105 nvidia-cuda-runtime-cu12-12.1.105 nvidia-cudnn-cu12-8.9.2.26 nvidia-cufft-cu12-11.0.2.54 nvidia-curand-cu12-10.3.2.106 nvidia-cusolver-cu12-11.4.5.107 nvidia-cusparse-cu12-12.1.0.106 nvidia-nccl-cu12-2.20.5 nvidia-nvjitlink-cu12-12.4.127 nvidia-nvtx-cu12-12.1.105 regex-2024.5.10 safetensors-0.4.3 sympy-1.12 tokenizers-0.19.1 torch-2.3.0 torchvision-0.18.0 transformers-4.40.2 triton-2.3.0'",
//   `  "WARNING: Running pip as the 'root' user can result in broken permissions and conflicting behaviour with the system package manager. It is recommended to use a virtual environment instead: https://pip.pypa.io/warnings/venv",`,
//   "  ''",
//   "  '[notice] A new release of pip is available: 23.0.1 -> 24.0'",
//   "  '[notice] To update, run: pip install --upgrade pip'",
//   "  '[base] Replacing launch command with our own proxy'",
//   "  '[base] Launching app'",
//   "  'Running on local URL:  http://127.0.0.1:7860'",
//   "  'IMPORTANT: You are using gradio version 4.27.0, however version 4.29.0 is available, please upgrade.'",
//   "  '--------'",
//   "  'Running on public URL: http://9aa11c01d8a45b9110.plygrnd.live'",
//   "  ''",
//   "  'This share link expires in 72 hours. For free permanent hosting and GPU upgrades, run `gradio deploy` from Terminal to deploy to Spaces (https://huggingface.co/spaces)'"
// ]
</script>

<style>
:root{
    --cup-color: solid rgb(51, 65, 85);
    --cup-height: 140px;
    --cup-width: 180px;
    --cup-border: 10px;
    --handle-height: 70px;
    --handle-width: 40px;
}

.loading-screen{
    /* width: calc(var(--cup-width) + var(--handle-width) + var(--cup-border)*3);
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%); */
}

.cup {
    height: var(--cup-height);
    width: var(--cup-width);
    border: var(--cup-border) var(--cup-color);
    border-radius: 0px 0px 70px 70px;
    background: url("https://i.imgur.com/XVzRObX.png");
    background-repeat: repeat-x;
    background-position: 0px 140px;
    animation: fill 4.5s infinite;
}


@keyframes fill {
    0% {
        background-position: 0px 140px;
    }

    20% {
        background-position: -450px 100px;
    }

    40% {
        background-position: -900px 50px;
    }

    80% {
        background-position: -1350px -40px;
    }
}

.handle {
    height: var(--handle-height);
    width: var(--handle-width);
    background-color: transparent;
    border: var(--cup-border) var(--cup-color);
    position: relative;
    left: 160px;
    top: 2px;
    border-radius: 0px 25px 80px 0px;
}
</style>

{#if (state.status === "RUNNING" && state.url)}
<div class="flex w-full flex-1 flex-col items-center justify-start">
    <Button class="bg-red-700" on:click={close} disabled={isStopping}>
        Stop Playground
    {#if isStopping}
        <LoaderCircle class="animate-spin ml-1"></LoaderCircle>
    {/if}
    </Button>
    <iframe src={state.url} width="100%" height="700px" class="mt-4" title="application"></iframe>
</div>
{:else if state.status === "CLOSED"}
<div class="flex flex-1 w-full flex-col justify-center items-center">
    <Frown size={100}/>
    <div class="text-2xl mt-4 text-primary font-bold">Your playground has stopped</div>
</div>
{:else}
<div class="flex w-full flex-1 flex-col justify-center items-center">
    <div class="cup">
        <div class="handle" />
    </div>
    <div class="text-xl mt-4 text-primary">Grab a cup of coffeee as we load your playground</div>
    <div class="text-2xl mt-4 text-primary font-bold">{STEPS_TITLE[state.status]}</div>
    <Progress value={STEPS[state.status]} max={Object.keys(STEPS).length} class="w-[60%] mt-4"/>
    {#if state.logs.length > 0}
        <Button class="mt-4" on:click={toggleLogs}>{showLogs ? "Close logs" : "View logs"}</Button>
    {/if}
    <Button class="bg-red-700 mt-4" on:click={close}>Stop Playground</Button>
    {#if showLogs}
        <code class='max-h-80 overflow-y-auto bg-slate-700 pl-4 pr-4 mt-4' on:change={(e) => console.log(e)}>
            {#if state.logs}
                {#each state.logs as log}
                    <div class="text-sm mb-2 text-white">{log}</div>
                {/each}
            {/if}
        </code>
    {/if}
</div>
{/if}
