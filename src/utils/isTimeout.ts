import { BigNumberish } from "ethers";
import { ethers } from "ethers";

export function isTimeout(lastAction: BigNumberish): boolean {
  if (!lastAction) {
    return false;
  }
  const lastActionDate = new Date(ethers.toNumber(lastAction) * 1000).getTime();
  const presentDate = new Date().getTime();
  const FIVE_MINUTES = 5 * 60 * 1000;
  const isTimedout = presentDate - lastActionDate > FIVE_MINUTES;
  return isTimedout;
}
