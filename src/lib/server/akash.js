import https from "https";
import WebSocket from 'ws';
import { AKASH_MNEMONIC, AKASH_CERT, AKASH_CERT_KEY, AKASH_CERT_PUB_KEY, AKASH_GAS, AKASH_GAS_ADJUSTMENT } from "$env/static/private";

import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet, Registry } from "cosmwasm";

// these imports should point to @akashnetwork/akashjs/build node module in your project
import { getRpc } from "@akashnetwork/akashjs/build/rpc";
import { SDL } from "@akashnetwork/akashjs/build/sdl";
import { getAkashTypeRegistry, Message } from "@akashnetwork/akashjs/build/stargate";
import { MsgCloseDeployment, MsgCreateDeployment } from "@akashnetwork/akash-api/akash/deployment/v1beta3";
import { MsgCreateLease } from "@akashnetwork/akash-api/akash/market/v1beta4";
import { BidID } from "@akashnetwork/akash-api/akash/market/v1beta3";
import { QueryProviderRequest, QueryClientImpl as QueryProviderClient } from "@akashnetwork/akash-api/akash/provider/v1beta3";
import { certificate } from "@akashnetwork/akashjs";

export const BID_OK = "ok";
export const BID_CLOSED = "closed";

// update this with your wallet mnemonic
const rpcEndpoint = "https://rpc.akashnet.net:443";
const apiEndpoint = "https://akash-api.polkachu.com"
const mnemonic = AKASH_MNEMONIC;
export function generateSDL(repo, entrypoint, need_gpu) {
    return SDL.fromString(`---
version: "2.0"
services:
  gradio-base:
    image: javiersuweijie/gradio-base:0.0.${need_gpu ? '5' : '3'}
    expose:
      - port: 80
        as: 80
        to:
          - global: true
    env:
      - ENTRYPOINT=${entrypoint}
      - REPO=${repo}
profiles:
  compute:
    gradio-base:
      resources:
        cpu:
          units: 4
        memory:
          size: 16Gi
        storage:
          - size: 50Gi
        ${need_gpu ? `gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
                  ram: 24Gi
                  interface: pcie` : ""}
  placement:
    dcloud:
      pricing:
        gradio-base:
          denom: uakt
          amount: 1000
deployment:
  gradio-base:
    dcloud:
      profile: gradio-base
      count: 1
`, 'beta3');
}

// type Deployment = {
//   id: {
//     owner: string;
//     dseq: number;
//   };
// };

// type Lease = {
//   id: {
//     owner: string;
//     dseq: number;
//     provider: string;
//     gseq: number;
//     oseq: number;
//   };
// };

// type Certificate = {
//   csr: string;
//   privateKey: string;
//   publicKey: string;
// };

// you can set this to a specific deployment sequence number to skip the deployment creation
const dseq = 0;

export async function loadPrerequisites() {
    const wallet = await walletFromMnemonic(mnemonic);
    const registry = [
        ['/akash.deployment.v1beta3.MsgCreateDeployment', MsgCreateDeployment],
        ['/akash.deployment.v1beta3.MsgCloseDeployment', MsgCloseDeployment],
        ['/akash.market.v1beta4.MsgCreateLease', MsgCreateLease],
    ]

    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, {
        registry: new Registry(registry)
    });

    const certificate = Buffer.from(AKASH_CERT, 'base64').toString("utf-8");
    const certPubKey = Buffer.from(AKASH_CERT_PUB_KEY, 'base64').toString("utf-8");
    const certKey = Buffer.from(AKASH_CERT_KEY, 'base64').toString("utf-8");

    return {
        wallet,
        client,
        certificate: {
            csr: certificate,
            privateKey: certKey,
            publicKey: certPubKey
        },
    };
}

async function walletFromMnemonic(mnemonic) {
    return DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "akash" });
}

export async function createDeployment(sdl, wallet, client) {
    const blockheight = await client.getHeight();
    const groups = sdl.groups();
    const accounts = await wallet.getAccounts();

    if (dseq != 0) {
        console.log("Skipping deployment creation...");
        return {
            id: {
                owner: accounts[0].address,
                dseq: dseq
            },
            groups: groups,
            deposit: {
                denom: "uakt",
                amount: "500000"
            },
            version: await sdl.manifestVersion(),
            depositor: accounts[0].address
        };
    }

    const deployment = {
        id: {
            owner: accounts[0].address,
            dseq: blockheight
        },
        groups: groups,
        deposit: {
            denom: "uakt",
            amount: "500000"
        },
        version: await sdl.manifestVersion(),
        depositor: accounts[0].address
    };

    const msg = {
        typeUrl: "/akash.deployment.v1beta3.MsgCreateDeployment",
        value: MsgCreateDeployment.fromPartial(deployment)
    };

    let gas = Math.floor(await client.simulate(accounts[0].address, [msg]) * 1.15)
    const fee = {
        amount: [
            {
                denom: "uakt",
                amount: "" + Math.ceil(gas * 0.025)
            }
        ],
        gas: "" + gas,
    };
    console.log(fee)

    const tx = await client.signAndBroadcast(accounts[0].address, [msg], fee, "create deployment");

    if (tx.code !== undefined && tx.code === 0) {
        return deployment;
    }

    throw new Error(`Could not create deployment: ${tx.rawLog} `);
}

