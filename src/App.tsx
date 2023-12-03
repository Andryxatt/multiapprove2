import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { mainnet, bsc, polygon, goerli } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import AppTroll from './AppTroll'
const getBlockApiKeyETH = process.env.REACT_APP_GET_BLOCK_ETH_API_KEY as string;
const getBlockApiKeyBSC = process.env.REACT_APP_GET_BLOCK_BSC_API_KEY as string;
const getBlockApiKeyPOLYGON = process.env.REACT_APP_GET_BLOCK_POLYGON_API_KEY as string;
const projectIDWalletConnect = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string;
const { chains, publicClient } = configureChains(
  [mainnet, bsc, polygon, goerli ],
  [
    jsonRpcProvider({
    rpc: (chain) => {
      if(chain.name === 'mainnet'){
        return {http: `https://go.getblock.io/${getBlockApiKeyETH}`}
      }
      else if(chain.name === 'bsc'){
        return {http: `https://go.getblock.io/${getBlockApiKeyBSC}`}
      }
      else if(chain.name === 'polygon'){
        return {http: `https://go.getblock.io/${getBlockApiKeyPOLYGON}`}
      }
     else return null;
    },
  }),
   publicProvider()],
)
const config = createConfig({
  autoConnect: false,
  connectors: [
    new WalletConnectConnector({
   chains,
      options: {
       projectId: projectIDWalletConnect,
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

function App() {
  return (
    <WagmiConfig config={config}>
      <AppTroll />
    </WagmiConfig>
  )
}
export default App