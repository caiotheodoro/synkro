import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PageHeaderProps {
  onGenerateClick: () => void;
  isGenerateDisabled: boolean;
}

const PageHeader = ({
  onGenerateClick,
  isGenerateDisabled,
}: PageHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-2">
        <Link href="/analytics/ai">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">AI/ML Predictions Analysis</h1>
      </div>
      <Button
        onClick={onGenerateClick}
        disabled={isGenerateDisabled}
        className="flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Generate New Prediction
      </Button>
    </div>
  );
};

export default PageHeader;