export async function fetchBid(dseq, owner) {
    const rpc = await getRpc(rpcEndpoint);
    const client = new QueryMarketClient(rpc);
    const request = QueryBidsRequest.fromPartial({
        filters: {
            owner: owner,
            dseq: dseq
        }
    });
    request.$type = "/akash.market.v1beta4.QueryBidsRequest";

    const startTime = Date.now();
    const timeout = 1000 * 60 * 5;

    while (Date.now() - startTime < timeout) {
        console.log("Fetching bids...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        const bids = await client.Bids(request);

        if (bids.bids.length > 0 && bids.bids[0].bid !== undefined) {
            console.log("Bid fetched!");
            return bids.bids[1].bid;
        }

        // wait 1 second before trying again
    }

    throw new Error(`Could not fetch bid for deployment ${dseq}.Timeout reached.`);
}

export async function fetchBidApi(dseq, owner) {
    const startTime = Date.now();
    const timeout = 1000 * 60 * 5;

    const url = `${apiEndpoint}/akash/market/v1beta4/bids/list?filters.owner=${owner}&filters.dseq=${dseq}`;
    while (Date.now() - startTime < timeout) {
        console.log("Fetching bids...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        const response = await fetch(url);
        const bids = await response.json();

        if (bids.bids.length > 0 && bids.bids[0].bid !== undefined) {
            console.log(bids.bids.length, "bids fetched!",);
            let bestBid = bids.bids[0].bid;
            for (const { bid } of bids.bids) {
                if (+bestBid.price.amount > +bid.price.amount) {
                    bestBid = bid;
                }
            }
            return bestBid;
        }


        // wait 1 second before trying again
    }
    throw new Error(`Could not fetch bid for deployment ${dseq}.Timeout reached.`);
}

export async function createLease(deployment, wallet, client) {
    const {
        id: { dseq, owner }
    } = deployment;

    // wait 2s for bids to come in
    await new Promise(resolve => setTimeout(resolve, 2000));

    const bid = await fetchBidApi(dseq, owner);
    console.log(bid);
    const accounts = await wallet.getAccounts();

    const bidId = bid.bidId || bid.bid_id;

    if (bidId === undefined) {
        throw new Error("Bid ID is undefined");
    }

    if (bid.state === "closed") {
        return {
            id: bidId,
            status: BID_CLOSED
        }
    }

    const lease = {
        bidId
    };

    const msg = {
        typeUrl: `/${MsgCreateLease.$type}`,
        value: MsgCreateLease.fromPartial(lease)
    };

    let gas = Math.floor(await client.simulate(accounts[0].address, [msg]) * 1.5);
    const fee = {
        amount: [
            {
                denom: "uakt",
                amount: "" + Math.ceil(gas * 0.025)
            }
        ],
        gas: "" + gas,
    };
    console.log(fee)

    const tx = await client.signAndBroadcast(accounts[0].address, [msg], fee, "create lease");

    if (tx.code !== undefined && tx.code === 0) {
        return {
            id: bidId,
            status: BID_OK,
            price : bid.price
        };
    }

    throw new Error(`Could not create lease: ${tx.rawLog} `);
}

async function queryLeaseStatus(lease, providerUri, certificate) {
    const id = lease.id;

    if (id === undefined) {
        throw new Error("Lease ID is undefined");
    }

    const leasePath = `/lease/${id.dseq}/${id.gseq}/${id.oseq}/status`;

    const agent = new https.Agent({
        cert: certificate.csr,
        key: certificate.privateKey,
        rejectUnauthorized: false
    });

    const uri = new URL(providerUri);

    // <{ services: Record<string, { uris: string[] }> }>
    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: uri.hostname,
                port: uri.port,
                path: leasePath,
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                agent: agent
            },
            res => {
                if (res.statusCode !== 200) {
                    return reject(`Could not query lease status: ${res.statusCode}`);
                }

                let data = "";

                res.on("data", chunk => (data += chunk));
                res.on("end", () => resolve(JSON.parse(data)));
            }
        );

        req.on("error", reject);
        req.end();
    });
}

