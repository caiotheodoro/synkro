import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface ChartCardProps {
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

const ChartCard = ({
  title,
  description,
  linkHref,
  linkText,
  isLoading = false,
  children,
}: ChartCardProps) => {
  return (
    <Card className="hover:shadow-neo transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? <Skeleton className="h-full w-full" /> : children}
      </CardContent>
      <CardFooter className="border-t border-gray-200">
        <Link
          href={linkHref}
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          {linkText}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ChartCard;
