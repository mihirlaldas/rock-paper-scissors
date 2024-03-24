import { useState } from "react";
import { BrowserProvider, Eip1193Provider, ethers } from "ethers";
import Contract from "./utils/RPS.json";
import Hasher from "./utils/Hasher.json";
import "./App.css";
import { useLocalStorage } from "./hook/useLocalstorage";
declare global {
  interface Window {
    ethereum: Eip1193Provider & BrowserProvider;
  }
}
function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [otherPlayerAddress, setOtherPlayerAddress] = useState("");
  const [joinGameAddress, setJoinGameAddress] = useState("");
  const [rpsContractAddress, setRpsContractAddress] = useLocalStorage(
    "rpsContractAddress",
    ""
  );
  // TODO: use salt generator
  const salt =
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6";

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
      const c1Hashed = await hasherContract.hash(1, salt);
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

      const transaction = await contract.play(2, {
        value: ethers.parseEther("1"),
        estimateGas: 300000,
      });
      await transaction.wait();
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
      const tx = await contract.solve(1, salt, { estimateGas: 300000 });
      await tx.wait();
    } catch (error) {
      console.log("error while function call to solve: ", error);
    }
    setRpsContractAddress("");
  };

  return (
    <>
      <h1>Rock paper scissors spock lizard</h1>
      <div className="read-the-docs">
        {rpsContractAddress.length > 0 && (
          <>
            <p>Active Game address: {rpsContractAddress} </p>

            <button onClick={solve}>Solve</button>
          </>
        )}
      </div>
      <div className="card">
        {!currentAccount && (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
        {currentAccount && rpsContractAddress.length == 0 && (
          <div>
            <p>Join Game</p>
            <input
              type="text"
              value={joinGameAddress}
              onChange={(e) => setJoinGameAddress(e.target.value)}
            />
            <button onClick={p2Play}>Join</button>
            <h3>Create new game</h3>
            <input
              type="text"
              value={otherPlayerAddress}
              onChange={(e) => setOtherPlayerAddress(e.target.value)}
            />
            <button onClick={deployRPSContract}>Create Game</button>
            <p>Only on ethereum testnet - Sepolia</p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
