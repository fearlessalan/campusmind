interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 28, className = "" }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="CampusMind"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