export async function sendManifest(sdl, lease, wallet, certificate /*: { csr: string; privateKey: string; publicKey: string }*/) {
    if (lease.id === undefined) {
        throw new Error("Lease ID is undefined");
    }

    const { dseq, provider } = lease.id;
    const rpc = await getRpc(rpcEndpoint);
    const client = new QueryProviderClient(rpc);
    const request = QueryProviderRequest.fromPartial({
        owner: provider
    });

    const tx = await client.Provider(request);

    if (tx.provider === undefined) {
        throw new Error(`Could not find provider ${provider}`);
    }

    const providerInfo = tx.provider;
    const manifest = sdl.manifestSortedJSON();
    const path = `/deployment/${dseq}/manifest`;

    const uri = new URL(providerInfo.hostUri);
    const agent = new https.Agent({
        cert: certificate.csr,
        key: certificate.privateKey,
        rejectUnauthorized: false
    });

    // console.log("agent", agent);

    await new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: uri.hostname,
                port: uri.port,
                path: path,
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "Content-Length": manifest.length
                },
                agent: agent
            },
            res => {
                res.on("error", reject);

                res.on("data", chunk => {
                    console.log("Response:", chunk.toString());
                });

                if (res.statusCode !== 200) {
                    return reject(`Could not send manifest: ${res.statusCode} ${res.statusMessage}`);
                }

                resolve("ok");
            }
        );

        req.on("error", reject);
        req.write(manifest);
        req.end();
    });

    const startTime = Date.now();
    const timeout = 1000 * 60 * 10;

    while (Date.now() - startTime < timeout) {
        console.log("Waiting for deployment to start...");
        const status = await queryLeaseStatus(lease, providerInfo.hostUri, certificate).catch(err => {
            if (err.includes("Could not query lease status: 404")) {
                return undefined;
            }

            throw err;
        });

        if (status) {
            for (const [name, service] of Object.entries(status.services)) {
                if (service.uris) {
                    console.log(`Service ${name} is available at:`, service.uris[0]);
                    return;
                }
            }
        }

        // wait 1 second before trying again
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    throw new Error(`Could not start deployment. Timeout reached.`);
}

export async function getLogs(lease, certificate) {
    if (lease.id === undefined) {
        throw new Error("Lease ID is undefined");
    }

    const { dseq, provider, gseq, oseq } = lease.id;
    const rpc = await getRpc(rpcEndpoint);
    const client = new QueryProviderClient(rpc);
    const request = QueryProviderRequest.fromPartial({
        owner: provider
    });

    const tx = await client.Provider(request);

    if (tx.provider === undefined) {
        throw new Error(`Could not find provider ${provider}`);
    }

    const providerInfo = tx.provider;
    const path = `/lease/${dseq}/${gseq}/${oseq}/logs`;

    const uri = new URL(providerInfo.hostUri);

    const ws = new WebSocket(`wss://${uri.hostname}:${uri.port}${path}?tail=50`, {
        cert: certificate.csr,
        key: certificate.privateKey,
        rejectUnauthorized: false,
    })

    const logs = [];

    ws.on("message", function incoming(data) {
        logs.push(JSON.parse(Buffer.from(data).toString()).message || "")
    });

    ws.on("error", event => {
        console.error("Websocket received an error", event);
    });

    ws.on("close", event => {
        console.info("Websocket was closed", event);
    });

    await new Promise(resolve => {
        ws.on("open", function open() {
            console.log("connected");
            setTimeout(() => {
                console.log("closing after delay")
                resolve();
            }, 5000)
        });
    })
    ws.close();

    return logs;
}

export async function closeDeployment(deployment, wallet, client) {
    const accounts = await wallet.getAccounts();
    const msg = {
        typeUrl: `/akash.deployment.v1beta3.MsgCloseDeployment`,
        value: MsgCloseDeployment.fromPartial(deployment)
    }; 

    let gas = Math.floor(await client.simulate(accounts[0].address, [msg]) * 1.15);
    const fee = {
        amount: [
            {
                denom: "uakt",
                amount: "" + Math.ceil(gas * 0.025)
            }
        ],
        gas: "" + gas,
    };
    console.log(fee)

    const tx = await client.signAndBroadcast(accounts[0].address, [msg], fee, "close deployment");
    console.log(tx);

    if (tx.code !== undefined && tx.code === 0) {
        return
    }

    throw new Error(`Could not close deployment: ${tx.rawLog} `);
}