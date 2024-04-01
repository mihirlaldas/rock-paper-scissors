import { ethers } from "ethers";
import Contract from "../utils/RPS.json";

import { useEffect, useState } from "react";
import { invokeJ1Timeout, invokeJ2Timeout } from "../utils/invokeTimeout";
import { isTimeout } from "../utils/isTimeout";

type ContractData = {
  stake: number;
  j1: string;
  j2: string;
  c2: number | null;
  lastAction: any;
};
const initialData: ContractData = {
  stake: 0,
  j1: "",
  j2: "",
  c2: null,
  lastAction: "",
};
type Props = {
  contractAddress: string;
  setIsGameSolved: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWaitingForPlayer1ToSolve: React.Dispatch<React.SetStateAction<boolean>>;
  reset: () => void;
};
function PingContract({
  contractAddress,
  setIsGameSolved,
  setIsWaitingForPlayer1ToSolve,
  reset,
}: Props) {
  const [data, setData] = useState<ContractData>(initialData);
  async function getData() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const rpsContract = new ethers.Contract(
      contractAddress,
      Contract.abi,
      signer
    );

    const stake = parseFloat(ethers.formatEther(await rpsContract.stake()));
    const j1 = await rpsContract.j1();
    const j2 = await rpsContract.j2();
    const c2 = await rpsContract.c2();
    const lastAction = await rpsContract.lastAction();
    const isWaitingForPlayer1ToSolve = c2 && stake > 0;
    const isGameSolved = c2 && stake === 0;

    setData({ j1, j2, stake, c2, lastAction });
    if (isWaitingForPlayer1ToSolve) {
      setIsWaitingForPlayer1ToSolve(true);
    }
    if (isGameSolved) {
      setIsGameSolved(true);
    }
  }

  const isWaitingForPlayer2 = !data.c2;
  const isWaitingForPlayer1ToSolve = data.c2 && data.stake > 0;
  const isGameSolved = data.c2 && data.stake === 0;
  const isTimedout = isTimeout(data.lastAction);
  const isPlayer1 =
    localStorage.getItem("is-player-1") === "true" ? true : false;
  const stakeHasBeenClaimed = isTimedout && data.stake === 0;
  const stakeIsToBeClaimed = isTimedout && data.stake > 0;
  // polling for data
  useEffect(() => {
    if (!isGameSolved) {
      const timer = setInterval(() => {
        getData();
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isGameSolved]);

  return (
    <div className="contract-data">
      <h3>Contract data:</h3>
      <p> Player 1: {data.j1}</p>
      <p>player 2: {data.j2}</p>
      <p>stake: {data.stake} ETH</p>
      <h3>Game status:</h3>
      {isWaitingForPlayer2 && !stakeHasBeenClaimed && (
        <>
          <p>Waiting for Player 2</p>
          {isPlayer1 && stakeIsToBeClaimed && (
            <>
              <label htmlFor="button">Player 2 has timedout</label>
              <button onClick={invokeJ2Timeout}>Claim stake</button>
            </>
          )}
        </>
      )}
      {isWaitingForPlayer1ToSolve && !stakeHasBeenClaimed && (
        <>
          <p>Waiting for Player 1 to solve</p>
          {!isPlayer1 && stakeIsToBeClaimed && (
            <>
              <label htmlFor="button">
                Player 1 has timedout, did not solve
              </label>
              <button onClick={invokeJ1Timeout}>Claim stake</button>
            </>
          )}
        </>
      )}
      {stakeHasBeenClaimed && (
        <>
          <h3>Stake has been claimed</h3>
          <button onClick={() => reset()}>Close and start new game</button>
        </>
      )}
    </div>
  );
}

export default PingContract;
