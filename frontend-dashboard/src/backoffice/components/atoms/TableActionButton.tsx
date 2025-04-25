interface TableActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
}

const TableActionButton = ({
  label,
  onClick,
  variant = "default",
}: TableActionButtonProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "text-white bg-blue-500 hover:bg-blue-600";
      case "danger":
        return "text-white bg-red-500 hover:bg-red-600";
      default:
        return "text-black bg-white hover:bg-neutral-100";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getVariantClasses()}`}
    >
      {label}
    </button>
  );
};

export default TableActionButton;
