import { ethers } from "ethers";
import Contract from "../utils/RPS.json";

import { useEffect, useState } from "react";

function PingContract({ contractAddress }: { contractAddress: string }) {
  const [data, setData] = useState({});

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

    setData({ j1, j2, stake, c2 });
  }
  // polling for data
  useEffect(() => {
    const timer = setInterval(getData, 1000);
    return () => clearInterval(timer);
  }, []);

  const isWaitingForPlayer2 = !data?.c2;
  const isWaitingForPlayer1ToSolve = data?.c2 && data?.stake > 0;
  const isGameSolved = data?.c2 && data?.stake === 0;
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
      {isGameSolved && <p>Game is solved</p>}
    </div>
  );
}

export default PingContract;
