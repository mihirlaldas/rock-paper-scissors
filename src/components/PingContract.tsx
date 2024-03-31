import { ethers } from "ethers";
import Contract from "../utils/RPS.json";

import { useEffect, useState } from "react";

type ContractData = {
  stake: number;
  j1: string;
  j2: string;
  c2: number | null;
};
const initialData: ContractData = {
  stake: 0,
  j1: "",
  j2: "",
  c2: null,
};

type Props = {
  contractAddress: string;
  setIsGameSolved: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWaitingForPlayer1ToSolve: React.Dispatch<React.SetStateAction<boolean>>;
};
function PingContract({
  contractAddress,
  setIsGameSolved,
  setIsWaitingForPlayer1ToSolve,
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
    const isWaitingForPlayer1ToSolve = c2 && stake > 0;
    const isGameSolved = c2 && stake === 0;

    setData({ j1, j2, stake, c2 });
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
    <div>
      <h3>Contract data:</h3>
      <p>j1: {data.j1}</p>
      <p>j2: {data.j2}</p>
      <p>stake: {data.stake} ETH</p>
      <h3>Game status:</h3>
      {isWaitingForPlayer2 && (
        <>
          <p>Waiting for Player 2</p>
        </>
      )}
      {isWaitingForPlayer1ToSolve && (
        <>
          <p>Waiting for Player 1 to solve</p>
        </>
      )}
    </div>
  );
}

export default PingContract;
