import { useState } from "react";
import { BrowserProvider, Eip1193Provider, ethers } from "ethers";
import Contract from "./utils/RPS.json";
import Hasher from "./utils/Hasher.json";
import "./App.css";
import { useLocalStorage } from "./hook/useLocalstorage";
import MovePicker from "./components/MovePicker";
import { icons, names } from "./utils/fixtures";
import Winner, { to2decimalPlaces } from "./components/Winner";
import PingContract from "./components/PingContract";

declare global {
  interface Window {
    ethereum: Eip1193Provider & BrowserProvider;
  }
}
function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [otherPlayerAddress, setOtherPlayerAddress] = useState("");
  const [joinGameAddress, setJoinGameAddress] = useState("");
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [isGameOn, setIsGameOn] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [canShowResultBtn, setCanShowResultBTn] = useState(false);
  const [rpsContractAddress, setRpsContractAddress] = useState("");
  const [salt, setsalt] = useLocalStorage("salt", "");
  const [stakeForGame, setStakeForGame] = useState("");
  const [isGameSolved, setIsGameSolved] = useState(false);
  const [isWaitingForPlayer1ToSolve, setIsWaitingForPlayer1ToSolve] =
    useState(false);

  const [startingBalance, setStartingBalance] = useLocalStorage(
    "starting-balance",
    ""
  );

  const [stakedAmount, setStakedAmount] = useLocalStorage("staked-amount", "");
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
      provider.on("block", async () => {
        const newBalance = await provider.getBalance(accounts[0]);
        setCurrentBalance(ethers.formatEther(newBalance));
      });

      setCurrentBalance(ethers.formatEther(balance));
    } catch (error) {
      console.log(error);
    }
  };
  // player 1 begins game with his move
  const deployRPSContract = async () => {
    const newSalt = ethers.toBigInt(ethers.randomBytes(32)).toString();
    setsalt(newSalt);
    const contractABI = Contract.abi;
    const byteCode = Contract.data.bytecode.object;
    const HasherABI = Hasher.abi;
    // deployed to sepolia testnet
    const hasherContractAddress = import.meta.env.VITE_HASHER_ADDRESS;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const balance = await provider.getBalance(currentAccount);
      setStartingBalance(to2decimalPlaces(ethers.formatEther(balance)));
      const hasherContract = new ethers.Contract(
        hasherContractAddress,
        HasherABI,
        signer
      );
      const c1Hashed = await hasherContract.hash(selectedMove, newSalt);
      const factory = new ethers.ContractFactory(contractABI, byteCode, signer);
      const contract = await factory.deploy(c1Hashed, otherPlayerAddress, {
        value: ethers.parseEther(stakeForGame),
      });
      await contract.waitForDeployment();
      const rpsAddress = await contract.getAddress();
      console.log("RPS contract deployed at: ", rpsAddress);
      setRpsContractAddress(rpsAddress);

      // If player2 does not respond, call j2Timeout and get back stacked eth
      setTimeout(async () => {
        const rpsContract = new ethers.Contract(
          rpsAddress,
          Contract.abi,
          signer
        );

        const tx = await rpsContract.j2Timeout();
        await tx.wait();
        reset();
      }, 60000 * 5);
    } catch (error) {
      console.error("RPS contract deployment error:", error);
      alert("Validation error - invalid eth amount. pick move");
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
      const balance = await provider.getBalance(currentAccount);
      setStartingBalance(to2decimalPlaces(ethers.formatEther(balance)));
      const transaction = await contract.play(selectedMove, {
        value: ethers.parseEther(stakeForGame),
        estimateGas: 300000,
      });
      await transaction.wait();
      const stake = await contract.stake();

      setStakedAmount(ethers.formatEther(stake));

      setCanShowResultBTn(true);
      // If player1 does not respond to solve, call j1Timeout and get back stacked eth
      setTimeout(async () => {
        const tx = await contract.j1Timeout({ estimateGas: 300000 });
        await tx.wait();
        reset();
      }, 60000 * 5);
    } catch (error) {
      console.log("play funcation call error:", error);
      alert("Validation error - invalid eth amount. pick move");
    }
  };

  function reset() {
    setIsGameOn(false);
    window.location.reload();
    setsalt("");
    setStartingBalance("");
    setStakedAmount("");
  }
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
      const stake = await contract.stake();
      setStakedAmount(ethers.formatEther(stake));
      const tx = await contract.solve(selectedMove, salt, {
        estimateGas: 300000,
      });
      await tx.wait();
      setSelectedMove(null);
      setCanShowResultBTn(true);
    } catch (error) {
      console.log("error while function call to solve: ", error);
      alert("player 2 has not yet finished");
    }
  };

  return (
    <>
      {currentBalance && (
        <header className="header">
          Account balance: {currentBalance} ETH
        </header>
      )}

      <h1>Rock paper scissors spock lizard</h1>
      <div className="read-the-docs">
        {rpsContractAddress.length > 0 && isGameOn && (
          <>
            <p>Active Game address: {rpsContractAddress} </p>
            <PingContract
              contractAddress={rpsContractAddress}
              setIsGameSolved={setIsGameSolved}
              setIsWaitingForPlayer1ToSolve={setIsWaitingForPlayer1ToSolve}
            />
            {/* show solve btn to player 1 */}
            {!joinGameAddress &&
              isWaitingForPlayer1ToSolve &&
              !isGameSolved && <button onClick={solve}>Solve</button>}
            {isGameSolved && (
              <header>
                <Winner
                  currentBalance={currentBalance}
                  prevBalance={startingBalance}
                  stake={stakedAmount}
                />
                <button onClick={reset}>Close and start new game</button>
              </header>
            )}
          </>
        )}
      </div>
      <div className="card">
        {!currentAccount && (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
        {currentAccount && !isGameOn && (
          <div>
            <h3>Join Game</h3>
            <input
              type="text"
              value={joinGameAddress}
              placeholder="live game contract address"
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
              placeholder="another player's address"
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
                {/* player 1 */}
                <MovePicker setSelectedMove={setSelectedMove} />
                <label>Stake ETH amount: </label>
                <input
                  type="number"
                  value={stakeForGame}
                  placeholder="example 0.05"
                  onChange={(e) => setStakeForGame(e.target.value)}
                />
                <button onClick={deployRPSContract}>Submit your move</button>
              </>
            )}
            {joinGameAddress && !canShowResultBtn && (
              <>
                {/* player 2 */}
                <MovePicker setSelectedMove={setSelectedMove} />
                <label>Stake ETH amount: </label>
                <input
                  type="number"
                  value={stakeForGame}
                  placeholder="example 0.05"
                  onChange={(e) => setStakeForGame(e.target.value)}
                />
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
