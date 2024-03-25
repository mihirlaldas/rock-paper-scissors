type Props = {
  prevBalance: string;
  currentBalance: string;
};
export default function Winner({ prevBalance, currentBalance }: Props) {
  let pBalance = parseFloat(prevBalance);
  let cBalance = parseFloat(currentBalance);
  let result: string;
  if (pBalance < cBalance) {
    result = "You win !!";
  } else if (pBalance - cBalance > 1) {
    result = "You losse :(";
  } else {
    result = "Its a Tie ";
  }
  return <h2>{result}</h2>;
}
