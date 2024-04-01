type Props = {
  prevBalance: string;
  currentBalance: string;
  stake: string;
};
export function to2decimalPlaces(num: string) {
  return parseFloat(parseFloat(num).toFixed(2));
}
export default function Winner({ prevBalance, currentBalance, stake }: Props) {
  let pastBalance = to2decimalPlaces(prevBalance);
  let parsedCurrentBalance = to2decimalPlaces(currentBalance);
  let parsedStake = to2decimalPlaces(stake);
  let result: string;
  if (parsedCurrentBalance > pastBalance) {
    result = "You win !! ETH : " + parsedStake * 2;
  } else if (parsedCurrentBalance < pastBalance) {
    result = "You lost :(    ETH : " + parsedStake;
  } else {
    result = "Its a Tie ";
  }
  return <h2>{result}</h2>;
}
