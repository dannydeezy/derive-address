This script shows you how to manually generate BitGo Multi-Sig address.

WARNING: This is mainly for educational purposes and reference. 
BitGo requires creating addresses with the ```api/v2/{coin}/wallet/{id}/address``` API endpoint (https://www.bitgo.com/api/v2/#operation/v2.wallet.newaddress) or the ```wallet.createAddress``` function in the SDK.

If you derive addresses manually and do not use one of the above endpoints, BitGo will *not* index incoming transactions to these addresses, and lots of things will go wrong.

Usage:

First, you'll need NodeJS installed https://nodejs.org/en/

Next, clone the repo and install dependencies:
```aidl
git clone https://github.com/dannybitgo/derive-address.git
cd derive-address
npm i
```

Now create an Access Token for your user using the BitGo website.
Login and navigate to User Settings -> Developer Options -> Add Access token

Be sure to whitelist your IP address and only give permissions that you want it to have

Copy the access token and set it as an environment variable in your terminal:
```aidl
export BITGO_ACCESS_TOKEN=v2x915thisisafakeaccesstokena1161bb1d160571asdfasdfb9fc0d204ec
```

Then find your wallet ID in your wallet settings, this will be the ```--wallet``` parameter below.

You'll also need to set the ```--coin```, ```--chain```, ```--index```, and ```--env``` parameters, as shown below.

To run the script on testnet:
```aidl
node derive-address.js --wallet 5c6c46e6425581ee2438fde7c3e0509b --coin tbtc --chain 10 --index 0 --env test
```

To run the script on production:
```aidl
node derive-address.js --wallet 5c6c46e6425581ee2438fde7c3e0509b --coin btc --chain 10 --index 0 --env prod
```

More info:

BitGo derives addresses using the following derivation scheme:

```m/0/0/chain/index```

```chain``` must be one of ```0, 1, 10, 11, 20, or 21```

Even numbers are used for receive addresses, while odd numbers are used for change addresses.

```0 and 1``` are regular P2SH addresses

```10 and 11``` are P2SH-P2WSH (wrapped segwit) addresses

```20 and 21``` are P2WSH (native segwit) addresses

Each of the 3 xpubs is derived with the above derivation path, and the script is constructed from the resulting 3 pubkeys.
