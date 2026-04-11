Read https://paywithlocus.com/SKILL.md and follow the instructions to set up Locus


API_KEY=claw_dev_X4RnLRPLv72so_0qRnqDUXyadU_C4xpe
MY_EMAIL: icodes001@gmail.com

curl -X POST https://api.paywithlocus.com/api/gift-code-requests \
  -H "Content-Type: application/json" \
  -d '{
    "email": "icodes001@gmail.com",
    "reason": "Mercent to consumer marketplace",
    "requestedAmountUsdc": 20
  }'

## Project Title
**PerUse AI Marketplace** — A pay-per-use AI tool marketplace powered by Locus

---

## Role
You are a senior full-stack engineer. Build a production-quality MVP for a **pay-per-use AI tool marketplace** where creators publish specialized AI tools and users pay **per run in USDC**. The platform must be designed around **Locus-native capabilities**: wrapped APIs, wallet-backed execution, checkout-based payment flow, and deployable backend services.

---

## Product Summary

Build a web platform with 3 roles:

- **Users**: browse tools, submit inputs, pay per use, receive results
- **Creators**: publish tools with structured input fields, prompt/workflow configuration, pricing, and analytics
- **Admin**: review and approve creator-submitted tools, monitor runs, payments, and execution failures

This is **not** a subscription SaaS. It is a marketplace of AI mini-tools where each tool has:

- title
- description
- category
- structured input schema
- output format
- provider/model configuration
- price per run
- creator attribution
- status: `draft`, `pending`, `approved`, `rejected`

Execution for MVP must be **platform-executed only**. Do **not** support arbitrary third-party hosted endpoints in V1.

---

## Primary Goal

Build an PRODUCT called **PerUse AI Marketplace**.

It should allow:

1. A creator to create a prompt-powered or workflow-powered tool
2. Admin to approve the tool
3. A user to browse approved tools
4. A user to pay for a run using a Locus-compatible payment flow
5. The backend to execute the tool using Locus wrapped APIs
6. The user to receive the result
7. The platform to track:
   - execution cost
   - price charged
   - creator share
   - platform fee
   - run history

---

## Core Features To Implement

The agent **must implement these as actual working marketplace features**, not as placeholders:
Must have a very matured dark interactive UI background. Make good use of transparent glass effect in the project.

1. **Summarize PDF**
2. **Review Code**
3. **Research Topic**

These must be:

- visible on the marketplace homepage
- listed in browse/search
- have dedicated tool detail pages
- fully runnable end-to-end
- wired into payment flow
- wired into execution flow
- included in seed/demo content

---

## Required Tech Stack

### Frontend
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui for components
- react-hook-form + zod for forms

### Backend
Use Next.js route handlers for MVP unless separation becomes necessary. Structure code cleanly so backend logic can be extracted later.

### Database
- PostgreSQL
- Prisma ORM

### Auth
- If wallet feature can work well with paywithlotus, then use it.
- Simple email/password or magic link for creators/admin
- Anonymous or session-based access for users is acceptable for MVP
- Admin role must be protected

### Payments
- Build the app so payment flow is abstracted behind a `paymentService`
- Add a Locus-oriented checkout integration interface with clear placeholders and implementation hooks
- Use webhook verification handling
- Do not hardcode fake payments into core business logic
- Provide a dev mock mode behind environment variables

### AI / Execution
Build an execution layer that supports:
- single-model prompt tools
- multi-step workflow tools

Route execution through an abstract `locusWrappedApiClient`.

Include provider adapters for:
- OpenAI-like prompt execution
- research workflow using search/scrape + summarize pattern

Keep provider integration modular.

---

## MVP Functional Scope

### 1. Public User Experience

#### Home Page
Show:
- featured tools
- categories
- newest tools
- popular tools

#### Browse Page
- searchable list of approved tools
- filter by category
- sort by price, popularity, newest

#### Tool Detail Page
Display:
- title
- creator
- description
- category
- price
- estimated execution type
- structured input form
- sample output preview
- run button

