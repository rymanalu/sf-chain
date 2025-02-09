const ChainUtil = require('../chain-util');
const { INITIAL_BALANCE } = require('../config');
const Transaction = require('./transaction');

class Wallet {
  constructor() {
    this.balance = INITIAL_BALANCE;
    this.keyPair = ChainUtil.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode('hex');
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }

  createTransaction(recipient, amount, blockchain, transactionPool) {
    this.balance = this.calculateBalance(blockchain);

    if (amount > this.balance) {
      console.log(`Amount: ${amount} exceeds current balance: ${this.balance}`);
      return;
    }

    let transaction = transactionPool.existingTransaction(this.publicKey);

    if (transaction) {
      transaction.update(this, recipient, amount);
    } else {
      transaction = Transaction.newTransaction(this, recipient, amount);
      transactionPool.updateOrAddTransaction(transaction);
    }

    return transaction;
  }

  static blockchainWallet() {
    const blockchainWallet = new this();
    blockchainWallet.address = 'blockchain-wallet';

    return blockchainWallet;
  }

  calculateBalance(blockchain) {
    let balance = this.balance;
    let transactions = [];
    blockchain.chain.forEach(block => {
      block.data.forEach(transaction => {
        transactions.push(transaction);
      });
    });

    const walletInputTs = transactions.filter(t => t.input.address === this.publicKey);

    let startTime = 0;

    if (walletInputTs.length > 0) {
      const recentInputT = walletInputTs.reduce((prev, current) => {
        return prev.input.timestamp > current.input.timestamp ? prev : current;
      });

      balance = recentInputT.outputs.find(o => o.address === this.publicKey).amount;
      startTime = recentInputT.input.timestamp;
    }

    transactions.forEach(transaction => {
      if (transaction.input.timestamp > startTime) {
        transaction.outputs.find(o => {
          if (o.address === this.publicKey) {
            balance += o.amount;
          }
        });
      }
    });

    return balance;
  }

  toString() {
    return `Wallet -
      publicKey: ${this.publicKey.toString()}
      balance  : ${this.balance}`;
  }
}

module.exports = Wallet;
