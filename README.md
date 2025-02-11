# Simple wallet

- This is a simple wallet that allows you to create a wallet, deposit money, withdraw money, check your balance, and 
  swap tokens.
- In this version, you only use in testnet

## Prerequisites

- Node.js version 20
- Git
- OS: Ubuntu

## Installation

1. Clone the repository
```bash
  git clone https://github.com/datnguyen2k3/simple-wallet.git
  cd simple-wallet
```

2. Install pnpm
```bash
  npm install -g pnpm
```

3. Install dependencies
```bash
  pnpm install
```

4. Start the app
```bash
  pnpm start
```

## Usage

- When you start the app, you will see a menu with the following options
- Press the number corresponding to the option you want to choose and press Enter to use that option

### 1. Wallet

This option allows you to interact with your wallet
#### 1.1 Wallet Information
- This option allows you to see your wallet information:
  - Your wallet address
  - Your balance

#### 1.2 Create a new wallet
- This option allows you to create a new wallet:
  - New Private Key
  - New Wallet Address

#### 1.3. Import an existing wallet
- This option allows you to import an existing wallet:
  - Enter your private key

#### 1.4 Withdraw
- This option allows you to withdraw money from your wallet
- You need to enter the token symbol, amount and the receiver address to withdraw.

#### 1.5 Change password
- This option allows you to set or change your password
- After that, you need to enter your password to confirm when you want to create a transaction

#### 1.6. Go back
- This option allows you to go back to the main menu

### 2. Market

When you choose this option, you will see a price of many tokens with the following options below

- This option allows you to see the price of a tokens today by ADA
- Also, you can buy or sell these tokens

#### 2.1. Enter trading pair

- You need to enter the trading pair you want to interact with
- After that, you will see the price of a trading pair and following options below

##### 2.1.1 Buy token
- This option allows you to buy a token
- You will see your balance of token that you can swap to buy the target token
- After that, you need to enter the amount of swap token
- Then you can see the calculation of the amount of target token you will receive and the fee you need to pay
- Finally, you can confirm the transaction and you will see the transaction hash

##### 2.1.2 Sell token
- This option allows you to sell a token
- You will see your balance of token that you can swap to sell the target token
- After that, you need to enter the amount of swap token
- Then you can see the calculation of the amount of target token you will receive and the fee you need to pay
- Finally, you can confirm the transaction and you will see the transaction hash

##### 2.1.3 Go back
- This option allows you to go back to the Market menu

#### 2.2. Add trading pair
- This option allows you to add a new trading pair
- You need to enter two tokens symbol that you want to create a trading pair

#### 2.3. Remove trading pair (under development)

#### 2.4. Add token
- This option allows you to add a new token with your custom symbol
- You need to enter:
  - Policy ID
  - Token Name
  - Token Symbol
- After that, you will see the token you have added

#### 2.5. Remove token (under development)

#### 2.6. Go to next page (unstable)
- This option allows you to go to the next page of the token list

#### 2.7. Go to previous page (unstable)
- This option allows you to go to the previous page of the token list

#### 2.8. Go back
- This option allows you to go back to the main menu

### 3. Liquidity

- When you choose this option, you need to enter a token symbol that you want to interact with liquidity pool.
- After that, you will see the pool information and following options below

#### 3.1. Add liquidity
- This option allows you to add liquidity to the pool
- You need to enter the amount of token to add to the pool
- Make sure you have enough token and ADA to add to the pool
- After that, you will see the received LP token and the fee you need to pay
- Finally, you can confirm the transaction and you will see the transaction hash

#### 3.2. Remove liquidity
- This option allows you to remove liquidity from the pool
- You need to enter the amount of LP token to remove from the pool
- Make sure you have enough LP token to remove from the pool
- After that, you will see the received token, ADA and the fee you need to pay
- Finally, you can confirm the transaction and you will see the transaction hash

#### 3.3. Go back
- This option allows you to go back to the liquidity menu

### 4. Exit
- This option allows you to exit the app