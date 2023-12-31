const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);
const { abi, evm } = require('../compile');

let accounts;
let lottery;

beforeEach(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();

    // Use one of those accounts to deploy
    // the contract
    lottery = await new web3.eth.Contract(abi)
        .deploy({
            data: evm.bytecode.object
        })
        .send({
            from: accounts[0],
            gas: '1000000'
        });
});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('no accounts has entered yet', async () => {
        let players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(0, players.length);
    });

    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether'),
        });
        
        players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(1, players.length);
        assert.equal(accounts[0], players[0]);

        // Assert contract has balance
        const balance = await web3.eth.getBalance(lottery.options.address);
        assert.equal(web3.utils.toWei('0.02', 'ether'), balance);
    });

    it('allows multiple accounts to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether'),
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.06', 'ether'),
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.05', 'ether'),
        });
        
        players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(3, players.length);
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);

        // Assert contract has balance
        const balance = await web3.eth.getBalance(lottery.options.address);
        assert.equal(web3.utils.toWei('0.13', 'ether'), balance);
    });

    it('requires a minimum amount of ether to enter', async () => {
        let hasErrorOccurred = false;

        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 200,
            });
        } catch (err) {
            hasErrorOccurred = true;
        }

        assert(hasErrorOccurred);
    });

    it('only manager can call pickWinner', async () => {
        let hasErrorOccurred = false;

        try {
            await lottery.methods.enter().send({
                from: accounts[1],
                value: web3.utils.toWei('0.02', 'ether'),
            });
            
            await lottery.methods.pickWinner().send({
                from: accounts[1],
            });
        } catch (err) {
            hasErrorOccurred = true;
        }

        assert(hasErrorOccurred);
    });

    it('sends money to the winner and resets the players array', async () => {
        const sendValue = BigInt(web3.utils.toWei('2', 'ether'));
        await lottery.methods.enter().send({
            from: accounts[1],
            value: sendValue,
        });

        const initialBalance = await web3.eth.getBalance(accounts[1]);
        await lottery.methods.pickWinner().send({
            from: accounts[0],
        });
        const finalBalance = await web3.eth.getBalance(accounts[1]);

        assert(initialBalance + sendValue == finalBalance)

        // Assert players array is reset
        let players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(0, players.length);

        // Assert contract balance is zero
        const balance = await web3.eth.getBalance(lottery.options.address);
        assert.equal(0, balance);
    });
});