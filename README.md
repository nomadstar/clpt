# CLPNY Payment Gateway v1 (minimal)

Simple Node.js + TypeScript service that exposes endpoints to create merchants and payment intents for CLPNY, and a webhook endpoint to mark intents as paid when a blockchain event is observed.

Prereqs
- Node.js (LTS)
- npm

Install

```bash
npm install
npx prisma generate
```

Run

```bash
npm run dev
```

Apply DB migrations (first time)

Set `DATABASE_URL` in `.env` (example `file:./dev.db`) then:

```bash
npx prisma migrate dev --name init
```

API examples

Create merchant:

```bash
curl -X POST http://localhost:3000/merchants -H 'Content-Type: application/json' -d '{"name":"Shop","clpnyReceivingAddress":"0xabc...","callbackUrl":"http://merchant.local/cb"}'
```

Create payment intent:

```bash
curl -X POST http://localhost:3000/payment-intents -H 'Content-Type: application/json' -d '{"merchantId":"<id>","amount":"1000","description":"Order 123","expiresInSeconds":300}'
```

Simulate blockchain webhook (paid):

```bash
curl -X POST http://localhost:3000/webhooks/blockchain -H 'Content-Type: application/json' -d '{"txHash":"0x1","from":"0xfoo","to":"0xabc...","amount":"1000","paymentIntentId":"<id>"}'
```

Check intent:

```bash
curl http://localhost:3000/payment-intents/<id>
```
# Chilean Penny (CLPNY)
Chilean Penny stablecoin (symbol: CLPNY). Backed by collateral and designed for payments and integrations with financial infrastructure.

Chilean Penny (CLPNY) is intended as a Chilean stablecoin for CLP-denominated digital payments. It aims to provide institutional-grade controls, auditability and integrations with payment rails and reporting formats.

## Contracts
### Goerli testnet
- PriceFeed (USDC/CLP): [0xeEfF5Ab40897377306b7C3D39d4e073883D74B99](https://goerli.etherscan.io/address/0xeEfF5Ab40897377306b7C3D39d4e073883D74B99)
- CLPNY: [0xC4aB3ad279e8fF93A8aA853B9358B0e87F35f9d6](https://goerli.etherscan.io/token/0xC4aB3ad279e8fF93A8aA853B9358B0e87F35f9d6)
