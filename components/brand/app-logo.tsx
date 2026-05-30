import Image from "next/image";

const PNG_W = 458;
const PNG_H = 225;

type Props = {
  size?: number;
  className?: string;
};

export function AppLogo({ size = 32, className }: Props) {
  const width = Math.round((size * PNG_W) / PNG_H);
  return (
    <Image
      src="/llm-at-scale-logo.png"
      alt="LLM at Scale.AI"
      width={width}
      height={size}
      className={className}
      priority
    />
  );
}
