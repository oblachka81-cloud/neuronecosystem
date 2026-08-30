const { TonClient, WalletContractV4, WalletContractV5R1, internal, Address } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { beginCell } = require('@ton/core');
const OPERATIONAL_WALLET = 'UQBniD_M-MTeVqUbWshZrXdQcz0m8lPstG3mQg1AL5KKCGSv';

async function getJettonWalletAddress(client, ownerAddress, jettonMasterAddress) {
  const cell = beginCell().storeAddress(ownerAddress).endCell();
  
  const jettonWalletCode = await client.runMethod(jettonMasterAddress, 'get_wallet_address', [
    { type: 'slice', cell: cell }  // ← ИСПРАВЛЕНО: cell вместо value
  ]);
  
  return jettonWalletCode.stack.readAddress();
}

async function sendCogniqJetton(toAddress, amount, privateKeyHex) {
  const COGNIQ_JETTON_MASTER = 'EQDOjRZ5rbSnBBvhsv4g0JNN67p89617_2pNc_AO1dTEkaNg';
  return await sendJetton(COGNIQ_JETTON_MASTER, toAddress, amount, privateKeyHex);
}

async function sendJetton(jettonMaster, toAddress, amount, privateKeyHex) {
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

  const walletAddress = Address.parse(OPERATIONAL_WALLET);
  console.log('[JETTON] walletAddress OK, парсим jettonMaster:', jettonMaster);
  console.log('[JETTON] toAddress:', toAddress);
  console.log('[JETTON] amount:', amount, typeof amount);
  
  const jettonMasterAddr = Address.parse(jettonMaster);
  console.log('[JETTON] jettonMasterAddr OK');
  
  const jettonWalletAddress = await getJettonWalletAddress(client, walletAddress, jettonMasterAddr);
  console.log('[JETTON] jettonWalletAddress:', jettonWalletAddress?.toString() || 'UNDEFINED');
  
  const toAddr = Address.parse(toAddress);
  console.log('[JETTON] toAddr OK');

  // === ОТЛАДКА: логируем что получили ===
  console.log('[JETTON] from:', walletAddress.toString());
  console.log('[JETTON] jettonMaster:', jettonMaster);
  console.log('[JETTON] jettonWallet:', jettonWalletAddress?.toString() || 'UNDEFINED');
  console.log('[JETTON] toAddr:', toAddr?.toString() || 'UNDEFINED');
  console.log('[JETTON] amount:', amount, 'type:', typeof amount);

  if (!jettonWalletAddress) throw new Error('jettonWalletAddress is undefined');
  if (!toAddr) throw new Error('toAddr is undefined');
  // === КОНЕЦ ОТЛАДКИ ===

  const wallet = WalletContractV5R1.create({
    address: walletAddress,
    workchain: 0,
    publicKey: keyPair.publicKey
  });

  const contract = client.open(wallet);

  const jettonTransferBody = beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(BigInt(amount.toString()))
    .storeAddress(toAddr)
    .storeAddress(walletAddress)
    .storeBit(0)
    .storeCoins(100000000)
    .storeBit(0)
    .endCell();

  const seqno = await contract.getSeqno();

  try {
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
  } catch (sendErr) {
    console.error('[JETTON] sendTransfer ошибка:');
    console.error('[JETTON] message:', sendErr.message);
    if (sendErr.response) {
      console.error('[JETTON] status:', sendErr.response.status);
      console.error('[JETTON] data:', JSON.stringify(sendErr.response.data));
    }
    if (sendErr.cause) {
      console.error('[JETTON] cause:', sendErr.cause);
    }
    throw sendErr;
  }

  await new Promise(resolve => setTimeout(resolve, 5000));

  const transactions = await client.getTransactions(walletAddress, { limit: 1 });
  return transactions[0].hash().toString('hex');
}

module.exports = { getJettonWalletAddress, sendCogniqJetton, sendJetton };
