## Akash Playground - A community-driven AI marketplace on Akash Cloud

Akash Playground is a community-driven marketplace, where users can upload, run, and monetize their AI models without worrying about the underlying infrastructure. This platform abstracts away the complexities of infrastructure management, allowing more users to access and utilize AI models for various use cases. The marketplace will be compatible with Hugging Face Spaces repositories, enabling seamless integration and collaboration.

<img width="1276" alt="image" src="https://github.com/javiersuweijie/plygrnd-ui/assets/3447315/c4b30e9c-351c-4a57-9900-38c1ae5a6e35">

## Motivation

The rapid development of AI models has led to a surge in innovative applications, but the lack of discoverability and ease of use hinders the growth of users in the AI ecosystem. Hugging Face Spaces has democratized the sharing and demonstration of AI models, but it doesn't provide a direct way for model builders to benefit from their work. Our platform addresses this gap by creating a marketplace that rewards model builders for their contributions.

## Key Features

1. **Model Upload and Deployment:** Developers can upload their AI models to the platform, which will be deployed on Akash Cloud's infrastructure. This is done through sharing a Github or HuggingFace repository that runs a Gradio application.
2. **Ease of Use**: Users who want access to the models can just launch a playground, in a single click, from all the public models that are indexed by the platform. 
3. **Infrastructure Abstraction:** The platform will abstract away the complexities of infrastructure management, allowing users to focus on model development and deployment.
4. **Monetization Mechanism:** Model builders will receive a share of the infrastructure costs when their models are used by others, providing a direct incentive for contributing to the ecosystem.
5. **Compatibility with Hugging Face Spaces:** The platform will be compatible with Hugging Face Spaces repositories, enabling seamless integration and collaboration.
6. **Community Engagement:** The platform will feature a community forum for discussion, feedback, and collaboration among users.

## Developing

Setting up the env variables in a `.env` file.

```
AKASH_KEY_NAME=plygrnd
AKASH_KEYRING_BACKEND=os
AKASH_NET="https://raw.githubusercontent.com/akash-network/net/main/mainnet"
AKASH_VERSION=v0.6.1
AKASH_CHAIN_ID=akashnet-2
AKASH_NODE=https://rpc.akashnet.net:443
AKASH_GAS_ADJUSTMENT=1.15
AKASH_GAS_PRICES=0.025uakt
AKASH_GAS=auto
AKASH_SIGN_MODE=amino-json

AKASH_MNEMONIC=
AKASH_ACCOUNT_ADDRESS=
AKASH_CERT=
AKASH_CERT_PUB_KEY=
AKASH_CERT_KEY=
SUPABASE_KEY=
```


Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev
```
