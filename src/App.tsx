import { useEffect, useState } from "react";
import { BrowserProvider, Eip1193Provider, ethers } from "ethers";
import Contract from "./utils/RPS.json";
import Hasher from "./utils/Hasher.json";
import "./App.css";
import { useLocalStorage } from "./hook/useLocalstorage";
import MovePicker from "./components/MovePicker";
import { icons, names } from "./utils/fixtures";
import Winner from "./components/Winner";
declare global {
  interface Window {
    ethereum: Eip1193Provider & BrowserProvider;
  }
}
function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [accountBalance, setAccoutnBalance] = useState("");
  const [resultBalance, setResultBalance] = useState("");
  const [otherPlayerAddress, setOtherPlayerAddress] = useState("");
  const [joinGameAddress, setJoinGameAddress] = useState("");
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [pendingP2Move, setPendingP2Move] = useState(true);
  const [isGameOn, setIsGameOn] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [rpsContractAddress, setRpsContractAddress] = useLocalStorage(
    "rpsContractAddress",
    ""
  );
  // TODO: use salt generator
  const salt =
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6";
  useEffect(() => {
    if (currentAccount.length > 0) {
    }
  }, [currentAccount]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(accounts[0]);
      setAccoutnBalance(ethers.formatEther(balance));
    } catch (error) {
      console.log(error);
    }
  };

  const deployRPSContract = async () => {
    const contractABI = Contract.abi;
    const byteCode = Contract.data.bytecode.object;
    const HasherABI = Hasher.abi;
    // TODO: use actual deployed address
    const hasherContractAddress = "0x057ef64E23666F000b34aE31332854aCBd1c8544";
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const hasherContract = new ethers.Contract(
        hasherContractAddress,
        HasherABI,
        signer
      );
      const c1Hashed = await hasherContract.hash(selectedMove, salt);
      const factory = new ethers.ContractFactory(contractABI, byteCode, signer);
      const contract = await factory.deploy(c1Hashed, otherPlayerAddress, {
        value: ethers.parseEther("1"),
      });
      const rpsAddress = await contract.getAddress();
      console.log("RPS contract deployed at: ", rpsAddress);
      setRpsContractAddress(rpsAddress);
    } catch (error) {
      console.error("RPS contract deployment error:", error);
    }
  };

  const p2Play = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    try {
      const contract = new ethers.Contract(
        joinGameAddress,
        Contract.abi,
        signer
      );

      const transaction = await contract.play(selectedMove, {
        value: ethers.parseEther("1"),
        estimateGas: 300000,
      });
      await transaction.wait();
      setPendingP2Move(false);
    } catch (error) {
      console.log("play funcation call error:", error);
    }
  };

  // player 1 - J1 invokes this function after J2 has played
  const solve = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    try {
      const contract = new ethers.Contract(
        rpsContractAddress,
        Contract.abi,
        signer
      );
      const tx = await contract.solve(selectedMove, salt, {
        estimateGas: 300000,
      });
      await tx.wait();
      setSelectedMove(null);
    } catch (error) {
      console.log("error while function call to solve: ", error);
    }
  };

  const getResultBalance = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(currentAccount);
    setResultBalance(ethers.formatEther(balance));
  };

  return (
    <>
      {accountBalance && !resultBalance && (
        <header className="header">
          Account balance: {accountBalance} ETH
        </header>
      )}

      <h1>Rock paper scissors spock lizard</h1>
      <div className="read-the-docs">
        {rpsContractAddress.length > 0 && (
          <>
            <p>Active Game address: {rpsContractAddress} </p>

            {!joinGameAddress && selectedMove && (
              <button onClick={solve}>Solve</button>
            )}
            {!showResult && !selectedMove && (
              <button
                onClick={() => {
                  setShowResult(true);
                  getResultBalance();
                }}
              >
                Show result
              </button>
            )}
            {resultBalance && showResult && (
              <header>
                <p className="header">Account balance: {resultBalance} ETH</p>
                <Winner
                  currentBalance={resultBalance}
                  prevBalance={accountBalance}
                />
                <button
                  onClick={() => {
                    setShowResult(false);
                    setIsGameOn(false);
                    setRpsContractAddress("");
                    setResultBalance("");
                  }}
                >
                  Close and start new game
                </button>
              </header>
            )}
          </>
        )}
        {!showResult && !pendingP2Move && joinGameAddress && (
          <button
            onClick={() => {
              setShowResult(true);
              getResultBalance();
            }}
          >
            Show result
          </button>
        )}
      </div>
      <div className="card">
        {!currentAccount && (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
        {currentAccount && !isGameOn && (
          <div>
            <p>Join Game</p>
            <input
              type="text"
              value={joinGameAddress}
              onChange={(e) => {
                setJoinGameAddress(e.target.value);
                setRpsContractAddress(e.target.value);
              }}
            />
            <button onClick={() => setIsGameOn(true)}>Join</button>
            <h3>Create new game</h3>
            <input
              type="text"
              value={otherPlayerAddress}
              onChange={(e) => setOtherPlayerAddress(e.target.value)}
            />
            <button onClick={() => setIsGameOn(true)}>Create Game</button>
            <p>Only on ethereum testnet - Sepolia</p>
          </div>
        )}
        {isGameOn && !showResult && (
          <>
            {rpsContractAddress.length === 0 && !joinGameAddress && (
              <>
                <MovePicker setSelectedMove={setSelectedMove} />
                <button onClick={deployRPSContract}>Submit your move</button>
              </>
            )}
            {joinGameAddress && (
              <>
                <MovePicker setSelectedMove={setSelectedMove} />
                <button onClick={p2Play}>Submit your move</button>
              </>
            )}
            {selectedMove && (
              <div className="flex">
                <div>
                  <p>You picked :</p>
                  <h2>{icons[selectedMove - 1]}</h2>
                  <p>{names[selectedMove - 1]}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default App;
