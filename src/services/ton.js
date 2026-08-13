const { TonClient, WalletContractV4, internal, Address } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { beginCell } = require('@ton/core');

async function getJettonWalletAddress(client, ownerAddress, jettonMasterAddress) {
  const jettonWalletCode = await client.runMethod(jettonMasterAddress, 'get_wallet_address', [
    { type: 'slice', value: beginCell().storeAddress(ownerAddress).endCell().asSlice() }
  ]);
  return jettonWalletCode.stack.readAddress();
}

async function sendCogniqJetton(toAddress, amount, privateKeyHex) {
  const COGNIQ_JETTON_MASTER = 'EQDOjRZ5rbSnBBvhsv4g0JNN67p89617_2pNc_AO1dTEkaNg';
  
  const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TON_CENTER_API_KEY || ''
  });
  
  let keyPair;
  if (privateKeyHex.includes(' ')) {
    keyPair = await mnemonicToPrivateKey(privateKeyHex.split(' '));
  } else {
    const keyBuffer = Buffer.from(privateKeyHex, 'hex');
    keyPair = {
      publicKey: keyBuffer.subarray(32),
      secretKey: keyBuffer
    };
  }
  
  const OPERATIONAL_WALLET = 'UQBniD_M-MTeVqUbWshZrXdQcz0m8lPstG3mQg1AL5KKCGSv';
  const walletAddress = Address.parse(OPERATIONAL_WALLET);
  
  const jettonWalletAddress = await getJettonWalletAddress(client, walletAddress, Address.parse(COGNIQ_JETTON_MASTER));
  
  const toAddr = Address.parse(toAddress);
  
  const wallet = WalletContractV4.create({
    address: walletAddress,
    workchain: 0,
    publicKey: keyPair.publicKey
  });
  
  const contract = client.open(wallet);
  
  const jettonTransferBody = beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(amount)
    .storeAddress(toAddr)
    .storeAddress(walletAddress)
    .storeBit(0)
    .storeCoins(100000000)
    .storeBit(0)
    .endCell();
  
  const seqno = await contract.getSeqno();
  
  await contract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: jettonWalletAddress,
        value: '200000000',
        body: jettonTransferBody
      })
    ]
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const transactions = await contract.getTransactions(1);
  const txHash = transactions[0].hash().toString('hex');
  
  return txHash;
}

module.exports = { getJettonWalletAddress, sendCogniqJetton };
