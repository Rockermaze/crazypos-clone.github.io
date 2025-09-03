import { ReactNode } from "react";
import { Container } from "./Container";

interface SectionProps {
  children: ReactNode;
  className?: string;
}

export function Section({ children, className = "" }: SectionProps) {
  return (
    <section className={`py-12 sm:py-16 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}
