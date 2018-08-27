const bch = require('bitcoincashjs');
var unirest = require('unirest');

bch.Networks.enableRegtest();

const wif = 'cNgciJr2mLDL9hxX7z7TQRuV5TR5C8irJy6tJRyZZhwhJkt1PEmr';
const pk = new bch.PrivateKey(wif);
const address = pk.toAddress().toString();

const unit = bch.Unit;
const amount = unit.fromBTC(1).toSatoshis()
const minerFee = unit.fromMilis(0.0001).toSatoshis();

unirest.get(`https://trest.bitcoin.com/v1/address/utxo/${address}`)
    .send()
    .end(response => {
        debugger;
        const utxo = {
            txId: response.body[0].txid,
            scriptPubKey: response.body[0].scriptPubKey,
            outputIndex: response.body[0].vout,
            address: response.body[0].legacyAddress,
            satoshis: response.body[0].satoshis
        }

        const transaction = new bch.Transaction()
            .from(utxo)
            .to(address, amount)
            .fee(minerFee)
            .sign(pk);

        console.log(transaction.toString())

        unirest.post(`https://trest.bitcoin.com/v1/rawtransactions/sendRawTransaction/${transaction.toString()}`)
        .send()
        .end(response => {
            console.log(response.code);
            console.log(response.body);
        })
    })