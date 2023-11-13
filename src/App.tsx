import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { mainnet, bsc, polygon, goerli } from 'wagmi/chains'
// import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
// import {alchemyProvider} from 'wagmi/providers/alchemy'
//add rpc provider
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import AppTroll from './AppTroll'
// const infuraId = process.env.REACT_APP_INFURA_ID;
const getBlockApiKey = process.env.REACT_APP_GET_BLOCK_API_KEY;
// const alchemyId = process.env.REACT_APP_ALCHEMY_ID;
// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const { chains, publicClient } = configureChains(
  [mainnet, bsc, polygon, goerli ],
  [
    jsonRpcProvider({
    rpc: (chain) => {
      if(chain.name === 'mainnet'){
        return {http: `https://bsc.getblock.io/${getBlockApiKey}/mainnet/`}
      }
      else if(chain.name === 'bsc'){
        return {http:`https://bsc.getblock.io/${getBlockApiKey}/mainnet/`}
      }
      else if(chain.name === 'polygon'){
        return {http:`https://matic.getblock.io/${getBlockApiKey}/mainnet/`}
      }
     else return null;
    },
  }), publicProvider()],
)

// Set up client
const config = createConfig({
  autoConnect: false,
  connectors: [
    new WalletConnectConnector({
      chains,
      options: {
       projectId: "5c363275c4419b653d61ace14d455d85",
       showQrModal: true,
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
})

// Pass client to React Context Provider
function App() {
  return (
    <WagmiConfig config={config}>
      <AppTroll />
    </WagmiConfig>
  )
}
export default App