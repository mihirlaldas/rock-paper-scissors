import { icons, names } from "../utils/fixtures";
type Props = {
  setSelectedMove: React.Dispatch<React.SetStateAction<number | null>>;
};
const MovePicker = ({ setSelectedMove }: Props) => {
  return (
    <div className="flex">
      {icons.map((move, i) => (
        <div key={i + names[i]}>
          <button onClick={() => setSelectedMove(i + 1)}>{move}</button>
          <div>{names[i]}</div>
        </div>
      ))}
    </div>
  );
};

export default MovePicker;
