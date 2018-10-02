const bch = require('bitcoincashjs');
const unirest = require('unirest');
const io = require('socket.io-client');
const socket = io('https://bch.sambengtson.com');

//bch.Networks.enableRegtest();

const Address = bch.Address;
const fromString = Address.fromString;
const wif = '';
const pk = new bch.PrivateKey(wif);
const address = pk.toAddress().toString(Address.CashAddrFormat);
console.log(address);

socket.emit('subscribe', pk.toAddress().toString());
socket.on('transactions', (tx) => {
    console.log(tx);
})

setTimeout(() => {
    spend()
}, 2000);

function spend() {
    const unit = bch.Unit;
    const minerFee = 360


    const toAddress = fromString(address, 'livenet', 'pubkeyhash', Address.CashAddrFormat);

    unirest.get(`https://bch.sambengtson.com/v1/address/utxo/${address}`)
        .send()
        .end(response => {

            let originalAmount = 0;
            const utxos = findBiggestUtxo(response.body);
            for (const utxo of utxos) {
                utxo.outputIndex = utxo.vout;
                utxo.address = utxo.legacyAddress;
                utxo.txId = utxo.txid;
                originalAmount += utxo.satoshis;
            }

            const sendAmount = originalAmount - minerFee;
            const transaction = new bch.Transaction()
                .from(utxos)
                .to(toAddress.toString(), sendAmount)
                .sign(pk);

            console.log(transaction.toString())

            unirest.post(`https://bch.sambengtson.com/v1/rawtransactions/sendRawTransaction/${transaction.toString()}`)
                .send()
                .end(response => {
                    console.log(response.code);
                    console.log(response.body);
                })
        })
}

function findBiggestUtxo(utxos) {
    let largestAmount = 0;
    let largestIndex = 0;

    for (var i = 0; i < utxos.length; i++) {
        const thisUtxo = utxos[i];
        thisUtxo.value = thisUtxo.amount;

        if (thisUtxo.satoshis > largestAmount) {
            largestAmount = thisUtxo.satoshis;
            largestIndex = i;
        }
    }

    return [utxos[largestIndex]];
}