const BitGo = require('bitgo');
const bitcoin = require('bitgo-utxo-lib');
const argv = require('yargs').argv;

const ACCESS_TOKEN = process.env.BITGO_ACCESS_TOKEN;
const WALLET_ID = argv.wallet;
let env = argv.env;
const coin = argv.coin;
const chain = argv.chain;
const index = argv.index;

let bitgo, network;

async function getWalletKeys(walletId) {
  const wallet = await bitgo.coin(coin).wallets().getWallet({id: walletId});
  const keyIds = wallet._wallet.keys;
  const xpubs = [];
  for (keyId of keyIds) {
    const key = await bitgo.coin(coin).keychains().get({ id: keyId });
    xpubs.push(key.pub);
  }
  const info = {
    walletId,
    user: xpubs[0],
    backup: xpubs[1],
    bitgo: xpubs[2]
  };
  console.log(`\nWallet ID: ${walletId}`);
  console.log(`User xpub: ${info.user}`);
  console.log(`Backup xpub: ${info.backup}`);
  console.log(`BitGo xpub: ${info.bitgo}`);
  return xpubs;
}

function deriveP2SHAddress(redeemScript) {
  const redeemScriptHash = bitcoin.crypto.hash160(redeemScript);
  const scriptPubKey = bitcoin.script.scriptHash.output.encode(redeemScriptHash);
  return bitcoin.address.fromOutputScript(scriptPubKey, network);
}

function deriveP2SHP2WSHAddress(witnessScript) {
  const witnessScriptHash = bitcoin.crypto.sha256(witnessScript);
  const redeemScript = bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash);
  const redeemScriptHash = bitcoin.crypto.hash160(redeemScript);
  const scriptPubKey = bitcoin.script.scriptHash.output.encode(redeemScriptHash);
  return bitcoin.address.fromOutputScript(scriptPubKey, network);
}

function deriveP2WSHAddress(witnessScript) {
  const witnessScriptHash = bitcoin.crypto.sha256(witnessScript);
  const scriptPubKey = bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash);
  return bitcoin.address.fromOutputScript(scriptPubKey, network);
}

function deriveAddress(xpubs, chain, index) {

  const hdNodes = xpubs.map((xpub) => bitcoin.HDNode.fromBase58(xpub));
  const derivedHdNodes = hdNodes.map(hdNode => hdNode.derive(0).derive(0).derive(chain).derive(index));
  const pubKeys = derivedHdNodes.map(hdNode => hdNode.getPublicKeyBuffer());
  const multiSigScript = bitcoin.script.multisig.output.encode(2, pubKeys);
  console.log();

  if ([0, 1].includes(chain)) {
    console.log(`Chain is ${chain}, so creating a P2SH address...`);
    return deriveP2SHAddress(multiSigScript);
  }
  if ([10, 11].includes(chain)) {
    console.log(`Chain is ${chain}, so creating a P2SH-P2WSH address...`);
    return deriveP2SHP2WSHAddress(multiSigScript);
  }
  if ([20, 21].includes(chain)) {
    console.log(`Chain is ${chain}, so creating a P2WSH address...`);
    return deriveP2WSHAddress(multiSigScript);
  }

  throw Error ('Chain must be 0, 1, 10, 11, 20, or 21 to be compatible with BitGo derivation paths');
}

function verifyParameters() {
  if (!ACCESS_TOKEN) throw Error('BITGO_ACCESS_TOKEN not set\n');
  if (!WALLET_ID) throw Error('--wallet not set\n');
  if (!env) {
    console.log('--env not set, defaulting to prod');
    env = 'prod';
  }
  if (!coin) throw Error('--coin not set');
  if (isNaN(chain) || ![0,1,10,11,20,21].includes(chain)) throw Error('--chain must be 0, 1, 10, 11, 20, or 21\n');
  if (isNaN(index)) throw Error('--index not set\n');
}

async function main() {
  verifyParameters();
  bitgo = new BitGo.BitGo({ accessToken: ACCESS_TOKEN, env });
  network = env === 'prod' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
  const xpubs = await getWalletKeys(WALLET_ID);
  if (chain.toString() && index.toString()) {
    const address = deriveAddress(xpubs, parseInt(chain), parseInt(index));
    const path = `m/0/0/${chain}/${index}`;
    console.log(`Derivation path is ${path} for each xpub\n`);
    console.log(`Derived address is: ${address}`);
  } else {
    console.log(`\nProvide chain and index to derive an address.`);
    console.log(`Example:`);
    console.log(`node derive-address.js --wallet 5c1429950225bedc03476bfba2dd3b68 --coin tbtc --chain 0 --index 1 --env test`);
  }
}

main();
