const bch = require('bitcoincashjs');
var unirest = require('unirest');

//bch.Networks.enableRegtest();

const Address = bch.Address;
const fromString = Address.fromString;
const wif = '5d898626a4a17766df4ab77a46d055de4e1fa2f32a91d8cb883ed5d27111a768';
const pk = new bch.PrivateKey(wif);
const address = pk.toAddress().toString();

const unit = bch.Unit;
const minerFee = unit.fromMilis(0.01).toSatoshis();


const toAddress = fromString('bitcoincash:qr0q67nsn66cf3klfufttr0vuswh3w5nt5jqpp20t9', 'livenet', 'pubkeyhash', Address.CashAddrFormat);

unirest.get(`https://rest.bitcoin.com/v1/address/utxo/${address}`)
    .send()
    .end(response => {
        const utxo = {
            txId: response.body[0].txid,
            scriptPubKey: response.body[0].scriptPubKey,
            outputIndex: response.body[0].vout,
            address: response.body[0].legacyAddress,
            satoshis: response.body[0].satoshis
        }

        const sendAmount = response.body[0].satoshis - minerFee;
        const transaction = new bch.Transaction()
            .from(utxo)
            .to(toAddress.toString(), sendAmount)
            .sign(pk);

        console.log(transaction.toString())

        unirest.post(`https://rest.bitcoin.com/v1/rawtransactions/sendRawTransaction/${transaction.toString()}`)
        .send()
        .end(response => {
            console.log(response.code);
            console.log(response.body);
        })
    })