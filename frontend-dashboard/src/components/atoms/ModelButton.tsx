import { Button } from "@/components/ui/Button";

interface ModelButtonProps {
  name: string;
  isSelected: boolean;
  onClick: () => void;
}

const ModelButton = ({ name, isSelected, onClick }: ModelButtonProps) => {
  return (
    <Button
      variant={isSelected ? "primary" : "outline"}
      onClick={onClick}
      className="w-full"
    >
      {name}
    </Button>
  );
};

export default ModelButton;
