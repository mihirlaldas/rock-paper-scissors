import { ethers } from "ethers";
import Contract from "./RPS.json";

export async function invokeJ2Timeout() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const rpsContractAddress = localStorage
    .getItem("rps-contract-address")
    ?.replace(/['"]+/g, "") as string;
  console.log(rpsContractAddress);
  const rpsContract = new ethers.Contract(
    rpsContractAddress,
    Contract.abi,
    signer
  );
  try {
    const c2 = await rpsContract.c2();
    if (!c2) {
      const tx = await rpsContract.j2Timeout({ estimateGas: 300000 });
      await tx.wait();
    }
  } catch (error) {
    alert(error);
  }
}
export async function invokeJ1Timeout() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const rpsContractAddress = localStorage
    .getItem("rps-contract-address")
    ?.replace(/['"]+/g, "") as string;
  const rpsContract = new ethers.Contract(
    rpsContractAddress,
    Contract.abi,
    signer
  );
  try {
    const contractStake = await rpsContract.stake();
    if (contractStake > 0) {
      const tx = await rpsContract.j1Timeout({ estimateGas: 300000 });
      await tx.wait();
    }
  } catch (error) {
    alert("Error while invoking j1Timeout function :");
  }
}
