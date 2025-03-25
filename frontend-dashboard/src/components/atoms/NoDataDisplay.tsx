interface NoDataDisplayProps {
  width: number;
  height: number;
  className?: string;
}

export const NoDataDisplay = ({
  width,
  height,
  className = "",
}: NoDataDisplayProps) => {
  return (
    <div
      className={`flex items-center justify-center border-[3px] border-black rounded-lg p-6 ${className}`}
      style={{ width, height }}
    >
      <p className="text-gray-500 text-lg">No data available</p>
    </div>
  );
};
