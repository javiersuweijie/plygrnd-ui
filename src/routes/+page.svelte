<script>
    import { onMount } from 'svelte';
    let messages = [
        "Generate images",
        "Chat with an LLM",
        "Generate text",
        "Create beautiful QR codes",
        "Write a story",
        "Generate a logo",
        "Create anything..."
    ]
    let i = 0;
    onMount(() => {
        console.log("Page mounted");
        setInterval(() => {
            i = (i + 1) % messages.length;
        }, 3000);
    })
</script>

<style>
.typewriter {
  overflow: hidden; /* Ensures the content is not revealed until the animation */
  white-space: nowrap; /* Keeps the content on a single line */
  margin: 0 auto; /* Gives that scrolling effect as the typing happens */
  animation: 
    typing 3.5s steps(50, end)
}

/* The typing effect */
@keyframes typing {
  from { width: 0 }
  to { width: 100% }
}

</style>

<div class="flex flex-1 flex-col justify-center items-center">
    <h1 class="text-4xl font-bold">Welcome to Akash Playground</h1>
    <p class="text-lg">Your personal space for AI experimentation</p>

    <div class="mt-8"></div>
    {#key i}
        <h1 class="text-4xl font-bold typewriter w-1/2 text-center">{messages[i]}</h1>
    {/key}
</div>