#### Checkout Flow
When user clicks run:
- validate input
- create a pending run record
- create payment session
- redirect/open payment flow
- on successful payment, execute tool
- show result page

#### Result Page
Show:
- tool name
- input summary
- execution status
- output
- payment amount
- run timestamp

#### User Run History
Session-based is enough for MVP if authless users are used. If authenticated, associate runs with user ID.

---

### 2. Creator Experience

#### Creator Dashboard
Show:
- their tools
- approval status
- total runs
- total revenue
- pending revenue
- failed runs

#### Create Tool Page

Allow creator to define:

##### Metadata
- name
- slug
- short description
- full description
- category
- cover image URL
- tags

##### Pricing
- price per run in USD/USDC equivalent
- optional minimum price guard

##### Tool Type
Two supported types for MVP:
- `prompt_template`
- `research_workflow`

##### Input Schema Builder
Allow creator to define fields:
- label
- key
- type: `text`, `textarea`, `url`, `select`
- required
- placeholder
- helper text

##### Execution Config

For `prompt_template`:
- provider
- model
- system prompt
- prompt template using placeholders like `{{company_name}}`

For `research_workflow`:
- topic field mapping
- search query template
- scrape enabled/disabled
- summarization prompt
- output structure instructions

#### Tool Preview
Allow creators to preview rendered form and template before submission.

#### Submit for Approval
Set status to `pending_review`.

---

### 3. Admin Experience

#### Admin Dashboard
Show:
- pending tools
- approved tools
- rejected tools
- total runs
- total GMV
- total platform revenue
- failed runs
- payment webhook events

#### Tool Review Page
Admin can:
- inspect metadata
- inspect input schema
- inspect prompts/config
- approve
- reject with reason

#### Run Monitoring
Admin can see:
- tool run status
- payment status
- provider used
- execution latency
- provider cost
- creator payout amount
- platform fee
- output preview
- errors

---

## Business Logic Requirements

### Pricing and Revenue Split
Each tool run must track:
- `salePrice`
- `providerCost`
- `platformFee`
- `creatorEarning`

Implement a configurable revenue split function.

Suggested MVP logic:
- `platformFee = max(20% of sale price, configurable minimum spread)`
- `creatorEarning = salePrice - providerCost - platformFee`

Guard against negative creator earnings.

---

## Data Model Requirements

Use Prisma and create robust schema models for at least:

### User
- id
- name
- email
- passwordHash or auth provider fields
- role: `USER`, `CREATOR`, `ADMIN`
- createdAt
- updatedAt

### Tool
- id
- creatorId
- name
- slug
- shortDescription
- fullDescription
- category
- tags
- coverImageUrl
- type
- status
- price
- featured
- createdAt
- updatedAt

### ToolInputField
- id
- toolId
- key
- label
- type
- required
- placeholder
- helperText
- sortOrder

### ToolExecutionConfig
- id
- toolId
- provider
- model
- configJson
- createdAt
- updatedAt

### ToolRun
- id
- toolId
- userId nullable
- sessionId nullable
- inputJson
- outputJson nullable
- outputText nullable
- status: `PENDING_PAYMENT`, `PAID`, `EXECUTING`, `COMPLETED`, `FAILED`, `REFUNDED`
- provider
- model
- providerCost nullable
- salePrice
- platformFee nullable
- creatorEarning nullable
- paymentId nullable
- errorMessage nullable
- createdAt
- updatedAt

### Payment
- id
- toolRunId
- provider
- externalSessionId
- externalReference
- amount
- currency
- status
- webhookPayload nullable
- createdAt
- updatedAt

### ToolReview
- id
- toolId
- adminId
- action
- reason
- createdAt

### CreatorBalance
- id
- creatorId
- pendingAmount
- availableAmount
- settledAmount
- updatedAt

---

## Architecture Requirements

Organize the codebase cleanly.

### Suggested Structure

```txt
/app
  /(public)
  /(creator)
  /(admin)
  /api
/components
/lib
  /auth
  /db
  /payments
  /locus
  /tools
  /execution
  /pricing
  /validators
/prisma