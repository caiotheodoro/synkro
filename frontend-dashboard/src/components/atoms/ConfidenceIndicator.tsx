interface ConfidenceIndicatorProps {
  score: number;
}

const ConfidenceIndicator = ({ score }: ConfidenceIndicatorProps) => {
  return (
    <span
      className={`px-2 py-1 rounded-full ${
        score > 0.7
          ? "bg-green-100 text-green-800"
          : score > 0.4
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {(score * 100).toFixed(1)}%
    </span>
  );
};

export default ConfidenceIndicator;
