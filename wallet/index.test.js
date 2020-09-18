const TransactionPool = require('./transaction-pool');
const Wallet = require('./index');

describe('Wallet', () => {
  let wallet, tp;

  beforeEach(() => {
    wallet = new Wallet();
    tp = new TransactionPool();
  });

  describe('creating a transaction', () => {
    let transaction, sendAmount, recipient;

    beforeEach(() => {
      sendAmount = 50;
      recipient = 'r4nd0m-4ddr355';
      transaction = wallet.createTransaction(recipient, sendAmount, tp);
    });

    describe('and doing the same transaction', () => {
      beforeEach(() => {
        wallet.createTransaction(recipient, sendAmount, tp);
      });

      it('doubles the `sendAmount` subtracted from the wallet balance', () => {
        expect(
          transaction.outputs.find(o => o.address === wallet.publicKey).amount
        ).toEqual(wallet.balance - (sendAmount * 2));
      });

      it('clones the `sendAmount` output for the recipient' , () => {
        expect(
          transaction.outputs.filter(o => o.address === recipient).map(o => o.amount)
        ).toEqual([sendAmount, sendAmount]);
      });
    });
  });
});
