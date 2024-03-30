import { ethers } from "ethers";

function WaitingForPlayer2({ contract }: { contract: ethers.Contract | null }) {
  if (!contract) {
    return <div>No contract exists yet</div>;
  }
  async function getJ2() {
    const J2 = await contract?.j2();
    return J2;
  }
  const j2 = getJ2();
  if (!j2) {
    return <div>WaitingForPlayer2</div>;
  }
  return <div>Player 2 played</div>;
}

export default WaitingForPlayer2;
